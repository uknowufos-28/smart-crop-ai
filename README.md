# SmartCropAI 🌾📱

**SmartCropAI** is an enterprise-grade, offline-first mobile system designed to diagnose crop leaf diseases using on-device Computer Vision and Deep Learning (TensorFlow Lite), suggest eco-friendly treatment regimens, and securely synchronize diagnostic telemetry to a cloud backend.

---

## 🏗 Enterprise 10-Module Directory Layout

```
SmartCropAI/
├── 01_docs/              # Architectural specifications, API contracts, domain models
├── 02_dataset/           # Dataset ingestion, quality verification & preprocessing pipeline
├── 03_model_training/    # Python TensorFlow/Keras training scripts & model checkpoints
├── 04_model_conversion/  # TFLite post-training quantization & optimization pipeline
├── 05_mobile_app/        # React Native + TypeScript + Navigation + Native TFLite Engine
├── 06_backend/           # Node.js + Express + TypeScript + MongoDB sync server
├── 07_testing/           # Integration tests, performance benchmarks, accuracy test suites
├── 08_deployment/        # Render, GitHub Actions CI/CD workflows, Docker configurations
├── 09_demo/              # Production verification scripts, presentation material & metrics
└── 10_assets/            # High-resolution UI assets, icons, sample test leaf images
```

---

## ⚙️ System Architecture Overview

```
 ┌──────────────────────────────────────────────────────────────┐
 │                     05_mobile_app (Client)                   │
 │                                                              │
 │  ┌───────────────────────┐        ┌───────────────────────┐  │
 │  │ Camera / Leaf Image   │───────>│ Tensor Preprocessing  │  │
 │  │ Capture Viewport      │        │ (Resize & Rescale)    │  │
 │  └───────────────────────┘        └───────────────────────┘  │
 │                                               │              │
 │                                               ▼              │
 │                                   ┌───────────────────────┐  │
 │                                   │ On-Device TFLite Engine│ │
 │                                   │ (Quantized MobileNet) │  │
 │                                   └───────────────────────┘  │
 │                                               │              │
 │                                               ▼              │
 │  ┌───────────────────────┐        ┌───────────────────────┐  │
 │  │ Eco-Friendly Treatment│<───────│ Local Diagnosis &     │  │
 │  │ Recommendation UI     │        │ Confidence Score      │  │
 │  └───────────────────────┘        └───────────────────────┘  │
 └───────────────────────────────────────────────┬──────────────┘
                                                 │ Cloud Sync Queue
                                                 ▼ (When Online)
 ┌──────────────────────────────────────────────────────────────┐
 │                     06_backend (Server)                      │
 │                                                              │
 │  ┌───────────────────────┐        ┌───────────────────────┐  │
 │  │ Node.js / Express     │───────>│ MongoDB Atlas         │  │
 │  │ TypeScript REST API   │        │ (Logs & Telemetry)    │  │
 │  └───────────────────────┘        └───────────────────────┘  │
 └──────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

- **Mobile Client (`05_mobile_app`)**: React Native, TypeScript, React Navigation, TensorFlow Lite Engine (`react-native-fast-tflite`).
- **Machine Learning (`02_dataset`, `03_model_training`, `04_model_conversion`)**: Python 3.10+, TensorFlow 2.x, OpenCV, MobileNetV2, TFLite Quantization Engine.
- **Backend API (`06_backend`)**: Node.js, Express, TypeScript, MongoDB, Mongoose ODM, Zod, JWT.
- **Testing & Deployment (`07_testing`, `08_deployment`)**: Jest, Supertest, Docker, GitHub Actions, Render.

---

## 📄 License
MIT License
