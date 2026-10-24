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

## Tamil Nadu Field Pilot (Google Colab)

Use [`tamil_nadu_pilot_colab.ipynb`](tamil_nadu_pilot_colab.ipynb) for the new, reproducible pilot workflow. It mounts a Google Drive dataset, validates expert-reviewed labels and dataset licenses/consent, checks farm-group and exact-image leakage across splits, fine-tunes MobileNetV2, evaluates untouched test and optional field-test images, and exports an INT8 TFLite model plus class-order and evaluation metadata to Drive.

The provisional crop shortlist is rice, tomato, and banana; confirm crop/disease labels with local farmers and an agricultural expert. Organize images under `MyDrive/smartcropai_pilot/dataset/images/` and prepare the required `manifest.csv` as described in the notebook. Keep private photos and large datasets out of Git. Aim for at least 100 varied photos per class across at least 5 independent farm groups; smaller datasets are exploratory, not evidence of field reliability.

The existing `evaluation_report.json` records 10% accuracy on 10 test images, while the dataset audit records only 10 raw images. The existing splits reuse source images and must not be treated as independent evaluation. The Colab output is an experimental candidate; review per-class errors and independent field results before app integration or agronomic use. Colab runtime measurements are not mobile-device benchmarks.
