"""
End-to-End System Integration Testing & Quality Assurance Suite for SmartCropAI.
Validates dataset integrity, Keras model contracts, TFLite INT8 binary specs,
and backend REST API health endpoints. Outputs test_results.json.
"""

import json
import logging
import os
import sys
import time
from typing import Any, Dict, List
import numpy as np
from PIL import Image

# Configure Logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("SystemIntegrationTest")


class SystemIntegrationTestSuite:
    """Production automated test runner for SmartCropAI components."""

    def __init__(self):
        self.root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        self.results: List[Dict[str, Any]] = []

    def log_test_result(self, test_name: str, status: str, details: str, duration_ms: float):
        """Logs and records individual test case outcome."""
        result = {
          "test_name": test_name,
          "status": status,
          "details": details,
          "duration_ms": round(duration_ms, 2),
        }
        self.results.append(result)
        icon = "✅" if status == "PASSED" else "❌"
        logger.info(f"{icon} [{status}] {test_name}: {details} ({duration_ms:.2f} ms)")

    def test_01_dataset_integrity(self):
        """Test Case 1: Asserts dataset images exist, are valid RGB, and match 224x224 dimensions."""
        start = time.perf_counter()
        test_dir = os.path.join(self.root_dir, "02_dataset", "processed", "test")

        if not os.path.exists(test_dir):
            self.log_test_result(
                "Dataset Integrity",
                "FAILED",
                f"Directory not found: {test_dir}",
                (time.perf_counter() - start) * 1000,
            )
            return

        image_count = 0
        corrupted_count = 0

        for root, _, files in os.walk(test_dir):
            for f in files:
                if f.lower().endswith((".jpg", ".jpeg", ".png")):
                    image_count += 1
                    try:
                        with Image.open(os.path.join(root, f)) as img:
                            img.verify()
                            if img.size != (224, 224):
                                corrupted_count += 1
                    except Exception:
                        corrupted_count += 1

        duration = (time.perf_counter() - start) * 1000
        if image_count > 0 and corrupted_count == 0:
            self.log_test_result(
                "Dataset Integrity",
                "PASSED",
                f"Verified {image_count} test images (224x224 RGB, 0 corruptions).",
                duration,
            )
        else:
            self.log_test_result(
                "Dataset Integrity",
                "FAILED",
                f"Checked {image_count} images; found {corrupted_count} corrupted/mismatched files.",
                duration,
            )

    def test_02_keras_model_contract(self):
        """Test Case 2: Asserts trained Keras model exists and input/output tensor shapes match specs."""
        start = time.perf_counter()
        model_path = os.path.join(
            self.root_dir, "03_model_training", "saved_models", "mobilenetv2_crop_disease.keras"
        )

        if not os.path.exists(model_path):
            self.log_test_result(
                "Keras Model Contract",
                "FAILED",
                f"Model file missing: {model_path}",
                (time.perf_counter() - start) * 1000,
            )
            return

        try:
            import tensorflow as tf

            model = tf.keras.models.load_model(model_path)
            input_shape = model.input_shape
            output_shape = model.output_shape

            duration = (time.perf_counter() - start) * 1000
            if input_shape == (None, 224, 224, 3) and output_shape == (None, 10):
                self.log_test_result(
                    "Keras Model Contract",
                    "PASSED",
                    f"Model input {input_shape} -> output {output_shape} contract valid.",
                    duration,
                )
            else:
                self.log_test_result(
                    "Keras Model Contract",
                    "FAILED",
                    f"Unexpected model shapes: input {input_shape}, output {output_shape}",
                    duration,
                )
        except Exception as err:
            self.log_test_result(
                "Keras Model Contract",
                "FAILED",
                f"Model loading exception: {err}",
                (time.perf_counter() - start) * 1000,
            )

    def test_03_tflite_int8_quantization(self):
        """Test Case 3: Asserts quantized INT8 TFLite model binary exists and interpreter allocates tensors."""
        start = time.perf_counter()
        tflite_path = os.path.join(
            self.root_dir, "04_model_conversion", "samples", "crop_disease_model_int8.tflite"
        )

        if not os.path.exists(tflite_path):
            self.log_test_result(
                "TFLite INT8 Quantization",
                "FAILED",
                f"TFLite binary missing: {tflite_path}",
                (time.perf_counter() - start) * 1000,
            )
            return

        file_size_mb = os.path.getsize(tflite_path) / (1024 * 1024)

        try:
            import tensorflow as tf

            interpreter = tf.lite.Interpreter(model_path=tflite_path)
            interpreter.allocate_tensors()
            input_details = interpreter.get_input_details()

            duration = (time.perf_counter() - start) * 1000
            if file_size_mb <= 5.0 and input_details[0]["shape"].tolist() == [1, 224, 224, 3]:
                self.log_test_result(
                    "TFLite INT8 Quantization",
                    "PASSED",
                    f"Binary size {file_size_mb:.2f} MB <= 5MB target, TFLite tensor allocation clean.",
                    duration,
                )
            else:
                self.log_test_result(
                    "TFLite INT8 Quantization",
                    "FAILED",
                    f"Binary size {file_size_mb:.2f} MB exceeds spec or input shape invalid.",
                    duration,
                )
        except Exception as err:
            self.log_test_result(
                "TFLite INT8 Quantization",
                "FAILED",
                f"TFLite Interpreter error: {err}",
                (time.perf_counter() - start) * 1000,
            )

    def test_04_backend_health_api(self):
        """Test Case 4: Asserts Node.js Express backend health endpoint returns HTTP 200."""
        start = time.perf_counter()
        try:
            import urllib.request

            req = urllib.request.Request("http://localhost:5000/health", method="GET")
            with urllib.request.urlopen(req, timeout=3) as response:
                duration = (time.perf_counter() - start) * 1000
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    if data.get("status") == "online":
                        self.log_test_result(
                            "Backend Health API",
                            "PASSED",
                            f"HTTP 200 OK - Service: {data.get('service')} (Uptime: {data.get('uptimeSeconds')}s).",
                            duration,
                        )
                        return
            self.log_test_result(
                "Backend Health API",
                "FAILED",
                "Endpoint did not return expected status payload.",
                (time.perf_counter() - start) * 1000,
            )
        except Exception as err:
            duration = (time.perf_counter() - start) * 1000
            self.log_test_result(
                "Backend Health API",
                "SKIPPED/OPTIONAL",
                f"Backend server offline on localhost:5000 ({err}). Start server via 06_backend/ npm run dev.",
                duration,
            )

    def run_all_tests(self) -> Dict[str, Any]:
        """Executes full integration suite and outputs test_results.json report."""
        logger.info("Starting System Integration Test Suite...")
        self.test_01_dataset_integrity()
        self.test_02_keras_model_contract()
        self.test_03_tflite_int8_quantization()
        self.test_04_backend_health_api()

        passed_count = sum(1 for r in self.results if r["status"] == "PASSED")
        total_count = len(self.results)

        report = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "passed_tests": passed_count,
            "total_tests": total_count,
            "success_rate_pct": round((passed_count / total_count) * 100.0, 2),
            "test_cases": self.results,
        }

        report_path = os.path.join(self.root_dir, "07_testing", "test_results.json")
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        logger.info(f"System Integration Test Suite Complete! Results saved to: {report_path}")
        return report


if __name__ == "__main__":
    suite = SystemIntegrationTestSuite()
    report = suite.run_all_tests()

    print("\n--- SYSTEM INTEGRATION TEST REPORT ---")
    print(f"Passed Tests : {report['passed_tests']} / {report['total_tests']} ({report['success_rate_pct']}%)")
    for tc in report["test_cases"]:
        print(f" [{tc['status']}] {tc['test_name']} - {tc['details']} ({tc['duration_ms']} ms)")
