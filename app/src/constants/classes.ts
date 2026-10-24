/**
 * Class order must match PlantDoc ImageFolder's sorted directory names and the trained model output.
 */
export interface ClassLabelInfo {
  index: number;
  rawLabel: string;
  cropName: string;
  diseaseName: string;
  isHealthy: boolean | null;
}

export const CROP_DISEASE_CLASSES: ClassLabelInfo[] = [
  { index: 0, rawLabel: "Apple Scab Leaf", cropName: "Apple", diseaseName: "Scab", isHealthy: false },
  { index: 1, rawLabel: "Apple leaf", cropName: "Apple", diseaseName: "Unspecified leaf class", isHealthy: null },
  { index: 2, rawLabel: "Apple rust leaf", cropName: "Apple", diseaseName: "Rust", isHealthy: false },
  { index: 3, rawLabel: "Bell_pepper leaf", cropName: "Bell pepper", diseaseName: "Unspecified leaf class", isHealthy: null },
  { index: 4, rawLabel: "Bell_pepper leaf spot", cropName: "Bell pepper", diseaseName: "Leaf spot", isHealthy: false },
  { index: 5, rawLabel: "Blueberry leaf", cropName: "Blueberry", diseaseName: "Unspecified leaf class", isHealthy: null },
  { index: 6, rawLabel: "Cherry leaf", cropName: "Cherry", diseaseName: "Unspecified leaf class", isHealthy: null },
  { index: 7, rawLabel: "Corn Gray leaf spot", cropName: "Corn", diseaseName: "Gray leaf spot", isHealthy: false },
  { index: 8, rawLabel: "Corn leaf blight", cropName: "Corn", diseaseName: "Leaf blight", isHealthy: false },
  { index: 9, rawLabel: "Corn rust leaf", cropName: "Corn", diseaseName: "Rust", isHealthy: false },
  { index: 10, rawLabel: "Peach leaf", cropName: "Peach", diseaseName: "Unspecified leaf class", isHealthy: null },
  { index: 11, rawLabel: "Potato leaf early blight", cropName: "Potato", diseaseName: "Early blight", isHealthy: false },
  { index: 12, rawLabel: "Potato leaf late blight", cropName: "Potato", diseaseName: "Late blight", isHealthy: false },
  { index: 13, rawLabel: "Raspberry leaf", cropName: "Raspberry", diseaseName: "Unspecified leaf class", isHealthy: null },
  { index: 14, rawLabel: "Soyabean leaf", cropName: "Soybean", diseaseName: "Unspecified leaf class", isHealthy: null },
  { index: 15, rawLabel: "Squash Powdery mildew leaf", cropName: "Squash", diseaseName: "Powdery mildew", isHealthy: false },
  { index: 16, rawLabel: "Strawberry leaf", cropName: "Strawberry", diseaseName: "Unspecified leaf class", isHealthy: null },
  { index: 17, rawLabel: "Tomato Early blight leaf", cropName: "Tomato", diseaseName: "Early blight", isHealthy: false },
  { index: 18, rawLabel: "Tomato Septoria leaf spot", cropName: "Tomato", diseaseName: "Septoria leaf spot", isHealthy: false },
  { index: 19, rawLabel: "Tomato leaf", cropName: "Tomato", diseaseName: "Unspecified leaf class", isHealthy: null },
  { index: 20, rawLabel: "Tomato leaf bacterial spot", cropName: "Tomato", diseaseName: "Bacterial spot", isHealthy: false },
  { index: 21, rawLabel: "Tomato leaf late blight", cropName: "Tomato", diseaseName: "Late blight", isHealthy: false },
  { index: 22, rawLabel: "Tomato leaf mosaic virus", cropName: "Tomato", diseaseName: "Mosaic virus", isHealthy: false },
  { index: 23, rawLabel: "Tomato leaf yellow virus", cropName: "Tomato", diseaseName: "Yellow leaf curl virus", isHealthy: false },
  { index: 24, rawLabel: "Tomato mold leaf", cropName: "Tomato", diseaseName: "Mold", isHealthy: false },
  { index: 25, rawLabel: "Tomato two spotted spider mites leaf", cropName: "Tomato", diseaseName: "Two-spotted spider mites", isHealthy: false },
  { index: 26, rawLabel: "grape leaf", cropName: "Grape", diseaseName: "Unspecified leaf class", isHealthy: null },
  { index: 27, rawLabel: "grape leaf black rot", cropName: "Grape", diseaseName: "Black rot", isHealthy: false },
];

export const getClassInfoByIndex = (index: number): ClassLabelInfo => {
  return (
    CROP_DISEASE_CLASSES.find((classInfo) => classInfo.index === index) || {
      index,
      rawLabel: "Unknown___Unknown",
      cropName: "Unknown crop",
      diseaseName: "Unrecognized class",
      isHealthy: null,
    }
  );
};
