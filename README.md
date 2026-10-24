# 🌱 SmartCropAI: Offline-First Edge AI Crop Disease Diagnostic System

[![Download APK](https://img.shields.io/badge/Download_APK-v1.0.0-166534?style=for-the-badge&logo=android&logoColor=white)](https://github.com/uknowufos-28/smart-crop-ai/releases/latest)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=github-actions)](https://github.com/uknowufos-28/smart-crop-ai)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![TensorFlow Lite](https://img.shields.io/badge/TensorFlow_Lite-Pilot_Target-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/lite)
[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_51-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_v4-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

> **An offline-first crop-disease app and model-training project. Field-validated diagnosis is not available yet; the pilot model must be trained and tested on verified field images before use.**

---

## 🌟 Executive Summary

**SmartCropAI** is a mobile crop-disease project intended for farmers. The current repository is a prototype, not a validated diagnostic tool: its checked-in dataset contains only 10 raw images, and the recorded evaluation accuracy is 10% on 10 test images. The app's former inference implementation returned a fixed class rather than evaluating the selected photo; it now clearly reports that a validated model is not installed instead of presenting a fabricated diagnosis.

The first proposed field pilot is for selected crops in Tamil Nadu, with rice, tomato, and banana as a provisional shortlist to confirm with farmers and local crop experts. The repository includes a Colab workflow to train and evaluate a candidate from consented, verified field photos. Public datasets can help bootstrap relevant classes, but public benchmark results are not evidence of accuracy on Tamil Nadu farms.

---

## 📲 Download & Installation Guide

1. Click **[Download APK v1.0.0](https://github.com/uknowufos-28/smart-crop-ai/releases/latest)** directly to your Android device.
2. Open the downloaded `SmartCropAI-v1.0.0.apk` file in your Android **Downloads** folder.
3. If prompted by Android OS, tap **Settings ➔ Allow installation from unknown sources**.
4. The current app prototype does not yet make diagnoses. Do not use it to make crop-treatment decisions until a field-validated model is installed.

---

## ✨ Key Features

- **Model status**: A real field-validated inference model is not installed yet. The app does not return a placeholder diagnosis.
- **🎨 ChatGPT Minimalist Design**: Clean Light Mode (`#FFFFFF`), Dark Mode (`#09090B`), and automatic System Theme detection (`useColorScheme`).
- **🚫 Zero-Emoji Professional UI**: Built with clean Lucide vector icons (`Camera`, `ShieldCheck`, `Zap`, `Sun`, `Moon`, `History`, `Settings`).
- **💾 SQLite Local Persistence**: Stores scan records locally (`expo-sqlite`) using Write-Ahead Logging (`PRAGMA journal_mode = WAL`).
- **🔄 Background Telemetry Sync**: Automatically synchronizes cached scan logs to the cloud database when cellular/Wi-Fi connection is active.
- **🔐 Enterprise Cloud Backend**: Node.js + Express + TypeScript REST API featuring BCrypt salted password hashing (cost factor 12) and 7-day signed JWT tokens.

---

## 🏗 Architecture & Data Flow

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      MOBILE CLIENT (React Native / Expo / SQLite)                │
│                                                                                  │
│  [ Camera / Gallery ] ──> [ Planned: preprocessing for verified model ]          │
│                                           │                                      │
│                                           ▼                                      │
│                   [ Planned: field-validated TFLite model ]                     │
│                                           │                                      │
│                                           ▼                                      │
│             [ Save result only after validated inference succeeds ]              │
│                                           │                                      │
│                                           ▼                                      │
│                           [ ChatGPT Minimalist UI Result Card ]                  │
└───────────────────────────────────────────┬──────────────────────────────────────┘
                                            │
                                            ▼ (When Network Connected)
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            CLOUD BACKEND (Node.js / Express / TS)                │
│                                                                                  │
│  [ POST /api/v1/diagnoses/sync ] ──> [ Zod Payload Validator & JWT Auth ]        │
│                                                   │                              │
│                                                   ▼                              │
│                                   [ MongoDB 7.0 Enterprise Database ]           │
└───────────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 📂 One-Word Clean Monorepo Hierarchy

```
SmartCropAI/
├── app/          # Mobile Application (React Native / Expo / SQLite)
├── api/          # Cloud Backend REST API (Node.js / Express / TypeScript)
├── ai/           # Neural Network Fine-Tuning & TFLite INT8 Engine
├── docs/         # System Architecture Specs & Blueprints
├── assets/       # Quantized TFLite Binaries & Telemetry Reports Index
├── test/         # Automated System Integration Testing Suite
├── scripts/      # Interactive Live Terminal Showcase CLI
├── .github/      # Continuous Integration Workflows
├── LICENSE       # MIT License
└── README.md     # Project Documentation
```

---

## Model status and next steps

The published model artifacts and benchmark reports are experimental prototype outputs; they do not establish field accuracy. The current evaluation report records **10% accuracy on 10 test images**, and the dataset audit records **10 raw images total (one per class)**. The old splits reuse the same source images, so those results are not an independent test. The reported quantized-model prediction agreement measures agreement with the source model, not correctness.

Use [`03_model_training/tamil_nadu_pilot_colab.ipynb`](03_model_training/tamil_nadu_pilot_colab.ipynb) to prepare a reproducible Colab run. It requires an image manifest with expert-checked labels and farm-level group splits, keeps test photos untouched during training, evaluates the exported INT8 model, and saves its class mapping and metrics to Google Drive. **Rice, tomato, and banana labels and field data still need local validation and collection.**

The architecture document's accuracy and latency values are engineering targets, not achieved or verified product metrics. A future app release must use a compatible runtime, the model's exported class order and preprocessing, uncertainty rejection, and real-device latency/accuracy tests.

---

## 💻 Local Development Setup

```bash
# 1. Clone Repository
git clone https://github.com/uknowufos-28/smart-crop-ai.git
cd smart-crop-ai

# 2. Run Mobile App locally (app/)
cd app
npm install
npm start

# 3. Build Standalone Android APK (app/)
npx eas-cli build -p android --profile preview

# 4. Run Cloud Backend Service (api/)
cd ../api
npm install
npm run dev

# 5. Run Interactive CLI Showcase (scripts/)
cd ../scripts
python src/live_demo.py
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.

---

## 👤 Author & Contributor

**Uk Now Ufos**
- **GitHub**: [@uknowufos-28](https://github.com/uknowufos-28)
- **Project**: SmartCropAI Engine
