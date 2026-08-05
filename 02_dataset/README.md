# Module 02: Dataset Management & Ingestion Pipeline (`02_dataset`)

This module houses dataset acquisition configurations, data integrity verification tools, image preprocessing, data augmentation, and stratified dataset splitting engines for SmartCropAI.

## Directory Layout
```
02_dataset/
├── audit_report.json        # Output audit report detailing scanned files & corrupted images
├── processing_summary.json  # Output summary of dataset preprocessing, augmentations, and split counts
├── requirements.txt         # Module dependencies (Pillow, Requests, Pydantic, Tqdm)
├── README.md                # Module documentation
├── src/
│   ├── __init__.py
│   ├── dataset_config.py          # Dataclass configuration schema, split ratios & constants
│   ├── download_and_verify.py     # Production dataset auditor & integrity verification engine
│   └── preprocess_and_augment.py  # Image resizing, augmentation & stratified splitting engine
├── raw/                     # Raw image class directories (Git-ignored)
└── processed/               # Resized (224x224 RGB) & augmented train/val/test splits (Git-ignored)
```

## Running Dataset Pipeline

### 1. Integrity Audit
```bash
cd 02_dataset
python3 src/download_and_verify.py
```

### 2. Preprocessing, Data Augmentation & Stratified Splitting
```bash
cd 02_dataset
python3 src/preprocess_and_augment.py
```

### Features Included:
- **Quality Anti-Aliasing Resizing**: Resizes images to $224 \times 224$ RGB using `LANCZOS` filter.
- **Stratified Partitioning**: Splitting raw data into 80% Train, 10% Validation, 10% Test partitions using a fixed random seed (`42`).
- **Data Augmentation Engine**: Applies stochastic transformations (rotations $\pm 25^\circ$, horizontal/vertical flips, brightness adjustments) to the training partition to prevent neural network overfitting.
- **Audit & Processing Telemetry**: Saves structured JSON telemetry to `processing_summary.json`.
