import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Treatment } from "../models/Treatment.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

// Zod Input Validation Schema
const createTreatmentSchema = z.object({
  diseaseName: z.string().min(1, "Disease name is required"),
  cropId: z.string().optional(),
  symptoms: z.array(z.string()).min(1, "At least one symptom required"),
  organicTreatment: z.string().min(5, "Organic treatment details required"),
  chemicalTreatment: z.string().min(5, "Chemical treatment details required"),
  preventativeMeasures: z.array(z.string()).optional().default([]),
});

/**
 * @route GET /api/v1/treatments
 * @desc  Fetch all available disease treatment guides
 * @access Public
 */
export const getAllTreatments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const treatments = await Treatment.find().populate("cropId", "name scientificName");
    res.status(200).json({ count: treatments.length, treatments });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/treatments/:diseaseName
 * @desc  Fetch specific treatment remedy by disease name (case-insensitive)
 * @access Public
 */
export const getTreatmentByDisease = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { diseaseName } = req.params;
    const cleanName = decodeURIComponent(diseaseName).trim();

    const treatment = await Treatment.findOne({
      diseaseName: { $regex: new RegExp(`^${cleanName}$`, "i") },
    }).populate("cropId", "name scientificName");

    if (!treatment) {
      res.status(404).json({
        error: "NotFound",
        message: `No treatment guide found for disease: '${cleanName}'`,
      });
      return;
    }

    res.status(200).json({ treatment });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/v1/treatments
 * @desc  Create or update disease treatment remedy guide
 * @access Protected (Admin / Agronomist only)
 */
export const createTreatment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parseResult = createTreatmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const data = parseResult.data;

    // Upsert treatment document (create if new, update if exists)
    const treatment = await Treatment.findOneAndUpdate(
      { diseaseName: { $regex: new RegExp(`^${data.diseaseName.trim()}$`, "i") } },
      { ...data, diseaseName: data.diseaseName.trim() },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({
      message: "Treatment master record created/updated successfully",
      treatment,
    });
  } catch (error) {
    next(error);
  }
};
