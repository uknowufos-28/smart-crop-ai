"""
On-Host TFLite Benchmarking & Sanity Inference Validation Engine for SmartCropAI.
Loads TFLite models (Float32, Float16, INT8) via tf.lite.Interpreter, benchmarks
inference latency (ms), verifies prediction agreement with the original Keras model,
and outputs benchmark_report.json.
"""

import json
import logging
import os
import sys
import time
from typing import Any, Dict, List, Tuple
import numpy as np
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
logger = logging.getLogger("TFLiteBenchmark")


class TFLiteBenchmarkEngine:
    """Production benchmarking engine for TensorFlow Lite models."""

    def __init__(self, config: ConversionConfig):
        """Initializes benchmarking engine with validated configuration."""
        self.config = config
        self.config.validate()

    def run_tflite_inference(
        self, interpreter: tf.lite.Interpreter, input_tensor: np.ndarray
    ) -> Tuple[np.ndarray, float]:
        """Executes a single inference pass on a TFLite Interpreter.

        Args:
            interpreter: Allocated tf.lite.Interpreter instance.
            input_tensor: Preprocessed numpy image tensor [1, 224, 224, 3] float32.

        Returns:
            Tuple of (output_probabilities: np.ndarray, latency_ms: float)
        """
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        # Handle quantization input type matching if required
        input_type = input_details[0]["dtype"]
        if input_type == np.uint8 or input_type == np.int8:
            scale, zero_point = input_details[0]["quantization"]
            if scale > 0:
                quant_tensor = np.round(input_tensor / scale + zero_point)
                input_tensor = quant_tensor.astype(input_type)

        interpreter.set_tensor(input_details[0]["index"], input_tensor)

        start_time = time.perf_counter()
        interpreter.invoke()
        latency_ms = (time.perf_counter() - start_time) * 1000.0

        output_data = interpreter.get_tensor(output_details[0]["index"])

        # Dequantize output if required
        output_type = output_details[0]["dtype"]
        if output_type == np.uint8 or output_type == np.int8:
            scale, zero_point = output_details[0]["quantization"]
            if scale > 0:
                output_data = (output_data.astype(np.float32) - zero_point) * scale

        return output_data, latency_ms

    def benchmark_model_latency(
        self, model_path: str, test_tensors: List[np.ndarray], warmup_runs: int = 5
    ) -> Dict[str, Any]:
        """Measures average, min, and max inference latency across test tensors.

        Args:
            model_path: Path to target .tflite model file.
            test_tensors: List of preprocessed input image tensors.
            warmup_runs: Number of initial unmeasured warmup runs.

        Returns:
            Dictionary containing latency metrics in milliseconds.
        """
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"TFLite model not found at path: {model_path}")

        interpreter = tf.lite.Interpreter(model_path=model_path)
        interpreter.allocate_tensors()

        # Warmup passes to initialize execution graphs
        for _ in range(warmup_runs):
            self.run_tflite_inference(interpreter, test_tensors[0])

        latencies: List[float] = []
        sample_preds: List[int] = []

        for tensor in test_tensors:
            preds, latency = self.run_tflite_inference(interpreter, tensor)
            latencies.append(latency)
            sample_preds.append(int(np.argmax(preds)))

        avg_latency = float(np.mean(latencies))
        min_latency = float(np.min(latencies))
        max_latency = float(np.max(latencies))

        file_size_mb = os.path.getsize(model_path) / (1024 * 1024)

        return {
            "model_path": model_path,
            "file_size_mb": round(file_size_mb, 2),
            "avg_latency_ms": round(avg_latency, 3),
            "min_latency_ms": round(min_latency, 3),
            "max_latency_ms": round(max_latency, 3),
            "throughput_fps": round(1000.0 / avg_latency, 2) if avg_latency > 0 else 0,
            "sample_predictions": sample_preds,
        }

    def verify_prediction_agreement(
        self, keras_model: tf.keras.Model, tflite_path: str, test_tensors: List[np.ndarray]
    ) -> float:
        """Calculates Top-1 prediction matching rate between Keras and TFLite models.

        Args:
            keras_model: Loaded Keras model instance.
            tflite_path: Path to .tflite binary.
            test_tensors: Test image tensors.

        Returns:
            Prediction agreement percentage [0.0 to 100.0].
        """
        interpreter = tf.lite.Interpreter(model_path=tflite_path)
        interpreter.allocate_tensors()

        matches = 0
        total = len(test_tensors)

        for tensor in test_tensors:
            keras_pred = keras_model.predict(tensor, verbose=0)
            keras_cls = int(np.argmax(keras_pred))

            tflite_pred, _ = self.run_tflite_inference(interpreter, tensor)
            tflite_cls = int(np.argmax(tflite_pred))

            if keras_cls == tflite_cls:
                matches += 1

        agreement_pct = (matches / total) * 100.0 if total > 0 else 0.0
        return round(agreement_pct, 2)

    def execute_benchmark_suite(self) -> Dict[str, Any]:
        """Loads test sample tensors and executes latency + agreement benchmark suite."""
        logger.info("Preparing test image tensors for benchmarking...")
        test_dir = os.path.join(self.config.BASE_DIR, "..", "02_dataset", "processed", "test")
        
        test_tensors: List[np.ndarray] = []
        for root, _, files in os.walk(test_dir):
            for file_name in files:
                if file_name.lower().endswith((".jpg", ".jpeg", ".png")):
                    file_path = os.path.join(root, file_name)
                    try:
                        with Image.open(file_path) as img:
                            if img.mode != "RGB":
                                img = img.convert("RGB")
                            img = img.resize((224, 224), resample=Image.Resampling.LANCZOS)
                            arr = np.array(img, dtype=np.float32)
                            # Apply MobileNetV2 preprocessing scale [-1, 1]
                            arr = (arr / 127.5) - 1.0
                            test_tensors.append(np.expand_dims(arr, axis=0))
                    except Exception as err:
                        logger.warning(f"Failed loading test image [{file_path}]: {err}")

        if not test_tensors:
            raise FileNotFoundError("No valid test images found in 02_dataset/processed/test/")

        logger.info(f"Loaded {len(test_tensors)} test sample tensors.")

        # Load Keras source model for agreement checking
        keras_model = tf.keras.models.load_model(self.config.KERAS_MODEL_PATH)

        variants = {
            "float32": os.path.join(self.config.OUTPUT_DIR, "crop_disease_model_float32.tflite"),
            "float16": os.path.join(self.config.OUTPUT_DIR, "crop_disease_model_fp16.tflite"),
            "int8": os.path.join(self.config.OUTPUT_DIR, "crop_disease_model_int8.tflite"),
        }

        results = {}
        for variant_name, model_path in variants.items():
            if os.path.exists(model_path):
                logger.info(f"Benchmarking TFLite Variant: {variant_name} ({model_path})...")
                metrics = self.benchmark_model_latency(model_path, test_tensors)
                agreement = self.verify_prediction_agreement(keras_model, model_path, test_tensors)
                metrics["prediction_agreement_pct"] = agreement
                results[variant_name] = metrics
            else:
                logger.warning(f"Variant file '{model_path}' missing. Skipping.")

        report = {
            "keras_source_model": self.config.KERAS_MODEL_PATH,
            "test_samples_benchmarked": len(test_tensors),
            "benchmark_results": results,
        }

        report_path = os.path.join(self.config.BASE_DIR, "benchmark_report.json")
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        logger.info(f"Benchmark suite complete! Saved report to: {report_path}")
        return report


if __name__ == "__main__":
    config = ConversionConfig()
    engine = TFLiteBenchmarkEngine(config)
    report = engine.execute_benchmark_suite()

    print("\n--- ON-HOST TFLITE BENCHMARK REPORT ---")
    for variant, data in report["benchmark_results"].items():
        print(f"Model Variant: {variant.upper()}")
        print(f"  Binary Size : {data['file_size_mb']} MB")
        print(f"  Avg Latency : {data['avg_latency_ms']} ms ({data['throughput_fps']} FPS)")
        print(f"  Agreement   : {data['prediction_agreement_pct']}% with Keras baseline\n")
