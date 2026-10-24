# Module 07: System Integration Testing (`07_testing`)

Automated end-to-end integration testing suite, dataset contract assertions, model tensor validation, and API health verification for SmartCropAI.

## Directory Layout
```
07_testing/
├── requirements.txt      # Python testing dependencies
├── test_results.json     # JSON report of integration test suite outcomes
├── README.md             # Module documentation
└── src/
    └── test_pipeline.py  # Production automated system integration test suite
```

## Running Automated System Integration Tests

```bash
# 1. Activate virtual environment
source ../03_model_training/.venv/bin/activate

# 2. Run system integration test suite
cd 07_testing
python src/test_pipeline.py
```

### Test Cases Executed:
1. **Dataset Integrity Assertion**: Verifies processed images exist in `02_dataset/processed/test/`, confirming $224 \times 224$ RGB dimensions and zero corruptions.
2. **Keras Model Contract Verification**: Loads `mobilenetv2_crop_disease.keras`, verifying input shape $(224, 224, 3)$ and 10 class Softmax output layer.
3. **Bundled TFLite Model Contract**: Allocates and invokes the PlantDoc float32 model, checking its input/output tensor shapes and finite output.
4. **Backend REST API Health Check**: Queries `http://localhost:5000/health`, verifying HTTP 200 responses when the backend is running.

The PlantDoc archive is intentionally excluded from Git; dataset integrity is marked optional when the local download is absent. The test suite does not certify field accuracy or mobile-device behavior.
