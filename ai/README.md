# Module 04: Model Conversion & Quantization Engine (`04_model_conversion`)

This module houses the TensorFlow Lite model conversion, post-training quantization (FP16 and INT8), representative calibration dataset generator, and on-host latency/prediction agreement benchmarking suites for SmartCropAI.

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
    ├── crop_disease_model_float32.tflite  (9.74 MB Baseline - 6.93 ms)
    ├── crop_disease_model_fp16.tflite     (4.94 MB - 1.97x Compression - 5.77 ms)
    └── crop_disease_model_int8.tflite     (2.93 MB - 3.32x Compression - 3.78 ms - 265 FPS)
```

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
- **Latency Benchmarking**: Measures per-tensor inference latency (ms), min/max latency, and throughput FPS across Float32, Float16, and INT8 variants.
- **Prediction Agreement**: Compares Top-1 class predictions between Keras `.keras` and quantized `.tflite` models (Achieving 100.0% matching agreement).
