# Module 05: React Native Expo Mobile Application (`05_mobile_app`)

Offline-first mobile crop-screening prototype featuring a **ChatGPT Minimalist Design Language** (Light, Dark, System theme), Lucide vector icons, SQLite local persistence, and optional REST API telemetry sync. The bundled PlantDoc MobileNetV3-Small TFLite classifier runs on-device in a custom native build; its results are experimental and must be field-validated before they inform farming decisions.

## Directory Layout
```
05_mobile_app/
├── eas.json                  # Expo Application Services APK build configuration
├── app.json                  # Android package specs (com.smartcropai.app) & camera permissions
├── App.tsx                   # Navigation Container & ThemeProvider root entry point
├── package.json              # React Native & Expo dependencies
└── src/
    ├── constants/
    │   ├── classes.ts        # 28 PlantDoc labels in model output order
    │   └── theme.ts          # Theme Tokens
    ├── navigation/
    │   └── types.ts          # RootStackParamList Navigation Types
    ├── screens/
    │   ├── SplashScreen.tsx  # Animated Splash Launcher
    │   ├── HomeScreen.tsx    # Main Dashboard & Cloud Sync Banner
    │   ├── ScannerScreen.tsx # Live Camera & Gallery Scanner
    │   ├── PredictionScreen.tsx # Diagnostic AI Result Card
    │   ├── TreatmentScreen.tsx  # Organic & Chemical Treatment Remedies
    │   └── HistorySettingsScreen.tsx # SQLite History List & Theme Switcher
    ├── services/
    │   ├── databaseService.ts# SQLite Local Storage Manager (smartcropai.db)
    │   ├── syncService.ts    # Background Cloud Telemetry Sync Manager
    │   ├── imagePreprocessing.ts # Mobile image resize/crop and MobileNetV3 normalization
    │   └── tfliteService.ts  # On-device TFLite inference
    └── theme/
        └── ThemeContext.tsx  # Multi-Theme Provider Context (Light, Dark, System)
```

## Running the Application Locally

```bash
# 1. Navigate to mobile directory
cd 05_mobile_app

# 2. Install dependencies
npm install

# 3. Start Expo development server
npm start
```

The model is bundled at `assets/models/plantdoc_mobilenetv3_small.tflite`. The TFLite native module requires a custom native build; **Expo Go is not supported**. In a native build, image classification and SQLite history run on-device without a network connection. The PlantDoc model is an experimental 28-class image classifier, not a leaf-localization detector; PlantDoc does not include rice or banana classes and does not validate performance on Tamil Nadu farm images. Its score is not a calibrated probability or confirmed diagnosis. Ask a local agricultural expert before taking action.

PlantDoc attribution (CC BY 4.0): Singh, D., Jain, N., Jain, P., Kayal, P., Kumawat, S., & Batra, N. (2020). *PlantDoc: A Dataset for Visual Plant Disease Detection*. CoDS-COMAD 2020. https://doi.org/10.1145/3371158.3371196.

Optional telemetry sync requires a reachable backend URL in `EXPO_PUBLIC_API_BASE_URL` (see `.env.example`) and a valid authentication token. This app prototype does not yet provide a sign-in flow, so pending records remain safely stored in SQLite until authentication is connected. Cloud-sync failure must not block local scans.

## Building Standalone Android APK (`.apk`)

Build a custom native app to include the bundled TFLite model and inference runtime. This repository has not yet had a successful Android/iOS device build or on-device inference test; validate the generated app on a real device before distribution.

To generate an installable `.apk` file for Android smartphones:

```bash
# Option A: Build standalone APK using Expo Application Services (Cloud Build)
npx eas-cli build -p android --profile preview

# Option B: Local Android Native Prebuild
npx expo run:android --variant release
```
