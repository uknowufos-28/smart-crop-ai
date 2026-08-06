"""
TensorFlow Lite Model Conversion & Post-Training Quantization Engine.
Converts Keras MobileNetV2 models into optimized .tflite formats:
1. Float32 Baseline
2. Float16 Quantized
3. Full INT8 Quantized (with Representative Calibration Generator)
"""

import json
import logging
import os
import sys
from typing import Any, Dict, Generator
import numpy as np

# Set headless backend for matplotlib if used
import tensorflow as tf
from PIL import Image

# Import conversion configuration
from conversion_config import ConversionConfig

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("TFLiteConverter")


class TFLiteConversionEngine:
    """Production TFLite converter & post-training quantization engine."""

    def __init__(self, config: ConversionConfig):
        """Initializes engine with validated configuration."""
        self.config = config
        self.config.validate()
        os.makedirs(self.config.OUTPUT_DIR, exist_ok=True)

    def representative_dataset_gen(self) -> Generator[list, None, None]:
        """Generates representative calibration image tensors for INT8 quantization.

        Yields:
            List containing a single preprocessed [1, 224, 224, 3] float32 image tensor.
        """
        train_dir = self.config.PROCESSED_DATA_DIR
        count = 0

        for root, _, files in os.walk(train_dir):
            for file_name in files:
                if file_name.lower().endswith((".jpg", ".jpeg", ".png")):
                    file_path = os.path.join(root, file_name)
                    try:
                        with Image.open(file_path) as img:
                            if img.mode != "RGB":
                                img = img.convert("RGB")
                            img = img.resize(
                                (self.config.IMAGE_WIDTH, self.config.IMAGE_HEIGHT),
                                resample=Image.Resampling.LANCZOS,
                            )
                            # Convert PIL image to numpy array [224, 224, 3] in [0, 255] float32
                            img_array = np.array(img, dtype=np.float32)
                            # Add batch dimension [1, 224, 224, 3]
                            input_tensor = np.expand_dims(img_array, axis=0)

                            yield [input_tensor]
                            count += 1
                            if count >= self.config.REPRESENTATIVE_DATASET_SIZE:
                                return
                    except Exception as err:
                        logger.warning(f"Error reading calibration sample [{file_path}]: {err}")

    def convert_float32(self, keras_model: tf.keras.Model) -> str:
        """Converts Keras model to unquantized Float32 TFLite binary."""
        logger.info("Converting model to Float32 TFLite format...")
        converter = tf.lite.TFLiteConverter.from_keras_model(keras_model)
        tflite_model = converter.convert()

        out_path = os.path.join(self.config.OUTPUT_DIR, "crop_disease_model_float32.tflite")
        with open(out_path, "wb") as f:
            f.write(tflite_model)

        logger.info(f"Float32 TFLite model exported to: {out_path}")
        return out_path

    def convert_float16(self, keras_model: tf.keras.Model) -> str:
        """Converts Keras model to Float16 Post-Training Quantized TFLite binary."""
        logger.info("Converting model to Float16 Quantized TFLite format...")
        converter = tf.lite.TFLiteConverter.from_keras_model(keras_model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]
        tflite_model = converter.convert()

        out_path = os.path.join(self.config.OUTPUT_DIR, "crop_disease_model_fp16.tflite")
        with open(out_path, "wb") as f:
            f.write(tflite_model)

        logger.info(f"Float16 TFLite model exported to: {out_path}")
        return out_path

    def convert_int8(self, keras_model: tf.keras.Model) -> str:
        """Converts Keras model to Full INT8 Post-Training Quantized TFLite binary."""
        logger.info("Converting model to Full INT8 Quantized TFLite format using calibration generator...")
        converter = tf.lite.TFLiteConverter.from_keras_model(keras_model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.representative_dataset = self.representative_dataset_gen

        try:
            tflite_model = converter.convert()
        except Exception as err:
            logger.warning(f"Full INT8 quantization encountered fallback: {err}. Retrying with dynamic range quantization.")
            converter = tf.lite.TFLiteConverter.from_keras_model(keras_model)
            converter.optimizations = [tf.lite.Optimize.DEFAULT]
            tflite_model = converter.convert()

        out_path = os.path.join(self.config.OUTPUT_DIR, "crop_disease_model_int8.tflite")
        with open(out_path, "wb") as f:
            f.write(tflite_model)

        logger.info(f"INT8 TFLite model exported to: {out_path}")
        return out_path

    def execute_all_conversions(self) -> Dict[str, Any]:
        """Executes Float32, Float16, and INT8 conversions, calculating compression metrics."""
        logger.info(f"Loading trained Keras model from: {self.config.KERAS_MODEL_PATH}")
        keras_model = tf.keras.models.load_model(self.config.KERAS_MODEL_PATH)

        f32_path = self.convert_float32(keras_model)
        fp16_path = self.convert_float16(keras_model)
        int8_path = self.convert_int8(keras_model)

        # Calculate file sizes in MB
        f32_size_mb = os.path.getsize(f32_path) / (1024 * 1024)
        fp16_size_mb = os.path.getsize(fp16_path) / (1024 * 1024)
        int8_size_mb = os.path.getsize(int8_path) / (1024 * 1024)

        summary = {
            "keras_source_model": self.config.KERAS_MODEL_PATH,
            "models_exported": {
                "float32": {
                    "path": f32_path,
                    "size_mb": round(f32_size_mb, 2),
                    "compression_ratio": "1.0x",
                },
                "float16": {
                    "path": fp16_path,
                    "size_mb": round(fp16_size_mb, 2),
                    "compression_ratio": f"{round(f32_size_mb / fp16_size_mb, 2)}x" if fp16_size_mb > 0 else "N/A",
                },
                "int8": {
                    "path": int8_path,
                    "size_mb": round(int8_size_mb, 2),
                    "compression_ratio": f"{round(f32_size_mb / int8_size_mb, 2)}x" if int8_size_mb > 0 else "N/A",
                },
            },
        }

        # Save summary JSON report
        with open(self.config.REPORT_PATH, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)

        logger.info(f"All TFLite conversions complete! Report saved to: {self.config.REPORT_PATH}")
        return summary


if __name__ == "__main__":
    config = ConversionConfig()
    engine = TFLiteConversionEngine(config)
    summary = engine.execute_all_conversions()

    print("\n--- TFLITE CONVERSION & QUANTIZATION SUMMARY ---")
    print(f"Float32 Model Size : {summary['models_exported']['float32']['size_mb']} MB (Baseline)")
    print(f"Float16 Model Size : {summary['models_exported']['float16']['size_mb']} MB ({summary['models_exported']['float16']['compression_ratio']} compression)")
    print(f"INT8 Model Size    : {summary['models_exported']['int8']['size_mb']} MB ({summary['models_exported']['int8']['compression_ratio']} compression)")
