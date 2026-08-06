"""
Production Deep Learning Model Training & Fine-Tuning Engine for SmartCropAI.
Loads dataset partitions, constructs MobileNetV2 model, applies two-stage training
(Feature Extraction + Fine-Tuning), configures Keras callbacks, and exports saved models.
"""

import json
import logging
import os
import sys
from typing import Tuple
import tensorflow as tf

# Import model configuration and architecture builder
from model_config import ModelConfig
from model_builder import CropDiseaseModelBuilder

# Configure structured logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("TrainEngine")


class ModelTrainingEngine:
    """Production training engine for crop disease neural network."""

    def __init__(self, config: ModelConfig):
        """Initializes engine with validated configuration and creates export paths."""
        self.config = config
        self.config.validate()

        # Ensure directory paths exist
        os.makedirs(self.config.MODEL_SAVE_DIR, exist_ok=True)
        os.makedirs(self.config.CHECKPOINT_DIR, exist_ok=True)
        os.makedirs(self.config.LOGS_DIR, exist_ok=True)

    def _directory_has_images(self, directory: str) -> bool:
        """Recursively checks if directory contains valid image files."""
        if not os.path.exists(directory):
            return False
        for root, _, files in os.walk(directory):
            for f in files:
                if os.path.splitext(f)[1].lower() in {".jpg", ".jpeg", ".png", ".bmp"}:
                    return True
        return False

    def load_datasets(self) -> Tuple[tf.data.Dataset, tf.data.Dataset]:
        """Loads train and val image datasets from 02_dataset/processed/ into tf.data.Dataset streams.

        Returns:
            Tuple of (train_dataset, val_dataset) optimized with AUTOTUNE prefetching.
        """
        processed_dir = self.config.PROCESSED_DATA_DIR
        train_dir = os.path.join(processed_dir, "train")
        val_dir = os.path.join(processed_dir, "val")

        if not os.path.exists(train_dir):
            raise FileNotFoundError(
                f"Train dataset directory '{train_dir}' not found. Run 02_dataset pipeline first."
            )

        logger.info(f"Loading image datasets from: {processed_dir}")

        # Load Training Dataset
        train_ds = tf.keras.utils.image_dataset_from_directory(
            train_dir,
            labels="inferred",
            label_mode="categorical",
            image_size=(self.config.IMAGE_HEIGHT, self.config.IMAGE_WIDTH),
            batch_size=self.config.BATCH_SIZE,
            shuffle=True,
            seed=42,
        )

        # Safely load validation set only if valid image files exist
        if self._directory_has_images(val_dir):
            val_ds = tf.keras.utils.image_dataset_from_directory(
                val_dir,
                labels="inferred",
                label_mode="categorical",
                image_size=(self.config.IMAGE_HEIGHT, self.config.IMAGE_WIDTH),
                batch_size=self.config.BATCH_SIZE,
                shuffle=False,
            )
        else:
            logger.warning("Validation directory contains 0 image files. Using training set for validation pass.")
            val_ds = train_ds

        # Optimize GPU/CPU pipeline performance with AUTOTUNE buffering
        autotune = tf.data.AUTOTUNE
        train_ds = train_ds.prefetch(buffer_size=autotune)
        val_ds = val_ds.prefetch(buffer_size=autotune)

        return train_ds, val_ds

    def create_callbacks(self) -> list:
        """Constructs production Keras training callbacks.

        Callbacks:
        - ModelCheckpoint: Saves best model weights based on minimum val_loss.
        - EarlyStopping: Terminates training if val_loss fails to improve for 5 epochs.
        - ReduceLROnPlateau: Decays learning rate by 0.2 if val_loss plateaus for 3 epochs.
        - TensorBoard: Logs metrics for visualization.

        Returns:
            List of configured Keras Callback instances.
        """
        checkpoint_path = os.path.join(self.config.CHECKPOINT_DIR, "best_crop_model.keras")

        callbacks = [
            tf.keras.callbacks.ModelCheckpoint(
                filepath=checkpoint_path,
                monitor="val_loss",
                save_best_only=True,
                verbose=1,
            ),
            tf.keras.callbacks.EarlyStopping(
                monitor="val_loss",
                patience=5,
                restore_best_weights=True,
                verbose=1,
            ),
            tf.keras.callbacks.ReduceLROnPlateau(
                monitor="val_loss",
                factor=0.2,
                patience=3,
                min_lr=1e-6,
                verbose=1,
            ),
        ]

        return callbacks

    def execute_two_stage_training(self) -> str:
        """Executes Stage 1 (Top Classification Head) and Stage 2 (Fine-Tuning Base Layers).

        Returns:
            Path to final saved model file.
        """
        train_ds, val_ds = self.load_datasets()

        # Build Model Architecture
        builder = CropDiseaseModelBuilder(self.config)
        model = builder.build_transfer_model()
        callbacks = self.create_callbacks()

        # --- STAGE 1: Feature Extraction (Top Head Training) ---
        logger.info(f"--- STAGE 1: Training Top Head ({self.config.INITIAL_EPOCHS} Epochs, lr={self.config.INITIAL_LEARNING_RATE}) ---")
        
        history_stage1 = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=self.config.INITIAL_EPOCHS,
            callbacks=callbacks,
        )

        # --- STAGE 2: Fine-Tuning Top Layers of MobileNetV2 ---
        logger.info("--- STAGE 2: Unfreezing Top MobileNetV2 Backbone Layers for Fine-Tuning ---")
        
        # Access MobileNetV2 base model layer inside functional graph
        base_model = None
        for layer in model.layers:
            if isinstance(layer, tf.keras.Model) or "mobilenetv2" in layer.name.lower():
                base_model = layer
                break

        if base_model is not None:
            base_model.trainable = True
            # Freeze all layers except the last 30 layers
            fine_tune_at = len(base_model.layers) - 30
            for layer in base_model.layers[:fine_tune_at]:
                layer.trainable = False
            
            logger.info(f"Unfrozen top {len(base_model.layers) - fine_tune_at} layers of base backbone.")
        else:
            logger.warning("Base backbone model layer not identified directly. Skipping unfreezing.")

        # Re-compile model with reduced learning rate for fine-tuning
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=self.config.FINE_TUNE_LEARNING_RATE),
            loss="categorical_crossentropy",
            metrics=["accuracy", tf.keras.metrics.TopKCategoricalAccuracy(k=3, name="top_3_accuracy")],
        )

        total_epochs = self.config.INITIAL_EPOCHS + self.config.FINE_TUNE_EPOCHS
        logger.info(f"--- STAGE 2: Fine-Tuning Model (Epochs {self.config.INITIAL_EPOCHS + 1} to {total_epochs}, lr={self.config.FINE_TUNE_LEARNING_RATE}) ---")

        history_stage2 = model.fit(
            train_ds,
            validation_data=val_ds,
            initial_epoch=len(history_stage1.epoch),
            epochs=total_epochs,
            callbacks=callbacks,
        )

        # Save Final Model Artifact
        final_model_path = os.path.join(self.config.MODEL_SAVE_DIR, "mobilenetv2_crop_disease.keras")
        model.save(final_model_path)
        logger.info(f"Training completed successfully! Saved final model to: {final_model_path}")

        # Save Training History Metrics
        history_summary = {
            "stage1_final_accuracy": history_stage1.history["accuracy"][-1],
            "stage1_final_loss": history_stage1.history["loss"][-1],
            "stage2_final_accuracy": history_stage2.history["accuracy"][-1],
            "stage2_final_loss": history_stage2.history["loss"][-1],
        }
        history_json_path = os.path.join(self.config.BASE_DIR, "training_history.json")
        with open(history_json_path, "w", encoding="utf-8") as f:
            json.dump(history_summary, f, indent=2)

        return final_model_path


if __name__ == "__main__":
    config = ModelConfig()
    engine = ModelTrainingEngine(config)
    saved_model_path = engine.execute_two_stage_training()
    print(f"\n✅ Training Completed! Model saved at: {saved_model_path}")
