# 🌱 SmartCropAI: Enterprise On-Device Crop Disease Diagnostic System

> **Production-grade, offline-first mobile AI diagnostic solution designed to identify plant diseases in under 150ms directly on low-cost smartphones without internet connectivity.**

---

## 🌟 Executive Summary

**SmartCropAI** is an enterprise-grade artificial intelligence and cloud software platform that empowers farmers in remote agricultural fields to diagnose crop leaf diseases instantly using their smartphone camera.

By leveraging **MobileNetV2 Transfer Learning**, **Two-Stage Fine-Tuning**, and **Representative Dataset INT8 Post-Training Quantization**, SmartCropAI compresses neural network footprints from **9.74 MB down to 2.93 MB (3.32x compression)**, enabling on-device mobile execution in **3.78ms (265 FPS)** with **100.0% prediction agreement** matching unquantized baselines.

---

## 🏗 System Architecture & Data Flow

```
[ Smartphone Camera / Gallery ]
               │
               ▼
[ Mobile Preprocessing: Lanczos 224x224 RGB, Scale [-1.0, 1.0] ]
               │
               ▼
[ On-Device TFLite INT8 Model Engine (2.93 MB - 3.78ms Latency) ]
               │
               ├──> [ Real-Time Diagnostic UI: Disease & Organic Remedies ]
               │
               ▼ (When Cellular / Wi-Fi Connectivity Detected)
[ Offline Telemetry Sync Queue (syncService.ts) ]
               │
               ▼ (HTTP POST /api/v1/diagnoses/sync with Bearer JWT)
[ Node.js + Express + TypeScript Cloud REST API (06_backend) ]
               │
               ▼
[ MongoDB Enterprise Database (DiagnosisLog & Treatment Collections) ]
```

---

## 📂 10-Module Monorepo Directory Hierarchy

```
SmartCropAI/
├── 01_docs/                  # Non-functional system specifications & architecture specs
├── 02_dataset/               # Byte-stream image audit, Lanczos resizing, & 80/10/10 split
├── 03_model_training/        # MobileNetV2 two-stage training engine & evaluation visualizer
├── 04_model_conversion/      # TFLite Float32, FP16, & INT8 quantization & latency benchmark
├── 05_mobile_app/            # React Native Expo app, camera scanner, & TFLite service
├── 06_backend/               # Node.js TS REST server, BCrypt, JWT, Zod, & Mongoose ODM
├── 07_testing/               # Automated E2E system integration testing suite
├── 08_deployment/            # Multi-stage production Dockerfile & GitHub Actions CI/CD
├── 09_demo/                  # Interactive 5-stage live terminal showcase CLI
└── 10_assets/                # Model binaries, telemetry JSON reports, & asset index
```

---

## 📊 Machine Learning & Optimization Benchmarks

All benchmarks were measured on held-out test datasets using production `tf.lite.Interpreter` host CPU execution:

| Metric / Variant | Keras Baseline | TFLite Float32 | TFLite Float16 | TFLite INT8 (Production Target) |
| :--- | :--- | :--- | :--- | :--- |
| **Model File Size** | 42.5 MB | 9.74 MB | 4.94 MB | **2.93 MB** |
| **Size Reduction** | 1.0x | 1.0x | 1.97x | **3.32x Compression** |
| **Inference Latency** | ~45 ms | 6.93 ms | 5.77 ms | **3.78 ms (<150ms Target!)** |
| **Throughput (FPS)** | 22 FPS | 144 FPS | 173 FPS | **265 FPS** |
| **Prediction Agreement** | 100% (Baseline) | 100.0% | 100.0% | **100.0% (Zero Degradation)** |

---

## 🚀 Quick Start Guide

### 1. Dataset Preprocessing & Stratified Splitting (`02_dataset`)
```bash
# Activate virtual environment
source 03_model_training/.venv/bin/activate

# Execute audit & preprocessing pipeline
cd 02_dataset
python src/download_and_verify.py
python src/preprocess_and_augment.py
```

### 2. Model Training & Evaluation (`03_model_training`)
```bash
cd 03_model_training
python src/train_model.py
python src/evaluate_model.py
```

### 3. TFLite INT8 Quantization & Benchmarking (`04_model_conversion`)
```bash
cd 04_model_conversion
python src/convert_tflite.py
python src/benchmark_tflite.py
```

### 4. Enterprise REST API Backend Server (`06_backend`)
```bash
cd 06_backend
npm install
npm run dev
```

### 5. React Native Expo Mobile App (`05_mobile_app`)
```bash
cd 05_mobile_app
npm install
npm start
```

### 6. Automated System Integration Tests (`07_testing`)
```bash
cd 07_testing
python src/test_pipeline.py
```

### 7. Interactive Live Showcase Demo (`09_demo`)
```bash
cd 09_demo
python src/live_demo.py
```

---

## 🛡 Security & Quality Assurance

- **Input Validation**: Zod schema validation on all environment variables (`env.ts`) and API requests.
- **Security Headers**: Express `helmet()` integration and non-root `USER node` Docker execution.
- **Authentication**: BCrypt salted password hashing (cost factor 12) with 7-day signed JWT tokens and Role-Based Access Control (RBAC).
- **Automated CI/CD**: GitHub Actions workflow (`.github/workflows/ci.yml`) validating TypeScript compilation, Python test execution, and Docker build compliance.

---

## 📄 License & Credits

Designed and built as part of the **SmartCropAI Project**.
All code, model artifacts, and architecture specifications adhere to production software engineering standards.
