import { PredictionAlternative } from "../services/tfliteService";

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Scanner: undefined;
  Prediction: {
    imageUri: string;
    cropName: string;
    diseaseName: string;
    confidence: number;
    latencyMs: number;
    alternatives?: PredictionAlternative[];
    scanId?: string;
    savedAt?: string;
    savedLocally?: boolean;
    modelVersion?: string;
  };
  Treatment: {
    diseaseName: string;
    cropName: string;
  };
  HistorySettings: undefined;
};
