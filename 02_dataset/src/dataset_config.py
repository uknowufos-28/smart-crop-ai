"""
Dataset Configuration & Validation Schema for SmartCropAI.
Defines paths, image verification constraints, and supported crop disease classes.
"""

import os
from dataclasses import dataclass, field
from typing import List, Set


@dataclass(frozen=True)
class DatasetConfig:
    """Read-only configuration for dataset acquisition and verification."""

    # Absolute directory paths relative to module root
    BASE_DIR: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..")
        )
    )
    RAW_DATA_DIR: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "raw")
        )
    )
    PROCESSED_DATA_DIR: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "processed")
        )
    )
    REPORT_PATH: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "audit_report.json")
        )
    )

    # Image Verification Constraints
    SUPPORTED_EXTENSIONS: Set[str] = field(
        default_factory=lambda: {".jpg", ".jpeg", ".png"}
    )
    MIN_WIDTH: int = 224
    MIN_HEIGHT: int = 224
    REQUIRED_CHANNELS: int = 3  # RGB

    # Target Plant Classes for Crop Disease Detection
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

    def validate(self) -> None:
        """Ensures configuration constraints are logically sound."""
        if self.MIN_WIDTH <= 0 or self.MIN_HEIGHT <= 0:
            raise ValueError(
                f"Minimum image dimensions must be positive integers. Got {self.MIN_WIDTH}x{self.MIN_HEIGHT}"
            )
        if not self.TARGET_CLASSES:
            raise ValueError("TARGET_CLASSES list cannot be empty.")
