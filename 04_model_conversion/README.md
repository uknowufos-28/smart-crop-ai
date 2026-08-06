# Module 04: Model Conversion & Quantization Engine (`04_model_conversion`)

This module houses the TensorFlow Lite model conversion, post-training quantization (FP16 and INT8), representative calibration dataset generator, and binary size optimization telemetry for SmartCropAI.

## Directory Layout
```
04_model_conversion/
├── requirements.txt           # Module dependencies
├── conversion_summary.json    # JSON report of exported TFLite binary sizes & compression ratios
├── README.md                  # Module documentation
├── src/
│   ├── __init__.py
│   ├── conversion_config.py   # Dataclass configuration schema & path definitions
│   └── convert_tflite.py      # Production TFLite converter & post-training quantization engine
└── samples/                   # Exported TFLite model binaries
    ├── crop_disease_model_float32.tflite  (9.74 MB Baseline)
    ├── crop_disease_model_fp16.tflite     (4.94 MB - 1.97x Compression)
    └── crop_disease_model_int8.tflite     (2.93 MB - 3.32x Compression)
```

## Running TFLite Conversion & Quantization Pipeline

```bash
# 1. Activate virtual environment
source ../03_model_training/.venv/bin/activate

# 2. Execute TFLite model conversion
cd 04_model_conversion
python src/convert_tflite.py
```

### Quantization Variants Exported:
- **Float32 Standard (`crop_disease_model_float32.tflite`)**: Unquantized baseline model ($9.74\text{ MB}$).
- **Float16 Quantized (`crop_disease_model_fp16.tflite`)**: Half-precision floating point weight quantization ($4.94\text{ MB}$, $1.97\times$ compression).
- **INT8 Full Integer Quantized (`crop_disease_model_int8.tflite`)**: Quantized using Representative Dataset Calibration ($2.93\text{ MB}$, $3.32\times$ compression) for mobile NPU/CPU acceleration.
