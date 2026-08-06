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
    ├── components/
    │   └── CameraScanner.tsx # Live camera leaf capture & photo gallery picker
    └── constants/
        └── theme.ts      # Dark-mode agricultural design system & color tokens
```

## Features Included:
- **Live Camera Scanner Component (`CameraScanner.tsx`)**:
  - `CameraView` live viewport with viewfinder target box framing guide.
  - Camera permissions check (`useCameraPermissions`).
  - Flash/Torch mode toggle (on/off for dark field conditions).
  - Shutter capture button (`takePictureAsync`) and gallery photo picker (`launchImageLibraryAsync`).
  - High-contrast leaf image selection preview screen with retake callback.
