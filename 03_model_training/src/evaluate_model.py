"""
Production Model Evaluation, Confusion Matrix & Metrics Suite for SmartCropAI.
Loads trained MobileNetV2 models, evaluates performance on held-out test data,
calculates Precision/Recall/F1 metrics, and plots confusion matrix heatmaps.
"""

import json
import logging
import os
import sys
from typing import Any, Dict, List, Tuple
import matplotlib.pyplot as plt
import numpy as np

# Set headless backend for matplotlib before importing pyplot
import matplotlib
matplotlib.use("Agg")

from sklearn.metrics import classification_report, confusion_matrix
import tensorflow as tf

# Import model configuration
from model_config import ModelConfig

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("Evaluator")


class ModelEvaluator:
    """Production evaluation engine for plant disease classification models."""

    def __init__(self, config: ModelConfig):
        """Initializes evaluator with validated configuration."""
        self.config = config
        self.config.validate()

    def load_test_dataset(self) -> Tuple[tf.data.Dataset, List[str]]:
        """Loads held-out test image dataset from 02_dataset/processed/test/."""
        processed_dir = self.config.PROCESSED_DATA_DIR
        test_dir = os.path.join(processed_dir, "test")

        if not os.path.exists(test_dir):
            raise FileNotFoundError(
                f"Test dataset directory '{test_dir}' not found. Run 02_dataset pipeline first."
            )

        logger.info(f"Loading test dataset from: {test_dir}")

        test_ds = tf.keras.utils.image_dataset_from_directory(
            test_dir,
            labels="inferred",
            label_mode="categorical",
            image_size=(self.config.IMAGE_HEIGHT, self.config.IMAGE_WIDTH),
            batch_size=self.config.BATCH_SIZE,
            shuffle=False,
        )

        class_names = test_ds.class_names
        return test_ds, class_names

    def evaluate(self, model_path: str = None) -> Dict[str, Any]:
        """Evaluates trained model, computes metrics, and saves evaluation report."""
        if model_path is None:
            model_path = os.path.join(self.config.MODEL_SAVE_DIR, "mobilenetv2_crop_disease.keras")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Trained model not found at path: {model_path}")

        logger.info(f"Loading trained model for evaluation: {model_path}")
        model = tf.keras.models.load_model(model_path)

        test_ds, class_names = self.load_test_dataset()

        # Gather true labels and model predictions
        y_true = []
        y_pred = []

        logger.info("Executing inference pass over test dataset...")
        for images, labels in test_ds:
            preds = model.predict(images, verbose=0)
            y_true.extend(np.argmax(labels.numpy(), axis=1))
            y_pred.extend(np.argmax(preds, axis=1))

        y_true = np.array(y_true)
        y_pred = np.array(y_pred)

        # 1. Compute Scikit-Learn Classification Report
        report_dict = classification_report(
            y_true,
            y_pred,
            target_names=class_names,
            output_dict=True,
            zero_division=0,
        )

        # 2. Compute Confusion Matrix
        cm = confusion_matrix(y_true, y_pred)

        # 3. Plot and Save Confusion Matrix Heatmap
        fig, ax = plt.subplots(figsize=(10, 8))
        im = ax.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
        ax.figure.colorbar(im, ax=ax)
        ax.set(
            xticks=np.arange(cm.shape[1]),
            yticks=np.arange(cm.shape[0]),
            xticklabels=class_names,
            yticklabels=class_names,
            title="SmartCropAI Disease Classification Confusion Matrix",
            ylabel="True Label",
            xlabel="Predicted Label",
        )
        plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")

        # Annotate cell text values
        thresh = cm.max() / 2.0 if cm.max() > 0 else 1.0
        for i in range(cm.shape[0]):
            for j in range(cm.shape[1]):
                ax.text(
                    j, i, format(cm[i, j], "d"),
                    ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "black",
                )

        fig.tight_layout()
        cm_plot_path = os.path.join(self.config.BASE_DIR, "confusion_matrix.png")
        plt.savefig(cm_plot_path, dpi=300)
        plt.close()
        logger.info(f"Saved confusion matrix plot to: {cm_plot_path}")

        # 4. Save JSON Report
        eval_summary = {
            "model_evaluated": model_path,
            "total_test_samples": int(len(y_true)),
            "accuracy": report_dict["accuracy"],
            "macro_avg_f1_score": report_dict["macro avg"]["f1-score"],
            "weighted_avg_f1_score": report_dict["weighted avg"]["f1-score"],
            "per_class_metrics": {
                cls: {
                    "precision": report_dict[cls]["precision"],
                    "recall": report_dict[cls]["recall"],
                    "f1_score": report_dict[cls]["f1-score"],
                    "support": report_dict[cls]["support"],
                }
                for cls in class_names if cls in report_dict
            },
        }

        report_json_path = os.path.join(self.config.BASE_DIR, "evaluation_report.json")
        with open(report_json_path, "w", encoding="utf-8") as f:
            json.dump(eval_summary, f, indent=2)

        logger.info(f"Evaluation complete! Accuracy: {eval_summary['accuracy']:.4f}. Report saved to: {report_json_path}")
        return eval_summary


if __name__ == "__main__":
    config = ModelConfig()
    evaluator = ModelEvaluator(config)
    summary = evaluator.evaluate()
    print("\n--- MODEL EVALUATION SUMMARY ---")
    print(f"Test Samples Scanned : {summary['total_test_samples']}")
    print(f"Overall Accuracy     : {summary['accuracy'] * 100:.2f}%")
    print(f"Macro F1 Score       : {summary['macro_avg_f1_score']:.4f}")
