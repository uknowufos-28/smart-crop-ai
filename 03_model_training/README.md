# Module 03: Deep Learning Model Training Engine (`03_model_training`)

This module houses the TensorFlow / Keras deep learning model architecture setup, transfer learning routines, training callbacks, fine-tuning scripts, and loss/accuracy matrix generators for SmartCropAI.

## Directory Layout
```
03_model_training/
├── requirements.txt         # Module dependencies (TensorFlow, NumPy, Matplotlib, Scikit-Learn)
├── README.md                # Module documentation
├── src/
│   ├── __init__.py
│   ├── model_config.py      # Dataclass hyperparameters & directory constants
│   └── model_builder.py     # MobileNetV2 architecture generator & transfer learning head
├── saved_models/            # Exported Keras models (.keras / .h5) (Git-ignored)
├── checkpoints/             # Best model training checkpoints (Git-ignored)
└── logs/                    # TensorBoard training log files (Git-ignored)
```

## Running Model Architecture Builder

```bash
# 1. Install dependencies
pip3 install -r requirements.txt

# 2. Run model architecture builder & parameter summary
cd 03_model_training
python3 src/model_builder.py
```

### Architecture Specifications:
- **Base Model**: MobileNetV2 pre-trained on ImageNet (frozen backbone).
- **Input Tensor**: $(224 \times 224 \times 3)$ RGB leaf image.
- **Preprocessing**: `mobilenet_v2.preprocess_input` (rescaling to $[-1, 1]$).
- **Classification Head**:
  - `GlobalAveragePooling2D` (Compresses feature maps to 1280 vector).
  - `Dense(256, activation='relu', L2 regularized)`.
  - `BatchNormalization`.
  - `Dropout(0.3)`.
  - `Dense(10, activation='softmax')` output layer.
