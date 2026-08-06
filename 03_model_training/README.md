# Module 03: Deep Learning Model Training Engine (`03_model_training`)

This module houses the TensorFlow / Keras deep learning model architecture setup, transfer learning routines, two-stage fine-tuning engines, Keras checkpoint callbacks, and model evaluation suites for SmartCropAI.

## Directory Layout
```
03_model_training/
├── requirements.txt         # Module dependencies
├── training_history.json    # JSON report of training loss & accuracy metrics
├── evaluation_report.json   # JSON report of test set Precision, Recall, and F1-Scores
├── confusion_matrix.png     # Visual $10 \times 10$ Confusion Matrix plot image
├── README.md                # Module documentation
├── src/
│   ├── __init__.py
│   ├── model_config.py      # Dataclass hyperparameters & directory constants
│   ├── model_builder.py     # MobileNetV2 architecture generator & transfer learning head
│   ├── train_model.py       # Production two-stage model training & fine-tuning engine
│   └── evaluate_model.py    # Model evaluation, confusion matrix & metrics generator
├── saved_models/            # Exported Keras models (.keras / .h5) (Git-ignored)
├── checkpoints/             # Best model training checkpoints (Git-ignored)
└── logs/                    # TensorBoard training log files (Git-ignored)
```

## Running Evaluation Suite

```bash
# 1. Activate virtual environment
source .venv/bin/activate

# 2. Execute model evaluation
cd 03_model_training
python src/evaluate_model.py
```

### Features Included:
- **Inference Pass**: Executes non-shuffled inference across `02_dataset/processed/test/`.
- **Classification Metrics**: Calculates per-class Precision, Recall, F1-Scores, and macro/weighted averages using Scikit-Learn.
- **Confusion Matrix Heatmap**: Plots high-resolution $10 \times 10$ heatmap image (`confusion_matrix.png`).
- **Telemetry Export**: Saves evaluation report to `evaluation_report.json`.
