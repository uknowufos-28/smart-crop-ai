# Module 04: Model Conversion & Quantization Engine (`04_model_conversion`)

This directory contains legacy TensorFlow Lite conversion and benchmarking tools. Their former model binaries are retired; the current experimental PlantDoc model is bundled in `app/assets/models/` and its training report is generated under `03_model_training/saved_models/plantdoc/`. Neither the legacy benchmarks nor the PlantDoc candidate establish field accuracy or mobile-device performance.

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
```

The previous evaluation report used only 10 test images and recorded 10% accuracy. Reported quantized-model prediction agreement measured agreement with a float model, not correctness. Those prototype results are historical and are not a product benchmark. The current PlantDoc model is an experimental classifier, not a field-validated diagnostic.

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
