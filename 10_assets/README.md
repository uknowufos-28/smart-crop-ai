# Module 10: System Assets & Model Artifacts (`10_assets`)

Central repository for SmartCropAI model binaries, exported TFLite quantized models, performance telemetry reports, and system architecture diagrams.

## Directory Layout
```
10_assets/
├── README.md             # Module documentation & asset index
├── models/               # Compiled model binaries
│   ├── mobilenetv2_crop_disease.keras     (42.5 MB Keras Saved Model)
│   ├── crop_disease_model_float32.tflite  (9.74 MB Baseline)
│   ├── crop_disease_model_fp16.tflite     (4.94 MB Float16 Quantized)
│   └── crop_disease_model_int8.tflite     (2.93 MB Full INT8 Quantized)
└── reports/              # Automated telemetry & benchmark reports
    ├── audit_report.json        # Dataset byte-stream audit log
    ├── processing_summary.json  # Preprocessing & 80/10/10 split log
    ├── training_history.json    # Two-stage model training metrics
    ├── evaluation_report.json   # Held-out test set accuracy & precision/recall
    ├── conversion_summary.json  # TFLite compression ratio telemetry
    ├── benchmark_report.json   # On-host latency (3.78ms) & prediction agreement
    └── test_results.json        # System integration test suite report
```

## Summary of Key Model Artifacts

| Model Artifact | Format | Binary Size | On-Host Latency | Compression | Prediction Agreement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `mobilenetv2_crop_disease.keras` | Keras HDF5/Native | 42.5 MB | N/A (Heavy Python) | 1.0x Baseline | 100.0% (Source) |
| `crop_disease_model_float32.tflite` | TFLite Float32 | 9.74 MB | 6.93 ms | 1.0x | 100.0% |
| `crop_disease_model_fp16.tflite` | TFLite FP16 | 4.94 MB | 5.77 ms | 1.97x | 100.0% |
| `crop_disease_model_int8.tflite` | TFLite Full INT8 | **2.93 MB** | **3.78 ms (265 FPS)** | **3.32x** | **100.0%** |
