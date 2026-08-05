"""
Model Training & Architecture Configuration for SmartCropAI.
Defines hyperparameters, MobileNetV2 base settings, and export directory paths.
"""

import os
from dataclasses import dataclass, field
from typing import List, Tuple


@dataclass(frozen=True)
class ModelConfig:
    """Read-only configuration for TensorFlow/Keras training pipeline."""

    # Absolute directory paths
    BASE_DIR: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..")
        )
    )
    PROCESSED_DATA_DIR: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "02_dataset", "processed")
        )
    )
    MODEL_SAVE_DIR: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "saved_models")
        )
    )
    CHECKPOINT_DIR: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "checkpoints")
        )
    )
    LOGS_DIR: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "logs")
        )
    )

    # Input Tensor Specifications
    IMAGE_HEIGHT: int = 224
    IMAGE_WIDTH: int = 224
    CHANNELS: int = 3
    NUM_CLASSES: int = 10

    # Hyperparameters
    BATCH_SIZE: int = 32
    INITIAL_LEARNING_RATE: float = 1e-4
    FINE_TUNE_LEARNING_RATE: float = 1e-5
    INITIAL_EPOCHS: int = 15
    FINE_TUNE_EPOCHS: int = 10
    DROPOUT_RATE: float = 0.3
    DENSE_UNITS: int = 256

    # Target Class Labels (Matches 02_dataset order)
    TARGET_CLASSES: List[str] = field(
        default_factory=lambda: [
            "Tomato___Bacterial_spot",
            "Tomato___Early_blight",
            "Tomato___Late_blight",
            "Tomato___Healthy",
            "Potato___Early_blight",
            "Potato___Late_blight",
            "Potato___Healthy",
            "Corn___Common_rust",
            "Corn___Northern_Leaf_Blight",
            "Corn___Healthy",
        ]
    )

    @property
    def INPUT_SHAPE(self) -> Tuple[int, int, int]:
        """Returns the 3D tensor shape expected by MobileNetV2."""
        return (self.IMAGE_HEIGHT, self.IMAGE_WIDTH, self.CHANNELS)

    def validate(self) -> None:
        """Ensures hyperparameter constraints are valid."""
        if self.INITIAL_LEARNING_RATE <= 0 or self.FINE_TUNE_LEARNING_RATE <= 0:
            raise ValueError("Learning rates must be positive float values.")
        if self.BATCH_SIZE <= 0:
            raise ValueError(f"BATCH_SIZE must be positive. Got {self.BATCH_SIZE}")
        if self.NUM_CLASSES != len(self.TARGET_CLASSES):
            raise ValueError(
                f"NUM_CLASSES ({self.NUM_CLASSES}) does not match TARGET_CLASSES count ({len(self.TARGET_CLASSES)})."
            )
