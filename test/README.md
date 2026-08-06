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
3. **TFLite INT8 Quantization Specification**: Validates `crop_disease_model_int8.tflite` binary size ($2.93\text{ MB} \le 5\text{MB}$ spec) and allocates `tf.lite.Interpreter` tensors.
4. **Backend REST API Health Check**: Queries `http://localhost:5000/health`, verifying HTTP 200 responses.
