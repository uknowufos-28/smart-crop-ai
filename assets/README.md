# SmartCropAI model assets

The current mobile candidate is bundled in [`app/assets/models/`](../app/assets/models/):

- `plantdoc_mobilenetv3_small.tflite` — float32 TFLite model for offline, on-device image classification.
- `class_labels.json` — model output order and preprocessing metadata.
- `evaluation_report.json` — validation and official PlantDoc test metrics, split exclusions, and limitations.

The candidate was trained on PlantDoc, an internet-sourced image dataset released under CC BY 4.0. It is an experimental 28-class classifier, not a leaf-localization detector and not a validated diagnostic for Tamil Nadu or other local farms. The model score is not calibrated. Do not use it alone to choose treatment.

Earlier prototype TFLite binaries and host benchmark claims have been retired. The old 10-image evaluation and quantized-model agreement figures are historical and must not be interpreted as current accuracy or mobile latency.

For training instructions and the dataset citation, see [`03_model_training/README.md`](../03_model_training/README.md). The training report records the model's actual dataset metrics; this project makes no mobile latency claim until device testing is completed.
