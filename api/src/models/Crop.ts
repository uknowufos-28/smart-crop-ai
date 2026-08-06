import { Schema, model, Document } from "mongoose";

export interface ICrop extends Document {
  name: string;
  scientificName: string;
  description: string;
  supportedDiseases: string[];
  createdAt: Date;
  updatedAt: Date;
}

const cropSchema = new Schema<ICrop>(
  {
    name: {
      type: String,
      required: [true, "Crop name is required"],
      unique: true,
      trim: true,
      index: true,
    },
    scientificName: {
      type: String,
      required: [true, "Scientific name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    supportedDiseases: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Crop = model<ICrop>("Crop", cropSchema);
