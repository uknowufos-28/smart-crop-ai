"""Train and evaluate a PlantDoc MobileNetV3 classifier on an NVIDIA GPU."""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import random
import shutil
import time
from pathlib import Path
from typing import Any

import numpy as np
import torch
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split
from torch import nn
from torch.utils.data import DataLoader, Subset
from PIL import Image
from torchvision import datasets, models, transforms
from torchvision.models import MobileNet_V3_Small_Weights


LOGGER = logging.getLogger("plantdoc-training")
IMAGE_SIZE = 224
SEED = 42


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dataset",
        type=Path,
        default=Path(__file__).resolve().parents[2]
        / "02_dataset"
        / "raw_download"
        / "PlantDoc-Dataset",
        help="PlantDoc clone containing train/ and test/ class folders.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "saved_models" / "plantdoc",
        help="Directory for checkpoint, TFLite model, labels, and evaluation report.",
    )
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--patience", type=int, default=4)
    parser.add_argument(
        "--evaluate-checkpoint",
        action="store_true",
        help="Skip training and export/evaluate an existing best checkpoint.",
    )
    return parser.parse_args()


def make_model(class_count: int) -> nn.Module:
    weights = MobileNet_V3_Small_Weights.DEFAULT
    model = models.mobilenet_v3_small(weights=weights)
    in_features = model.classifier[-1].in_features
    model.classifier[-1] = nn.Linear(in_features, class_count)
    return model


def train_epoch(
    model: nn.Module,
    loader: DataLoader,
    loss_fn: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
    scaler: torch.amp.GradScaler,
) -> tuple[float, float]:
    model.train()
    loss_total = 0.0
    correct = 0
    samples = 0
    for images, labels in loader:
        images = images.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)
        optimizer.zero_grad(set_to_none=True)
        with torch.autocast(
            device_type="cuda", dtype=torch.float16, enabled=device.type == "cuda"
        ):
            logits = model(images)
            loss = loss_fn(logits, labels)
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
        batch_size = labels.size(0)
        loss_total += loss.item() * batch_size
        correct += (logits.argmax(1) == labels).sum().item()
        samples += batch_size
    return loss_total / samples, correct / samples


@torch.inference_mode()
def evaluate(
    model: nn.Module,
    loader: DataLoader,
    device: torch.device,
    class_names: list[str],
) -> dict[str, Any]:
    model.eval()
    y_true: list[int] = []
    y_pred: list[int] = []
    for images, labels in loader:
        logits = model(images.to(device, non_blocking=True))
        y_true.extend(labels.tolist())
        y_pred.extend(logits.argmax(1).cpu().tolist())
    labels = list(range(len(class_names)))
    return {
        "sample_count": len(y_true),
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "macro_f1": float(f1_score(y_true, y_pred, labels=labels, average="macro", zero_division=0)),
        "classification_report": classification_report(
            y_true,
            y_pred,
            labels=labels,
            target_names=class_names,
            output_dict=True,
            zero_division=0,
        ),
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=labels).tolist(),
    }


def export_tflite(model: nn.Module, output_path: Path, device: torch.device) -> None:
    try:
        import onnx2tf
    except ImportError as error:
        raise RuntimeError(
            "onnx2tf is required to export the on-device model. "
            "Install the packages in requirements-plantdoc-gpu.txt."
        ) from error

    model = model.to("cpu").eval()

    class FlattenedInputModel(nn.Module):
        def __init__(self, classifier: nn.Module) -> None:
            super().__init__()
            self.classifier = classifier

        def forward(self, flattened_image: torch.Tensor) -> torch.Tensor:
            image = flattened_image.reshape(1, 3, IMAGE_SIZE, IMAGE_SIZE)
            return self.classifier(image)

    export_model = FlattenedInputModel(model).eval()
    sample = (torch.zeros(1, 3 * IMAGE_SIZE * IMAGE_SIZE, dtype=torch.float32),)
    onnx_path = output_path.with_suffix(".onnx")
    conversion_dir = output_path.parent / f"{output_path.stem}_conversion"
    try:
        with torch.inference_mode():
            torch.onnx.export(
                export_model,
                sample,
                str(onnx_path),
                input_names=["image"],
                output_names=["logits"],
                opset_version=17,
                dynamo=False,
            )
        onnx2tf.convert(
            input_onnx_file_path=str(onnx_path),
            output_folder_path=str(conversion_dir),
            not_use_onnxsim=True,
        )
        candidates = list(conversion_dir.glob("*float32.tflite"))
        if len(candidates) != 1:
            raise RuntimeError(
                "Expected exactly one float32 TFLite export from onnx2tf; "
                f"found {len(candidates)}."
            )
        shutil.copy2(candidates[0], output_path)
    except Exception as error:
        raise RuntimeError(f"ONNX-to-TFLite conversion failed: {error}") from error
    finally:
        model.to(device)


def evaluate_tflite(
    model_path: Path,
    loader: DataLoader,
    class_names: list[str],
) -> dict[str, Any]:
    try:
        import tensorflow as tf
    except ImportError as error:
        raise RuntimeError(
            "TensorFlow Lite is required to validate the exported model."
        ) from error

    interpreter = tf.lite.Interpreter(model_path=str(model_path))
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()[0]
    output_details = interpreter.get_output_details()[0]
    input_shape = tuple(input_details["shape"])
    nchw_shape = (1, 3, IMAGE_SIZE, IMAGE_SIZE)
    nhwc_shape = (1, IMAGE_SIZE, IMAGE_SIZE, 3)
    nchw_flat_shape = (1, 3 * IMAGE_SIZE * IMAGE_SIZE)
    if input_shape not in (nchw_shape, nhwc_shape, nchw_flat_shape):
        raise RuntimeError(
            f"Unexpected TFLite input shape {input_details['shape']}; "
            f"expected {nchw_shape}, {nhwc_shape}, or {nchw_flat_shape}."
        )
    expected_output_shape = (1, len(class_names))
    if tuple(output_details["shape"]) != expected_output_shape:
        raise RuntimeError(
            f"Unexpected TFLite output shape {output_details['shape']}; "
            f"expected {expected_output_shape}."
        )
    if input_details["dtype"] != np.float32:
        raise RuntimeError(
            f"Unexpected TFLite input dtype {input_details['dtype']}; expected float32."
        )
    if output_details["dtype"] != np.float32:
        raise RuntimeError(
            f"Unexpected TFLite output dtype {output_details['dtype']}; expected float32."
        )

    y_true: list[int] = []
    y_pred: list[int] = []
    for images, labels in loader:
        for image, label in zip(images, labels):
            model_image = image.numpy()
            if input_shape == nhwc_shape:
                model_image = np.transpose(model_image, (1, 2, 0))
            elif input_shape == nchw_flat_shape:
                model_image = model_image.reshape(-1)
            interpreter.set_tensor(
                input_details["index"], model_image[None, ...].astype(np.float32)
            )
            interpreter.invoke()
            logits = interpreter.get_tensor(output_details["index"])[0]
            y_true.append(int(label))
            y_pred.append(int(np.argmax(logits)))

    labels = list(range(len(class_names)))
    return {
        "sample_count": len(y_true),
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "macro_f1": float(f1_score(y_true, y_pred, labels=labels, average="macro", zero_division=0)),
        "input_shape": [int(dimension) for dimension in input_shape],
        "input_layout": "NHWC" if input_shape == nhwc_shape else "NCHW",
        "classification_report": classification_report(
            y_true,
            y_pred,
            labels=labels,
            target_names=class_names,
            output_dict=True,
            zero_division=0,
        ),
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=labels).tolist(),
    }


def main() -> None:
    args = parse_args()
    if (
        (not args.evaluate_checkpoint and args.epochs <= 0)
        or args.batch_size <= 0
        or args.patience <= 0
    ):
        raise ValueError("epochs, batch size, and patience must be positive.")
    if not torch.cuda.is_available():
        raise RuntimeError(
            "CUDA is unavailable. This run is configured to train on the NVIDIA GPU; "
            "check the NVIDIA driver and install the CUDA-enabled PyTorch build."
        )

    random.seed(SEED)
    np.random.seed(SEED)
    torch.manual_seed(SEED)
    torch.cuda.manual_seed_all(SEED)
    torch.backends.cudnn.benchmark = True
    device = torch.device("cuda")
    LOGGER.info("Training on %s", torch.cuda.get_device_name(0))

    train_dir = args.dataset / "train"
    test_dir = args.dataset / "test"
    if not train_dir.is_dir() or not test_dir.is_dir():
        raise FileNotFoundError(
            f"Expected PlantDoc train/ and test/ folders beneath {args.dataset}"
        )

    weights = MobileNet_V3_Small_Weights.DEFAULT
    normalization = transforms.Normalize(
        mean=weights.transforms().mean, std=weights.transforms().std
    )
    train_transform = transforms.Compose(
        [
            transforms.RandomResizedCrop(IMAGE_SIZE, scale=(0.75, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.12),
            transforms.ToTensor(),
            normalization,
        ]
    )
    eval_transform = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(IMAGE_SIZE),
            transforms.ToTensor(),
            normalization,
        ]
    )
    train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
    train_eval_dataset = datasets.ImageFolder(train_dir, transform=eval_transform)
    test_dataset = datasets.ImageFolder(test_dir, transform=eval_transform)

    class_names = train_dataset.classes
    training_class_to_index = train_dataset.class_to_idx
    unknown_test_classes = sorted(set(test_dataset.classes) - set(class_names))
    if unknown_test_classes:
        raise ValueError(
            "PlantDoc test split contains classes absent from training: "
            f"{unknown_test_classes}"
        )
    test_samples = [
        (image_path, training_class_to_index[Path(image_path).parent.name])
        for image_path, _ in test_dataset.samples
    ]
    test_dataset.classes = class_names
    test_dataset.class_to_idx = training_class_to_index.copy()
    test_dataset.samples = test_samples
    test_dataset.imgs = test_samples
    test_dataset.targets = [label for _, label in test_samples]
    if len(class_names) < 2:
        raise ValueError("At least two PlantDoc classes are required.")
    test_labels_by_hash: dict[str, set[int]] = {}
    for image_path, label in test_dataset.samples:
        try:
            with Image.open(image_path) as image:
                image.verify()
        except Exception as error:
            raise ValueError(f"Invalid image in PlantDoc test split: {image_path}") from error
        digest = hashlib.sha256(Path(image_path).read_bytes()).hexdigest()
        test_labels_by_hash.setdefault(digest, set()).add(label)

    source_training_image_count = len(train_dataset)
    filtered_train_samples: list[tuple[str, int]] = []
    excluded_train_duplicates = 0
    conflicting_duplicate_labels = 0
    for image_path, label in train_dataset.samples:
        try:
            with Image.open(image_path) as image:
                image.verify()
        except Exception as error:
            raise ValueError(f"Invalid image in PlantDoc train split: {image_path}") from error
        digest = hashlib.sha256(Path(image_path).read_bytes()).hexdigest()
        matching_test_labels = test_labels_by_hash.get(digest)
        if matching_test_labels is not None:
            excluded_train_duplicates += 1
            conflicting_duplicate_labels += int(label not in matching_test_labels)
            continue
        filtered_train_samples.append((image_path, label))

    train_dataset.samples = filtered_train_samples
    train_dataset.imgs = filtered_train_samples
    train_dataset.targets = [label for _, label in filtered_train_samples]
    train_eval_dataset.samples = filtered_train_samples
    train_eval_dataset.imgs = filtered_train_samples
    train_eval_dataset.targets = train_dataset.targets.copy()
    if excluded_train_duplicates:
        LOGGER.warning(
            "Excluded %d exact train/test duplicate images from training; "
            "%d have conflicting folder labels. The official test copies are retained.",
            excluded_train_duplicates,
            conflicting_duplicate_labels,
        )

    training_class_counts = np.bincount(
        train_dataset.targets, minlength=len(class_names)
    )
    test_class_counts = np.bincount(
        test_dataset.targets, minlength=len(class_names)
    )
    if np.any(training_class_counts < 2) or len(test_dataset) == 0:
        raise ValueError(
            "Every class must have at least two training images after excluding "
            "train/test duplicates, and the official test split must contain images."
        )

    indices = np.arange(len(train_dataset))
    train_indices, validation_indices = train_test_split(
        indices,
        test_size=0.2,
        random_state=SEED,
        stratify=train_dataset.targets,
    )
    train_loader = DataLoader(
        Subset(train_dataset, train_indices.tolist()),
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=args.workers,
        pin_memory=True,
    )
    validation_loader = DataLoader(
        Subset(train_eval_dataset, validation_indices.tolist()),
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.workers,
        pin_memory=True,
    )
    test_loader = DataLoader(
        test_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.workers,
        pin_memory=True,
    )
    LOGGER.info(
        "PlantDoc: %d training, %d validation, %d official test images; %d classes",
        len(train_indices),
        len(validation_indices),
        len(test_dataset),
        len(class_names),
    )

    model = make_model(len(class_names)).to(device)
    for parameter in model.features.parameters():
        parameter.requires_grad = False
    for parameter in model.classifier.parameters():
        parameter.requires_grad = True

    optimizer = torch.optim.AdamW(
        (parameter for parameter in model.parameters() if parameter.requires_grad),
        lr=1e-3,
        weight_decay=1e-4,
    )
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="max", factor=0.25, patience=2
    )
    loss_fn = nn.CrossEntropyLoss()
    scaler = torch.amp.GradScaler("cuda")
    args.output.mkdir(parents=True, exist_ok=True)
    checkpoint_path = args.output / "plantdoc_mobilenetv3_small.pt"
    best_validation_macro_f1 = -1.0
    epochs_without_improvement = 0
    history: list[dict[str, float]] = []
    head_epochs = min(3, args.epochs - 1) if args.epochs > 1 else 1

    if args.evaluate_checkpoint:
        if not checkpoint_path.is_file():
            raise FileNotFoundError(
                f"Cannot evaluate checkpoint because it does not exist: {checkpoint_path}"
            )
        checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
        if checkpoint.get("class_names") != class_names or checkpoint.get("image_size") != IMAGE_SIZE:
            raise ValueError("Checkpoint class order or image size does not match this dataset.")
        if (
            checkpoint.get("normalization_mean") != list(weights.transforms().mean)
            or checkpoint.get("normalization_std") != list(weights.transforms().std)
        ):
            raise ValueError("Checkpoint image normalization does not match the app pipeline.")
        model.load_state_dict(checkpoint["state_dict"])
        model.to(device).eval()
        validation = evaluate(model, validation_loader, device, class_names)
        best_validation_macro_f1 = float(
            checkpoint.get("validation_macro_f1", validation["macro_f1"])
        )
        history = checkpoint.get("training_history", [])
        if not isinstance(history, list):
            raise ValueError("Checkpoint training history has an invalid format.")
        LOGGER.info("Loaded best checkpoint for evaluation without retraining.")
    else:
        for epoch in range(1, args.epochs + 1):
            start = time.perf_counter()
            train_loss, train_accuracy = train_epoch(
                model, train_loader, loss_fn, optimizer, device, scaler
            )
            validation = evaluate(model, validation_loader, device, class_names)
            scheduler.step(validation["macro_f1"])
            row = {
                "epoch": epoch,
                "train_loss": train_loss,
                "train_accuracy": train_accuracy,
                "validation_accuracy": validation["accuracy"],
                "validation_macro_f1": validation["macro_f1"],
                "epoch_seconds": time.perf_counter() - start,
            }
            history.append(row)
            LOGGER.info(
                "Epoch %d/%d loss=%.4f train_acc=%.3f val_acc=%.3f val_macro_f1=%.3f",
                epoch,
                args.epochs,
                train_loss,
                train_accuracy,
                validation["accuracy"],
                validation["macro_f1"],
            )
            if validation["macro_f1"] > best_validation_macro_f1:
                best_validation_macro_f1 = validation["macro_f1"]
                epochs_without_improvement = 0
                torch.save(
                    {
                        "state_dict": model.cpu().state_dict(),
                        "class_names": class_names,
                        "image_size": IMAGE_SIZE,
                        "normalization_mean": list(weights.transforms().mean),
                        "normalization_std": list(weights.transforms().std),
                        "validation_macro_f1": best_validation_macro_f1,
                        "training_history": history.copy(),
                    },
                    checkpoint_path,
                )
                model.to(device)
            else:
                epochs_without_improvement += 1
                if epochs_without_improvement >= args.patience:
                    LOGGER.info("Early stopping after %d epochs without improvement.", args.patience)
                    break
            if epoch == head_epochs and head_epochs < args.epochs:
                for parameter in model.features[-2:].parameters():
                    parameter.requires_grad = True
                optimizer = torch.optim.AdamW(
                    (
                        parameter
                        for parameter in model.parameters()
                        if parameter.requires_grad
                    ),
                    lr=2e-5,
                    weight_decay=1e-4,
                )
                scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
                    optimizer, mode="max", factor=0.25, patience=2
                )
                epochs_without_improvement = 0
                LOGGER.info(
                    "Fine-tuning classifier and final MobileNetV3 feature blocks at lower learning rate."
                )

        checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
        model.load_state_dict(checkpoint["state_dict"])
        model.to(device).eval()
    official_test = evaluate(model, test_loader, device, class_names)
    tflite_path = args.output / "plantdoc_mobilenetv3_small.tflite"
    export_tflite(model, tflite_path, device)
    tflite_test = evaluate_tflite(tflite_path, test_loader, class_names)

    report = {
        "status": "experimental_public_dataset_only_not_field_validated",
        "dataset": "PlantDoc",
        "dataset_url": "https://github.com/pratikkayal/PlantDoc-Dataset",
        "dataset_license": "CC BY 4.0; cite the dataset authors and retain attribution.",
        "citation": (
            "Singh, D., Jain, N., Jain, P., Kayal, P., Kumawat, S., & Batra, N. "
            "(2020). PlantDoc: A Dataset for Visual Plant Disease Detection. "
            "CoDS-COMAD 2020. https://doi.org/10.1145/3371158.3371196"
        ),
        "seed": SEED,
        "device": torch.cuda.get_device_name(0),
        "torch_version": torch.__version__,
        "image_size": IMAGE_SIZE,
        "class_order": class_names,
        "class_to_index": {name: index for index, name in enumerate(class_names)},
        "source_training_image_count": source_training_image_count,
        "excluded_train_test_exact_duplicates": excluded_train_duplicates,
        "excluded_duplicates_with_conflicting_labels": conflicting_duplicate_labels,
        "train_image_count": len(train_indices),
        "validation_image_count": len(validation_indices),
        "train_images_by_class": {
            name: int(sum(label == index for label in np.asarray(train_dataset.targets)[train_indices]))
            for index, name in enumerate(class_names)
        },
        "official_test_images_by_class": {
            name: int(sum(label == index for label in test_dataset.targets))
            for index, name in enumerate(class_names)
        },
        "official_test": official_test,
        "tflite_official_test": tflite_test,
        "training_history": history,
        "validation_selection_macro_f1": best_validation_macro_f1,
        "evaluated_existing_checkpoint": args.evaluate_checkpoint,
        "model_file": tflite_path.name,
        "model_size_bytes": tflite_path.stat().st_size,
        "tflite_input_shape": tflite_test["input_shape"],
        "limitations": [
            "PlantDoc is an internet-sourced public dataset, not a Tamil Nadu farm dataset.",
            "The output classes are only PlantDoc's folder labels; this model does not recognize every leaf.",
            "No diagnostic or treatment claim is certified by these results.",
            "Run Android inference and real-device accuracy/latency checks before app deployment.",
        ],
    }
    (args.output / "evaluation_report.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    (args.output / "class_labels.json").write_text(
        json.dumps(
            {
                "classes": class_names,
                "class_to_index": report["class_to_index"],
                "normalization_mean": list(weights.transforms().mean),
                "normalization_std": list(weights.transforms().std),
                "image_size": IMAGE_SIZE,
                "input_layout": tflite_test["input_layout"],
                "dataset_license": "CC BY 4.0",
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    LOGGER.info(
        "Official PlantDoc test accuracy=%.3f macro_f1=%.3f",
        official_test["accuracy"],
        official_test["macro_f1"],
    )
    LOGGER.info("TFLite model saved to %s (%d bytes)", tflite_path, tflite_path.stat().st_size)
    LOGGER.info("Evaluation report saved to %s", args.output / "evaluation_report.json")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
    )
    main()
