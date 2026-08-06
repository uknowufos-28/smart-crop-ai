"""
Image Preprocessing, Data Augmentation & Stratified Splitting Engine.
Processes raw leaf images, resizes to 224x224 RGB, applies train-set data augmentation,
partitions dataset into train/val/test splits, and saves output to 02_dataset/processed/.
"""

import json
import logging
import os
import random
import sys
from typing import Any, Dict, List, Tuple
from PIL import Image, ImageEnhance

# Import dataset configuration
from dataset_config import DatasetConfig

# Configure production logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("PreprocessEngine")


class PreprocessAndAugmentEngine:
    """Production preprocessing and augmentation engine for crop leaf images."""

    def __init__(self, config: DatasetConfig):
        """Initializes the engine with validated configuration."""
        self.config = config
        self.config.validate()
        # Seed random number generators for 100% reproducible splits
        random.seed(self.config.RANDOM_SEED)

    def apply_augmentation(self, img: Image.Image) -> Image.Image:
        """Applies stochastic data augmentation to a training image.

        Augmentation Operations:
        - Random Horizontal Flip (50% probability)
        - Random Vertical Flip (30% probability)
        - Random Rotation (-25 to +25 degrees)
        - Random Brightness Adjustment (0.8x to 1.2x)

        Args:
            img: PIL Image in RGB format.

        Returns:
            Augmented PIL Image.
        """
        augmented = img.copy()

        # 1. Random Horizontal Flip
        if random.random() > 0.5:
            augmented = augmented.transpose(Image.FLIP_LEFT_RIGHT)

        # 2. Random Vertical Flip
        if random.random() > 0.7:
            augmented = augmented.transpose(Image.FLIP_TOP_BOTTOM)

        # 3. Random Rotation (-25 deg to +25 deg)
        angle = random.uniform(-25.0, 25.0)
        augmented = augmented.rotate(angle, resample=Image.BICUBIC, expand=False)

        # 4. Random Brightness Enhancement (0.8x to 1.2x factor)
        enhancer = ImageEnhance.Brightness(augmented)
        brightness_factor = random.uniform(0.8, 1.2)
        augmented = enhancer.enhance(brightness_factor)

        return augmented

    def preprocess_image(self, image_path: str) -> Image.Image:
        """Opens, converts to RGB, and resizes image to target 224x224 resolution.

        Args:
            image_path: Absolute path to raw image.

        Returns:
            Preprocessed PIL Image.
        """
        with Image.open(image_path) as img:
            # Ensure 3-channel RGB mode
            if img.mode != "RGB":
                img = img.convert("RGB")

            # High-quality Lanczos anti-aliasing resize to target dimensions
            resized_img = img.resize(
                (self.config.MIN_WIDTH, self.config.MIN_HEIGHT),
                resample=Image.Resampling.LANCZOS,
            )
            return resized_img

    def partition_and_process_dataset(self) -> Dict[str, Any]:
        """Reads raw dataset, performs stratified train/val/test split,
        applies preprocessing + augmentation, and writes output files.

        Returns:
            Processing statistical report dictionary.
        """
        raw_dir = self.config.RAW_DATA_DIR
        processed_dir = self.config.PROCESSED_DATA_DIR

        if not os.path.exists(raw_dir):
            raise FileNotFoundError(
                f"Raw dataset directory '{raw_dir}' not found. Run download_and_verify.py first."
            )

        logger.info(f"Starting dataset preprocessing & splitting from: {raw_dir}")

        split_names = ["train", "val", "test"]
        summary_stats = {
            "processed_directory": processed_dir,
            "split_counts": {split: 0 for split in split_names},
            "class_counts": {split: {} for split in split_names},
        }

        # Inspect raw directories per class
        for class_name in self.config.TARGET_CLASSES:
            class_raw_dir = os.path.join(raw_dir, class_name)
            if not os.path.exists(class_raw_dir):
                logger.warning(f"Class folder '{class_name}' missing in raw data. Skipping.")
                continue

            # Gather all valid raw image files for this class
            image_files = [
                f for f in os.listdir(class_raw_dir)
                if os.path.splitext(f)[1].lower() in self.config.SUPPORTED_EXTENSIONS
            ]

            if not image_files:
                logger.warning(f"No valid images found for class '{class_name}'. Skipping.")
                continue

            # Shuffle deterministically using fixed random seed
            random.shuffle(image_files)

            # Compute split boundaries
            n_total = len(image_files)
            if n_total < 3:
                # For small sample test sets, populate all splits to allow pipeline validation
                train_files = image_files
                val_files = image_files
                test_files = image_files
            else:
                n_train = int(n_total * self.config.TRAIN_RATIO)
                n_val = int(n_total * self.config.VAL_RATIO)
                train_files = image_files[:n_train]
                val_files = image_files[n_train:n_train + n_val]
                test_files = image_files[n_train + n_val:]

            file_splits = {
                "train": train_files,
                "val": val_files,
                "test": test_files,
            }

            # Process each split partition
            for split, files in file_splits.items():
                target_class_dir = os.path.join(processed_dir, split, class_name)
                os.makedirs(target_class_dir, exist_ok=True)

                for idx, file_name in enumerate(files):
                    src_path = os.path.join(class_raw_dir, file_name)

                    try:
                        # 1. Base Preprocessing (Resize & RGB Convert)
                        base_img = self.preprocess_image(src_path)

                        # Save standard image
                        base_dest_name = f"{class_name}_{split}_{idx:05d}.jpg"
                        base_dest_path = os.path.join(target_class_dir, base_dest_name)
                        base_img.save(base_dest_path, format="JPEG", quality=95)

                        summary_stats["split_counts"][split] += 1
                        summary_stats["class_counts"][split][class_name] = (
                            summary_stats["class_counts"][split].get(class_name, 0) + 1
                        )

                        # 2. Data Augmentation (ONLY on Train set)
                        if split == "train":
                            for aug_idx in range(self.config.AUGMENT_FACTOR):
                                aug_img = self.apply_augmentation(base_img)
                                aug_dest_name = f"{class_name}_aug_{aug_idx}_{idx:05d}.jpg"
                                aug_dest_path = os.path.join(target_class_dir, aug_dest_name)
                                aug_img.save(aug_dest_path, format="JPEG", quality=95)

                                summary_stats["split_counts"][split] += 1
                                summary_stats["class_counts"][split][class_name] += 1

                    except Exception as err:
                        logger.error(f"Failed processing image [{src_path}]: {str(err)}")

        # Write summary JSON report
        summary_path = os.path.join(self.config.BASE_DIR, "processing_summary.json")
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary_stats, f, indent=2)

        logger.info(
            f"Preprocessing & Partitioning complete! Summary: {summary_stats['split_counts']}. Saved to: {summary_path}"
        )
        return summary_stats


if __name__ == "__main__":
    config = DatasetConfig()
    engine = PreprocessAndAugmentEngine(config)
    summary = engine.partition_and_process_dataset()
    print("\n--- DATASET PROCESSING SUMMARY ---")
    print(f"Train Images (Original + Augmented): {summary['split_counts']['train']}")
    print(f"Validation Images                   : {summary['split_counts']['val']}")
    print(f"Test Images                         : {summary['split_counts']['test']}")
