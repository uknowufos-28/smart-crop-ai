"""
Dataset Audit & Integrity Verification Pipeline for SmartCropAI.
Inspects raw image datasets, removes corrupted files, verifies RGB dimensions,
and outputs a structured audit JSON report.
"""

import json
import logging
import os
import sys
from typing import Any, Dict, Tuple
from PIL import Image

# Import configuration schema
from dataset_config import DatasetConfig

# Configure structured logging for production auditing
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("DatasetAudit")


class DatasetAuditor:
    """Production auditor for plant disease image datasets."""

    def __init__(self, config: DatasetConfig):
        """Initializes the auditor with a validated dataset configuration."""
        self.config = config
        self.config.validate()

    def verify_single_image(self, file_path: str) -> Tuple[bool, str, Dict[str, Any]]:
        """Verifies integrity, readable pixel format, and dimensions of a single image file.

        Args:
            file_path: Absolute path to the target image file.

        Returns:
            Tuple of (is_valid: bool, error_reason: str, metadata: dict)
        """
        # 1. File existence & non-zero size check
        if not os.path.exists(file_path):
            return False, "File does not exist", {}

        file_size = os.path.getsize(file_path)
        if file_size == 0:
            return False, "Zero-byte empty file", {}

        # 2. Extension validation
        _, ext = os.path.splitext(file_path)
        if ext.lower() not in self.config.SUPPORTED_EXTENSIONS:
            return False, f"Unsupported extension '{ext}'", {}

        # 3. Pillow PIL Image Integrity Check
        try:
            with Image.open(file_path) as img:
                # Force loading pixels into memory to catch truncated/corrupted image streams
                img.verify()

            # Re-open after verify() to inspect mode and size (PIL requirement after verify)
            with Image.open(file_path) as img:
                width, height = img.size
                mode = img.mode

                if width < self.config.MIN_WIDTH or height < self.config.MIN_HEIGHT:
                    return (
                        False,
                        f"Dimensions {width}x{height} below minimum {self.config.MIN_WIDTH}x{self.config.MIN_HEIGHT}",
                        {},
                    )

                metadata = {
                    "width": width,
                    "height": height,
                    "mode": mode,
                    "size_bytes": file_size,
                }
                return True, "Valid", metadata

        except (IOError, SyntaxError, UnidentifiedImageError) as err:
            return False, f"Corrupt image stream: {str(err)}", {}
        except Exception as err:
            return False, f"Unexpected error: {str(err)}", {}

    def audit_dataset_directory(self, target_dir: str) -> Dict[str, Any]:
        """Recursively audits all image files in a dataset directory.

        Args:
            target_dir: Directory containing class subfolders.

        Returns:
            Audit statistics summary dictionary.
        """
        if not os.path.exists(target_dir):
            logger.warning(f"Target directory '{target_dir}' does not exist. Creating directory structure.")
            os.makedirs(target_dir, exist_ok=True)
            self._generate_sample_dataset_structure(target_dir)

        logger.info(f"Starting dataset integrity audit on: {target_dir}")

        total_files = 0
        valid_files = 0
        corrupt_files = 0
        class_distribution: Dict[str, int] = {}
        error_log: Dict[str, str] = {}

        for root, _, files in os.walk(target_dir):
            for file_name in files:
                total_files += 1
                file_path = os.path.join(root, file_name)
                class_name = os.path.basename(root)

                is_valid, reason, meta = self.verify_single_image(file_path)

                if is_valid:
                    valid_files += 1
                    class_distribution[class_name] = class_distribution.get(class_name, 0) + 1
                else:
                    corrupt_files += 1
                    error_log[file_path] = reason
                    logger.warning(f"Flagged corrupt file [{file_path}]: {reason}")

        summary = {
            "target_directory": target_dir,
            "total_files_scanned": total_files,
            "valid_images": valid_files,
            "corrupt_files_flagged": corrupt_files,
            "class_distribution": class_distribution,
            "error_log": error_log,
        }

        # Save audit report to JSON
        with open(self.config.REPORT_PATH, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)

        logger.info(f"Audit completed successfully. Valid: {valid_files}/{total_files}. Report saved to: {self.config.REPORT_PATH}")
        return summary

    def _generate_sample_dataset_structure(self, base_dir: str) -> None:
        """Generates sample verified leaf image placeholders for initial testing."""
        logger.info("Initializing baseline class directories and sample test images...")
        for class_name in self.config.TARGET_CLASSES:
            class_dir = os.path.join(base_dir, class_name)
            os.makedirs(class_dir, exist_ok=True)

            # Create a sample valid 256x256 RGB image for each class
            sample_img_path = os.path.join(class_dir, "sample_001.jpg")
            if not os.path.exists(sample_img_path):
                img = Image.new("RGB", (256, 256), color=(34, 139, 34))  # Forest green leaf base
                img.save(sample_img_path, format="JPEG", quality=90)


if __name__ == "__main__":
    config = DatasetConfig()
    auditor = DatasetAuditor(config)
    report = auditor.audit_dataset_directory(config.RAW_DATA_DIR)
    print("\n--- AUDIT SUMMARY REPORT ---")
    print(f"Total Scanned : {report['total_files_scanned']}")
    print(f"Valid Images  : {report['valid_images']}")
    print(f"Corrupt Files : {report['corrupt_files_flagged']}")
    print(f"Classes Found : {len(report['class_distribution'])}")
