import { Schema, model, Document, Types } from "mongoose";

export interface ITreatment extends Document {
  diseaseName: string;
  cropId?: Types.ObjectId;
  symptoms: string[];
  organicTreatment: string;
  chemicalTreatment: string;
  preventativeMeasures: string[];
  createdAt: Date;
  updatedAt: Date;
}

const treatmentSchema = new Schema<ITreatment>(
  {
    diseaseName: {
      type: String,
      required: [true, "Disease name is required"],
      unique: true,
      trim: true,
      index: true,
    },
    cropId: {
      type: Schema.Types.ObjectId,
      ref: "Crop",
    },
    symptoms: {
      type: [String],
      required: [true, "Symptoms list is required"],
    },
    organicTreatment: {
      type: String,
      required: [true, "Organic treatment recommendation is required"],
    },
    chemicalTreatment: {
      type: String,
      required: [true, "Chemical treatment recommendation is required"],
    },
    preventativeMeasures: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Treatment = model<ITreatment>("Treatment", treatmentSchema);
