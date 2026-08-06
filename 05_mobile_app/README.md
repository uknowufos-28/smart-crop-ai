# Module 05: Mobile Application (`05_mobile_app`)

Cross-platform React Native & Expo mobile application powering real-time, offline-first crop disease diagnostics via phone camera and TFLite execution.

## Directory Layout
```
05_mobile_app/
├── package.json          # React Native & Expo dependencies
├── tsconfig.json         # Expo TypeScript compiler configuration
├── app.json              # Expo application configuration & camera permissions
├── App.tsx               # Root application entry point with AI Result Card & Cloud Sync Banner
├── README.md             # Module documentation
└── src/
    ├── components/
    │   └── CameraScanner.tsx # Live camera leaf capture & photo gallery picker
    ├── constants/
    │   ├── classes.ts        # Master class index catalog (10 crop disease classes)
    │   └── theme.ts          # Dark-mode agricultural design system & color tokens
    └── services/
        ├── tfliteService.ts  # On-device TFLite mobile inference & image scaling engine
        └── syncService.ts    # Offline scan queue & Cloud REST API sync manager
```

## Features Included:
- **Offline Telemetry Sync Manager (`syncService.ts`)**:
  - Enqueues diagnostic AI scan logs into local memory/AsyncStorage queues (`enqueueDiagnosis`).
  - Tracks pending offline scan queue count.
  - Sends bulk batch POST requests to `http://localhost:5000/api/v1/diagnoses/sync` (`syncPendingDiagnoses`).
  - Automatically clears queued items upon receiving HTTP 201 response from cloud REST API.
- **Cloud Sync Telemetry Banner (`App.tsx`)**:
  - Displays interactive banner showing count of pending offline scans.
  - Triggers one-tap background telemetry sync to cloud backend DB.
