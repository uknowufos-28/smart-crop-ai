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
  };
  Treatment: {
    diseaseName: string;
    cropName: string;
  };
  HistorySettings: undefined;
};
