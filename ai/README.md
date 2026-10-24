# Module 04: Model Conversion & Quantization Engine (`04_model_conversion`)

This module contains experimental TensorFlow Lite conversion and benchmarking tools. The checked-in model files and reports are legacy prototype outputs, not a field-validated model and not currently wired into the mobile app.

## Directory Layout
```
04_model_conversion/
├── requirements.txt           # Module dependencies
├── conversion_summary.json    # JSON report of exported TFLite binary sizes & compression ratios
├── benchmark_report.json     # JSON report of per-model inference latencies & prediction agreement
├── README.md                  # Module documentation
├── src/
│   ├── __init__.py
│   ├── conversion_config.py   # Dataclass configuration schema & path definitions
│   ├── convert_tflite.py      # Production TFLite converter & post-training quantization engine
│   └── benchmark_tflite.py    # On-host TFLite interpreter benchmark & agreement engine
└── samples/                   # Exported TFLite model binaries
    ├── crop_disease_model_float32.tflite  (legacy experimental artifact)
    ├── crop_disease_model_fp16.tflite     (legacy experimental artifact)
    └── crop_disease_model_int8.tflite     (legacy experimental artifact)
```

The legacy evaluation report uses only 10 test images and records 10% accuracy. Reported quantized-model prediction agreement is agreement with a float model, not correctness. Do not use these artifacts for diagnosis. A new model must be trained from verified data with the [Tamil Nadu Colab pilot](../03_model_training/tamil_nadu_pilot_colab.ipynb), independently evaluated on field images, and integrated into the app before these files can be replaced or deleted safely.

## Running TFLite Conversion & Benchmarking

### 1. Execute TFLite Conversion
```bash
source ../03_model_training/.venv/bin/activate
cd 04_model_conversion
python src/convert_tflite.py
```

### 2. Execute Latency & Agreement Benchmark
```bash
cd 04_model_conversion
python src/benchmark_tflite.py
```

### Features Included:
- **TFLite Interpreter Execution**: Loads `.tflite` model buffers with `tf.lite.Interpreter`, allocating tensor memory and querying input/output indexes.
- **Latency Benchmarking**: Measures model invocation latency in the current host environment; it is not a mobile-device performance result.
- **Prediction Agreement**: Compares Top-1 predictions between source and quantized models; agreement does not demonstrate classification accuracy.
