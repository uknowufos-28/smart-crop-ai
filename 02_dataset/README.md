# Module 02: Dataset Management & Ingestion Pipeline (`02_dataset`)

This module houses dataset acquisition configurations, data integrity verification tools, image quality audit utilities, and class balance inspection routines for SmartCropAI.

## Directory Layout
```
02_dataset/
├── audit_report.json        # Output audit report detailing scanned files & corrupted images
├── requirements.txt         # Module dependencies (Pillow, Requests, Pydantic, Tqdm)
├── src/
│   ├── __init__.py
│   ├── dataset_config.py    # Dataclass configuration schema & input validation rules
│   └── download_and_verify.py # Production dataset auditor & integrity verification engine
├── raw/                     # Raw image class directories (Git-ignored)
└── processed/               # Resized & normalized split partitions (Git-ignored)
```

## Running Dataset Audit Pipeline

Execute the dataset integrity audit engine:

```bash
cd 02_dataset
python3 src/download_and_verify.py
```

### Features Included:
- **Strict Input Validation**: Rejects non-RGB image streams, unreadable headers, truncated buffers, and images below 224x224 minimum resolution.
- **Structured Error Logging**: Tracks all corrupt file paths and outputs an automated JSON report to `audit_report.json`.
- **Target Class Coverage**: Tracks class balances across 10 core crop disease categories (Tomato, Potato, Corn).
