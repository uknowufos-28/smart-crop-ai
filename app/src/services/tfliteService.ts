export interface PredictionResult {
  classIndex: number;
  rawLabel: string;
  cropName: string;
  diseaseName: string;
  confidenceScore: number;
  confidencePercentage: string;
  isHealthy: boolean;
  latencyMs: number;
  timestamp: string;
}

export class InferenceUnavailableError extends Error {
  constructor() {
    super(
      'A field-validated on-device model is not installed yet. No diagnosis was made.'
    );
    this.name = 'InferenceUnavailableError';
  }
}

class TFLiteMobileInferenceEngine {
  public async predict(_imageUri: string): Promise<PredictionResult> {
    throw new InferenceUnavailableError();
  }
}

export const tfliteService = new TFLiteMobileInferenceEngine();
