# SmartCropAI Enterprise System Architecture & Design Specifications

## 1. System Engineering Constraints & Metrics
- **Offline Reliability**: On-device disease classification and treatment recommendations MUST run without network connectivity.
- **Inference Latency Target**: <= 150ms on standard ARM smartphone processors (e.g., Snapdragon 600-series or MediaTek Helio).
- **Model Footprint Target**: <= 15 MB binary size using Post-Training INT8/FP16 Quantization.
- **Model Accuracy Target**: >= 95% top-1 validation accuracy across target plant leaf disease categories.
- **Backend Throughput**: RESTful endpoint responses <= 200ms p95 latency.

## 2. Decoupled Module Responsibilities

| Module Directory | Primary Responsibility | Key Deliverables |
| :--- | :--- | :--- |
| `01_docs/` | System architecture, REST API schemas, data flow specs | System documentation |
| `02_dataset/` | Ingestion, validation, cleaning, and augmentation scripts | Cleaned & split image datasets |
| `03_model_training/` | Deep Learning model architecture & transfer learning | Trained `.keras` / `.h5` model files |
| `04_model_conversion/`| Model compression, TFLite quantization, & benchmarking | `.tflite` model binary |
| `05_mobile_app/` | React Native cross-platform mobile client | Production Android / iOS App |
| `06_backend/` | TypeScript Express API service & MongoDB database | Cloud REST API & Database |
| `07_testing/` | Integration tests, accuracy test suites, & performance tests| Test coverage & validation logs |
| `08_deployment/` | CI/CD build scripts, Dockerfiles, & Render configuration | Production deployments |
| `09_demo/` | Verification scripts, benchmarks, & portfolio presentation | End-to-end demo materials |
| `10_assets/` | High-res UI icons, application assets, & test images | Visual assets |
