import { Schema, model, Document, Types } from "mongoose";

export interface IDiagnosisLog extends Document {
  userId: Types.ObjectId;
  cropName: string;
  diseaseName: string;
  confidenceScore: number;
  isOfflineDiagnosis: boolean;
  notes?: string;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const diagnosisLogSchema = new Schema<IDiagnosisLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    cropName: {
      type: String,
      required: [true, "Crop name is required"],
      trim: true,
    },
    diseaseName: {
      type: String,
      required: [true, "Disease name is required"],
      trim: true,
      index: true,
    },
    confidenceScore: {
      type: Number,
      required: [true, "Confidence score is required"],
      min: 0.0,
      max: 1.0,
    },
    isOfflineDiagnosis: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: "",
    },
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const DiagnosisLog = model<IDiagnosisLog>("DiagnosisLog", diagnosisLogSchema);
