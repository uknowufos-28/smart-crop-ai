import {
  loadTensorflowModel,
  TensorflowModel,
} from "react-native-fast-tflite";
import { CROP_DISEASE_CLASSES, getClassInfoByIndex } from "../constants/classes";
import {
  preprocessLeafImage,
  TfliteInputLayout,
} from "./imagePreprocessing";

import plantdocModel from "../../assets/models/plantdoc_mobilenetv3_small.tflite";

export const MODEL_VERSION = "plantdoc-mobilenetv3-small-v1";

export interface PredictionResult {
  classIndex: number;
  rawLabel: string;
  cropName: string;
  diseaseName: string;
  confidenceScore: number;
  confidencePercentage: string;
  isHealthy: boolean | null;
  latencyMs: number;
  timestamp: string;
  alternatives: PredictionAlternative[];
}

export interface PredictionAlternative {
  classIndex: number;
  rawLabel: string;
  cropName: string;
  diseaseName: string;
  confidenceScore: number;
}

export class InferenceUnavailableError extends Error {
  constructor(message = "The on-device PlantDoc model is unavailable.") {
    super(message);
    this.name = "InferenceUnavailableError";
  }
}

class TFLiteMobileInferenceEngine {
  private modelPromise: Promise<TensorflowModel> | undefined;

  private async getModel(): Promise<{
    model: TensorflowModel;
    inputLayout: TfliteInputLayout;
  }> {
    if (!this.modelPromise) {
      this.modelPromise = loadTensorflowModel(plantdocModel);
    }

    try {
      const model = await this.modelPromise;
      if (model.inputs.length !== 1 || model.outputs.length !== 1) {
        throw new Error("The PlantDoc model must have one input and one output tensor.");
      }

      const [input] = model.inputs;
      const [output] = model.outputs;
      const inputShape = input.shape;
      const nchw = [1, 3, 224, 224];
      const nhwc = [1, 224, 224, 3];
      const nchwFlat = [1, 3 * 224 * 224];
      let inputLayout: TfliteInputLayout;
      if (
        (inputShape.length === 4 &&
          inputShape.every((dimension, index) => dimension === nchw[index])) ||
        (inputShape.length === 2 &&
          inputShape.every((dimension, index) => dimension === nchwFlat[index]))
      ) {
        inputLayout = "NCHW";
      } else if (
        inputShape.every((dimension, index) => dimension === nhwc[index]) &&
        inputShape.length === 4
      ) {
        inputLayout = "NHWC";
      } else {
        throw new Error(
          `Unsupported PlantDoc input tensor shape ${inputShape.join("x")}; expected [1, 150528], [1, 3, 224, 224], or [1, 224, 224, 3].`
        );
      }

      if (input.dataType !== "float32") {
        throw new Error(`Unsupported PlantDoc input type: ${input.dataType}.`);
      }
      if (
        output.dataType !== "float32" ||
        output.shape.length !== 2 ||
        output.shape[0] !== 1 ||
        output.shape[1] !== CROP_DISEASE_CLASSES.length
      ) {
        throw new Error(
          `PlantDoc output must be float32 [1, ${CROP_DISEASE_CLASSES.length}].`
        );
      }

      return { model, inputLayout };
    } catch (error) {
      this.modelPromise = undefined;
      const message =
        error instanceof Error ? error.message : "Unknown model loading error.";
      throw new InferenceUnavailableError(
        `Could not load the bundled PlantDoc model: ${message}`
      );
    }
  }

  public async predict(imageUri: string): Promise<PredictionResult> {
    const startTime = Date.now();
    const { model, inputLayout } = await this.getModel();
    const input = await preprocessLeafImage(imageUri, inputLayout);
    const outputs = await model.run([input]);
    const logits = outputs[0];
    if (!logits || logits.length !== CROP_DISEASE_CLASSES.length) {
      throw new Error("PlantDoc inference returned an unexpected output length.");
    }

    const values = Array.from(logits);
    if (values.some((value) => !Number.isFinite(value))) {
      throw new Error("PlantDoc inference returned a non-finite score.");
    }
    const maxLogit = Math.max(...values);
    const expValues = values.map((value) => Math.exp(value - maxLogit));
    const probabilityTotal = expValues.reduce((total, value) => total + value, 0);
    if (!Number.isFinite(probabilityTotal) || probabilityTotal <= 0) {
      throw new Error("PlantDoc inference returned invalid scores.");
    }

    const alternatives = expValues
      .map((score, classIndex) => {
        const classInfo = getClassInfoByIndex(classIndex);
        if (classInfo.rawLabel === "Unknown___Unknown") {
          throw new Error(`PlantDoc returned an unmapped class index: ${classIndex}.`);
        }
        return {
          classIndex,
          rawLabel: classInfo.rawLabel,
          cropName: classInfo.cropName,
          diseaseName: classInfo.diseaseName,
          confidenceScore: score / probabilityTotal,
        };
      })
      .sort((left, right) => right.confidenceScore - left.confidenceScore)
      .slice(0, 3);
    const [topPrediction] = alternatives;
    if (!topPrediction) {
      throw new Error("PlantDoc inference returned no class scores.");
    }
    const classIndex = topPrediction.classIndex;
    const confidenceScore = expValues[classIndex] / probabilityTotal;
    const classInfo = getClassInfoByIndex(classIndex);

    return {
      classIndex,
      rawLabel: classInfo.rawLabel,
      cropName: classInfo.cropName,
      diseaseName: classInfo.diseaseName,
      confidenceScore,
      confidencePercentage: `${(confidenceScore * 100).toFixed(1)}%`,
      isHealthy: classInfo.isHealthy,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      alternatives,
    };
  }
}

export const tfliteService = new TFLiteMobileInferenceEngine();
