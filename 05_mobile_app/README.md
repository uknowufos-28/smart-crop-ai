# Module 05: Mobile Application (`05_mobile_app`)

Cross-platform React Native & Expo mobile application powering real-time, offline-first crop disease diagnostics via phone camera and TFLite execution.

## Directory Layout
```
05_mobile_app/
├── package.json          # React Native & Expo dependencies
├── tsconfig.json         # Expo TypeScript compiler configuration
├── app.json              # Expo application configuration & camera permissions
├── App.tsx               # Root application entry point with Diagnostic AI Result Card
├── README.md             # Module documentation
└── src/
    ├── components/
    │   └── CameraScanner.tsx # Live camera leaf capture & photo gallery picker
    ├── constants/
    │   ├── classes.ts        # Master class index catalog (10 crop disease classes)
    │   └── theme.ts          # Dark-mode agricultural design system & color tokens
    └── services/
        └── tfliteService.ts  # On-device TFLite mobile inference & image scaling engine
```

## Features Included:
- **TFLite Mobile Inference Service (`tfliteService.ts`)**: Loads INT8 quantized MobileNetV2 model buffer ($2.93\text{ MB}$), scales image tensor inputs to $[-1.0, 1.0]$, executes on-host predictions in $<150\text{ms}$, and maps output class indexes to human-readable crop & disease names.
- **Diagnostic Result Card (`App.tsx`)**: Displays real-time diagnosis results showing detected Crop Name badge, Disease Name header, Confidence Score pill (e.g. 96.8%), Inference Latency badge (ms), and organic treatment remedy recommendations.
