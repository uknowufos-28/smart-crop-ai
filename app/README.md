# Module 05: React Native Expo Mobile Application (`05_mobile_app`)

Offline-first mobile crop-disease application prototype featuring a **ChatGPT Minimalist Design Language** (Light, Dark, System theme), Lucide vector icons, SQLite local persistence, and background REST API telemetry sync. A field-validated on-device model is not installed yet; the scanner reports that status instead of returning a fabricated diagnosis.

## Directory Layout
```
05_mobile_app/
├── eas.json                  # Expo Application Services APK build configuration
├── app.json                  # Android package specs (com.smartcropai.app) & camera permissions
├── App.tsx                   # Navigation Container & ThemeProvider root entry point
├── package.json              # React Native & Expo dependencies
└── src/
    ├── constants/
    │   ├── classes.ts        # 10 Crop Disease Master Class Labels
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
    │   └── tfliteService.ts  # Explicit model-not-installed guard until inference is integrated
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

## Building Standalone Android APK (`.apk`)

The current app can be built as a UI prototype, but image diagnosis is unavailable until an evaluated pilot model and compatible on-device inference/preprocessing runtime are integrated and tested on a phone.

To generate an installable `.apk` file for Android smartphones:

```bash
# Option A: Build standalone APK using Expo Application Services (Cloud Build)
npx eas-cli build -p android --profile preview

# Option B: Local Android Native Prebuild
npx expo run:android --variant release
```
