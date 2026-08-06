/**
 * Master Class Index Labels matching SmartCropAI MobileNetV2 trained dataset.
 */

export interface ClassLabelInfo {
  index: number;
  rawLabel: string;
  cropName: string;
  diseaseName: string;
  isHealthy: boolean;
}

export const CROP_DISEASE_CLASSES: ClassLabelInfo[] = [
  {
    index: 0,
    rawLabel: "Apple___Apple_scab",
    cropName: "Apple",
    diseaseName: "Apple Scab",
    isHealthy: false,
  },
  {
    index: 1,
    rawLabel: "Apple___Black_rot",
    cropName: "Apple",
    diseaseName: "Black Rot",
    isHealthy: false,
  },
  {
    index: 2,
    rawLabel: "Apple___Cedar_apple_rust",
    cropName: "Apple",
    diseaseName: "Cedar Apple Rust",
    isHealthy: false,
  },
  {
    index: 3,
    rawLabel: "Apple___healthy",
    cropName: "Apple",
    diseaseName: "Healthy Leaf",
    isHealthy: true,
  },
  {
    index: 4,
    rawLabel: "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    cropName: "Corn",
    diseaseName: "Cercospora Gray Leaf Spot",
    isHealthy: false,
  },
  {
    index: 5,
    rawLabel: "Corn_(maize)___Common_rust_",
    cropName: "Corn",
    diseaseName: "Common Rust",
    isHealthy: false,
  },
  {
    index: 6,
    rawLabel: "Corn_(maize)___Northern_Leaf_Blight",
    cropName: "Corn",
    diseaseName: "Northern Leaf Blight",
    isHealthy: false,
  },
  {
    index: 7,
    rawLabel: "Corn_(maize)___healthy",
    cropName: "Corn",
    diseaseName: "Healthy Leaf",
    isHealthy: true,
  },
  {
    index: 8,
    rawLabel: "Tomato___Bacterial_spot",
    cropName: "Tomato",
    diseaseName: "Bacterial Spot",
    isHealthy: false,
  },
  {
    index: 9,
    rawLabel: "Tomato___Early_blight",
    cropName: "Tomato",
    diseaseName: "Early Blight",
    isHealthy: false,
  },
];

/**
 * Resolves class label details from model index.
 */
export const getClassInfoByIndex = (index: number): ClassLabelInfo => {
  return (
    CROP_DISEASE_CLASSES.find((c) => c.index === index) || {
      index,
      rawLabel: "Unknown___Unknown",
      cropName: "Unknown Crop",
      diseaseName: "Unrecognized Disease",
      isHealthy: false,
    }
  );
};
