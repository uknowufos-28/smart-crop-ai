"""
MobileNetV2 Transfer Learning Architecture & Custom Classification Head Builder.
Constructs, compiles, and verifies pre-trained MobileNetV2 deep learning models
specifically optimized for edge deployment via TensorFlow Lite.
"""

import logging
import os
import sys
from typing import Tuple
import tensorflow as tf
from tensorflow.keras import layers, models, regularizers

# Import model configuration
from model_config import ModelConfig

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("ModelBuilder")


class CropDiseaseModelBuilder:
    """Production builder for MobileNetV2 transfer learning models."""

    def __init__(self, config: ModelConfig):
        """Initializes builder with validated hyperparameter configuration."""
        self.config = config
        self.config.validate()

    def build_transfer_model(self) -> tf.keras.Model:
        """Constructs MobileNetV2 architecture with custom classification head.

        Architecture Layers:
        1. Input Layer (224x224x3 RGB image tensor)
        2. MobileNetV2 Preprocessing Layer (Scales pixels to [-1, 1])
        3. MobileNetV2 Backbone (Pre-trained on ImageNet, Frozen base layers)
        4. GlobalAveragePooling2D (Spatial compression to 1280 feature vector)
        5. Dense FC Layer (256 units + ReLU + L2 Regularization)
        6. BatchNormalization (Feature scaling & training stability)
        7. Dropout Layer (0.3 rate for overfitting mitigation)
        8. Output Softmax Layer (10 disease class probability distribution)

        Returns:
            Compiled Keras Model instance.
        """
        logger.info(f"Building MobileNetV2 Transfer Learning model. Input Shape: {self.config.INPUT_SHAPE}")

        # 1. Define Input Layer
        inputs = layers.Input(shape=self.config.INPUT_SHAPE, name="leaf_image_input")

        # 2. MobileNetV2 Standard Preprocessing [-1, 1]
        x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)

        # 3. Base MobileNetV2 Backbone (Pretrained on ImageNet)
        base_model = tf.keras.applications.MobileNetV2(
            input_shape=self.config.INPUT_SHAPE,
            include_top=False,
            weights="imagenet",
        )

        # Freeze base backbone layers for initial transfer learning
        base_model.trainable = False
        logger.info(f"Loaded MobileNetV2 backbone ({len(base_model.layers)} layers). Base layers frozen.")

        # Pass inputs through base model
        x = base_model(x, training=False)

        # 4. Global Average Pooling 2D
        x = layers.GlobalAveragePooling2D(name="global_avg_pool")(x)

        # 5. Fully Connected Dense Layer with L2 Regularization
        x = layers.Dense(
            units=self.config.DENSE_UNITS,
            activation="relu",
            kernel_regularizer=regularizers.l2(1e-4),
            name="fc_dense_256",
        )(x)

        # 6. Batch Normalization
        x = layers.BatchNormalization(name="batch_norm")(x)

        # 7. Dropout for Overfitting Control
        x = layers.Dropout(rate=self.config.DROPOUT_RATE, name="dropout_0.3")(x)

        # 8. Softmax Output Classification Head
        outputs = layers.Dense(
            units=self.config.NUM_CLASSES,
            activation="softmax",
            name="disease_predictions",
        )(x)

        # Construct Functional Keras Model
        model = models.Model(inputs=inputs, outputs=outputs, name="SmartCropAI_MobileNetV2")

        # 9. Compile Model with Adam Optimizer & Categorical Metrics
        optimizer = tf.keras.optimizers.Adam(learning_rate=self.config.INITIAL_LEARNING_RATE)

        model.compile(
            optimizer=optimizer,
            loss="categorical_crossentropy",
            metrics=[
                "accuracy",
                tf.keras.metrics.TopKCategoricalAccuracy(k=3, name="top_3_accuracy"),
            ],
        )

        logger.info("Model built and compiled successfully.")
        return model

    def display_model_summary(self, model: tf.keras.Model) -> None:
        """Prints formatted summary & layer parameter counts."""
        model.summary(print_fn=logger.info)
        total_params = model.count_params()
        trainable_params = sum([tf.keras.backend.count_params(w) for w in model.trainable_weights])
        non_trainable_params = total_params - trainable_params

        logger.info(f"Total Parameters     : {total_params:,}")
        logger.info(f"Trainable Parameters : {trainable_params:,}")
        logger.info(f"Non-Trainable Params : {non_trainable_params:,}")


if __name__ == "__main__":
    config = ModelConfig()
    builder = CropDiseaseModelBuilder(config)
    model = builder.build_transfer_model()
    builder.display_model_summary(model)
