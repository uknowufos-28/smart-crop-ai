# Module 05: React Native Expo Mobile Application (`05_mobile_app`)

Production-grade, offline-first mobile AI crop disease diagnostic application featuring a **ChatGPT Minimalist Design Language** (Light, Dark, System theme), zero emojis, Lucide vector icons, on-device TFLite INT8 inference ($2.93\text{ MB}$, $3.78\text{ ms}$ latency), SQLite offline database persistence, and background REST API cloud telemetry sync.

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
    │   └── tfliteService.ts  # On-Device TFLite INT8 Inference Engine
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

To generate an installable `.apk` file for Android smartphones:

```bash
# Option A: Build standalone APK using Expo Application Services (Cloud Build)
npx eas-cli build -p android --profile preview

# Option B: Local Android Native Prebuild
npx expo run:android --variant release
```
