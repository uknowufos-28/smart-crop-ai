# Module 09: System Showcase & Live Demo Runner (`09_demo`)

Interactive CLI showcase demonstrating SmartCropAI end-to-end dataset auditing, INT8 TFLite model inference, latency profiling (<5ms), disease treatment lookups, and offline telemetry batch sync.

## Directory Layout
```
09_demo/
├── requirements.txt      # Demo script dependencies
├── README.md             # Module documentation
└── src/
    └── live_demo.py      # Production interactive system showcase CLI
```

## Running the Interactive Live Showcase Demo

```bash
# 1. Activate virtual environment
source ../03_model_training/.venv/bin/activate

# 2. Run live demo showcase CLI
cd 09_demo
python src/live_demo.py
```

### Demonstration Stages Included:
1. **Stage 1 (Dataset Audit)**: Loads processed leaf image samples, verifying $224 \times 224$ RGB dimensions.
2. **Stage 2 (On-Device TFLite INT8 Neural Network Inference)**: Loads $2.93\text{ MB}$ INT8 TFLite model, measures on-host CPU latency (**3.91 ms / 255.8 FPS**), and decodes Softmax class prediction.
3. **Stage 3 (Disease Treatment Remedy Guide)**: Displays organic copper fungicides, cultural practices, and chemical treatment advice.
4. **Stage 4 (Offline Telemetry Batch Sync Payload)**: Simulates local scan queuing and formats JSON payload for `POST http://localhost:5000/api/v1/diagnoses/sync`.
5. **Stage 5 (Enterprise Monorepo Summary)**: Renders architectural breakdown across all 10 domain modules (`01_docs` to `10_assets`).
