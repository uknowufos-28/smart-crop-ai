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

## Local NVIDIA GPU training with PlantDoc

PlantDoc is an optional public dataset for a limited image-classification experiment. It has no rice or banana class and does not validate performance on Tamil Nadu farm photos. Its training folders contain 28 class labels; use the `train/` set for training/validation and keep its official `test/` set untouched. One class has no official test images and is reported with zero test support. Images and the dataset license stay outside Git.

On Windows with an NVIDIA driver and Python 3.11:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
.\.venv\Scripts\python.exe -m pip install -r 03_model_training\requirements-plantdoc-gpu.txt
.\.venv\Scripts\python.exe -m pip install --no-deps onnx2tf==1.29.24 tf-keras==2.19.0
git clone --depth 1 https://github.com/pratikkayal/PlantDoc-Dataset.git 02_dataset\raw_download\PlantDoc-Dataset
.\.venv\Scripts\python.exe 03_model_training\src\train_plantdoc.py --workers 2
```

The converter and Keras compatibility package are installed without their pinned TensorFlow/LiteRT wheels because Windows requires `tensorflow-cpu` and `ai-edge-litert==2.1.2`, which are pinned in the requirements file. The training script fails rather than silently switching to CPU if CUDA is unavailable. Before training, it verifies images and excludes exact copies found in both official splits from the training pool while retaining the official test copies; the report records any exclusions and label conflicts. It uses an ImageNet-pretrained MobileNetV3-Small, trains the classifier then fine-tunes the final feature blocks, chooses a checkpoint by validation macro-F1, evaluates once on the official PlantDoc test set, and converts through ONNX to a `.tflite` candidate. Check `03_model_training\saved_models\plantdoc\evaluation_report.json`; all metrics are experimental and must not be presented as Tamil Nadu field accuracy.

The currently bundled checkpoint scored 47.5% accuracy and 43.3% macro-F1 on 236 official test images (TFLite: 47.5% and 43.2%). One class has no official test examples. The audit excluded 11 exact train/test copies, including 8 with conflicting folder labels. These results are too limited for a confirmed diagnosis or treatment recommendation; more independently collected and expert-reviewed field data is needed.

If a checkpoint was saved but report/export finalization needs to be repeated, use `.\.venv\Scripts\python.exe 03_model_training\src\train_plantdoc.py --evaluate-checkpoint --workers 2` to re-evaluate it without repeating training.
