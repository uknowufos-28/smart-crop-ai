# 🌱 SmartCropAI: Offline-First Edge AI Crop Disease Diagnostic System

[![Download APK](https://img.shields.io/badge/Download_APK-v1.0.0-166534?style=for-the-badge&logo=android&logoColor=white)](https://github.com/uknowufos-28/smart-crop-ai/releases/latest)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=github-actions)](https://github.com/uknowufos-28/smart-crop-ai)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![TensorFlow Lite](https://img.shields.io/badge/TensorFlow_Lite-Pilot_Target-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/lite)
[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_51-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_v4-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

> **Offline-first crop screening prototype with a bundled experimental PlantDoc classifier. It is not field-validated and must not be used as a confirmed diagnosis or treatment recommendation.**

---

## 🌟 Executive Summary

**SmartCropAI** is a mobile crop-screening prototype. The app now bundles a MobileNetV3-Small classifier trained from PlantDoc for offline image inference. PlantDoc is an internet-sourced dataset with 28 labels; it has no rice or banana classes and does not validate results on Tamil Nadu farms. The model score is not a calibrated probability or confirmed diagnosis. Earlier repository results (10% accuracy on 10 images) are historical baseline results from a tiny, overlapping dataset and are not evidence of model quality.

The first proposed field pilot is for selected crops in Tamil Nadu, with rice, tomato, and banana as a provisional shortlist to confirm with farmers and local crop experts. The repository includes a Colab workflow to train and evaluate a candidate from consented, verified field photos. Public datasets can help bootstrap relevant classes, but public benchmark results are not evidence of accuracy on Tamil Nadu farms.

---

## 📲 Download & Installation Guide

The model is bundled for on-device inference in a custom native app build; Expo Go does not include the TFLite native module. Existing release APKs may not contain this model. Build the current app from source using the instructions in [`app/README.md`](app/README.md). A field-validated diagnostic release is not available.

---

## ✨ Key Features

- **Experimental offline screening**: Bundled 28-class PlantDoc TFLite classifier; not field-validated and not a leaf-localization detector.
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
│  [ Camera / Gallery ] ──> [ Image preprocessing ]                                │
│                                           │                                      │
│                                           ▼                                      │
│          [ Bundled experimental PlantDoc TFLite classifier ]                    │
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
├── ai/           # Legacy TFLite conversion and benchmark utilities
├── docs/         # System Architecture Specs & Blueprints
├── assets/       # Experimental model and evaluation report index
├── test/         # Automated System Integration Testing Suite
├── scripts/      # Interactive Live Terminal Showcase CLI
├── .github/      # Continuous Integration Workflows
├── LICENSE       # MIT License
└── README.md     # Project Documentation
```

---

## Model status and next steps

The current PlantDoc candidate is an experimental 28-class classifier, not a detector and not a Tamil Nadu field model. The training report records its validation and official-test results and documents exact train/test image duplicates excluded from training; several duplicate files have conflicting folder labels. The original 10-image evaluation and old model benchmark figures are historical prototype results, not evidence of current model accuracy or mobile performance.

Use [`03_model_training/README.md`](03_model_training/README.md) for the local NVIDIA GPU PlantDoc training workflow and its evaluation report. The separate [`03_model_training/tamil_nadu_pilot_colab.ipynb`](03_model_training/tamil_nadu_pilot_colab.ipynb) remains the path for a future field-data pilot: it requires consented images, expert-checked labels, independent farm-group splits, and local validation. **Rice, tomato, and banana field data still need to be collected and validated.**

The PlantDoc classifier and its score are experimental. Its exported class order and preprocessing are bundled with the app, but real-device inference, latency, offline operation, and independent field accuracy still need validation before an agronomic claim or treatment decision.

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
