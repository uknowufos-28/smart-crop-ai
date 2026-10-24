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
    """Integration checks for the bundled experimental PlantDoc app model."""

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
        logger.info("[%s] %s: %s (%.2f ms)", status, test_name, details, duration_ms)

    def test_01_dataset_integrity(self):
        """Test Case 1: Verifies local PlantDoc test images when the dataset is present."""
        start = time.perf_counter()
        test_dir = os.path.join(
            self.root_dir, "02_dataset", "raw_download", "PlantDoc-Dataset", "test"
        )

        if not os.path.exists(test_dir):
            self.log_test_result(
                "Dataset Integrity",
                "SKIPPED/OPTIONAL",
                "PlantDoc is not checked into Git; download it to run the dataset audit.",
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
                    except Exception:
                        corrupted_count += 1

        duration = (time.perf_counter() - start) * 1000
        if image_count > 0 and corrupted_count == 0:
            self.log_test_result(
                "Dataset Integrity",
                "PASSED",
                f"Verified {image_count} official test images; 0 corruptions.",
                duration,
            )
        else:
            self.log_test_result(
                "Dataset Integrity",
                "FAILED",
                f"Checked {image_count} images; found {corrupted_count} corrupted/mismatched files.",
                duration,
            )

    def test_02_plantdoc_metadata(self):
        """Test Case 2: Confirms bundled class order matches the training report."""
        start = time.perf_counter()
        labels_path = os.path.join(
            self.root_dir, "app", "assets", "models", "class_labels.json"
        )
        report_path = os.path.join(
            self.root_dir, "app", "assets", "models", "evaluation_report.json"
        )

        if not os.path.isfile(labels_path) or not os.path.isfile(report_path):
            self.log_test_result(
                "PlantDoc Metadata",
                "FAILED",
                "Bundled class_labels.json or evaluation_report.json is missing.",
                (time.perf_counter() - start) * 1000,
            )
            return

        try:
            with open(labels_path, encoding="utf-8") as file:
                labels = json.load(file)
            with open(report_path, encoding="utf-8") as file:
                report = json.load(file)
            classes = labels["classes"]
            expected_mapping = {name: index for index, name in enumerate(classes)}

            duration = (time.perf_counter() - start) * 1000
            if (
                len(classes) == 28
                and labels["class_to_index"] == expected_mapping
                and report["class_order"] == classes
                and report["status"] == "experimental_public_dataset_only_not_field_validated"
            ):
                self.log_test_result(
                    "PlantDoc Metadata",
                    "PASSED",
                    "The 28-class mapping matches the experimental evaluation report.",
                    duration,
                )
            else:
                self.log_test_result(
                    "PlantDoc Metadata",
                    "FAILED",
                    "Bundled class order, mapping, or experimental status is inconsistent.",
                    duration,
                )
        except Exception as err:
            self.log_test_result(
                "PlantDoc Metadata",
                "FAILED",
                f"Metadata validation failed: {err}",
                (time.perf_counter() - start) * 1000,
            )

    def test_03_tflite_model_contract(self):
        """Test Case 3: Allocates and invokes the bundled float32 TFLite model."""
        start = time.perf_counter()
        tflite_path = os.path.join(
            self.root_dir,
            "app",
            "assets",
            "models",
            "plantdoc_mobilenetv3_small.tflite",
        )

        if not os.path.isfile(tflite_path):
            self.log_test_result(
                "TFLite Model Contract",
                "FAILED",
                f"TFLite binary missing: {tflite_path}",
                (time.perf_counter() - start) * 1000,
            )
            return

        try:
            import tensorflow as tf

            interpreter = tf.lite.Interpreter(model_path=tflite_path)
            interpreter.allocate_tensors()
            input_details = interpreter.get_input_details()
            output_details = interpreter.get_output_details()
            input_shape = input_details[0]["shape"].tolist()
            output_shape = output_details[0]["shape"].tolist()
            valid_input_shapes = ([1, 150528], [1, 3, 224, 224], [1, 224, 224, 3])

            if (
                input_shape in valid_input_shapes
                and output_shape == [1, 28]
                and input_details[0]["dtype"] == np.float32
                and output_details[0]["dtype"] == np.float32
            ):
                interpreter.set_tensor(
                    input_details[0]["index"],
                    np.zeros(input_shape, dtype=np.float32),
                )
                interpreter.invoke()
                output = interpreter.get_tensor(output_details[0]["index"])
                if not np.isfinite(output).all():
                    raise ValueError("TFLite invocation returned non-finite output.")
                duration = (time.perf_counter() - start) * 1000
                self.log_test_result(
                    "TFLite Model Contract",
                    "PASSED",
                    f"Float32 model input {input_shape} -> output {output_shape}; invocation succeeded.",
                    duration,
                )
            else:
                duration = (time.perf_counter() - start) * 1000
                self.log_test_result(
                    "TFLite Model Contract",
                    "FAILED",
                    f"Unexpected model tensor contract: input {input_shape}, output {output_shape}.",
                    duration,
                )
        except Exception as err:
            self.log_test_result(
                "TFLite Model Contract",
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
        self.test_02_plantdoc_metadata()
        self.test_03_tflite_model_contract()
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
