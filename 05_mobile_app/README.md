# Module 05: Mobile Application (`05_mobile_app`)

Cross-platform React Native & Expo mobile application powering real-time, offline-first crop disease diagnostics via phone camera and TFLite execution.

## Directory Layout
```
05_mobile_app/
├── package.json          # React Native & Expo dependencies
├── tsconfig.json         # Expo TypeScript compiler configuration
├── app.json              # Expo application configuration & camera permissions
├── App.tsx               # Root application entry point
├── README.md             # Module documentation
└── src/
    └── constants/
        └── theme.ts      # Dark-mode agricultural design system & color tokens
```

## Running Mobile App in Development

```bash
# 1. Install dependencies
cd 05_mobile_app
npm install

# 2. Start Expo dev server
npm start
```

### Features Included:
- **Theme Design System**: Dark-mode agricultural palette (`#16A34A` Emerald Green, `#0F172A` Deep Slate), typography tokens, and spacing rules for high outdoor field visibility.
- **Camera & Photo Library Permissions**: Configured iOS Info.plist strings and Android permission manifests for camera access.
- **SafeArea Integration**: Integrates `react-native-safe-area-context` ensuring UI renders cleanly across notched mobile displays.
