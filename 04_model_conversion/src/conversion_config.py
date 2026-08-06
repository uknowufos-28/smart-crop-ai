"""
Conversion & Quantization Configuration for SmartCropAI.
Defines paths for trained Keras models, TFLite export destinations, and calibration parameters.
"""

import os
from dataclasses import dataclass, field


@dataclass(frozen=True)
class ConversionConfig:
    """Read-only configuration for TFLite conversion and quantization."""

    # Absolute directory paths
    BASE_DIR: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..")
        )
    )
    KERAS_MODEL_PATH: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "..",
                "..",
                "03_model_training",
                "saved_models",
                "mobilenetv2_crop_disease.keras",
            )
        )
    )
    PROCESSED_DATA_DIR: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "..",
                "..",
                "02_dataset",
                "processed",
                "train",
            )
        )
    )
    OUTPUT_DIR: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "samples")
        )
    )
    REPORT_PATH: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "conversion_summary.json")
        )
    )

    # Quantization Representative Calibration Settings
    REPRESENTATIVE_DATASET_SIZE: int = 50
    IMAGE_HEIGHT: int = 224
    IMAGE_WIDTH: int = 224

    def validate(self) -> None:
        """Ensures configuration paths and calibration counts are sound."""
        if not os.path.exists(self.KERAS_MODEL_PATH):
            raise FileNotFoundError(
                f"Trained Keras model not found at path: {self.KERAS_MODEL_PATH}. Run 03_model_training first."
            )
        if self.REPRESENTATIVE_DATASET_SIZE <= 0:
            raise ValueError("REPRESENTATIVE_DATASET_SIZE must be a positive integer.")
