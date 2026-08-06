import { Response, NextFunction } from "express";
import { z } from "zod";
import { DiagnosisLog } from "../models/DiagnosisLog.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

// Zod Input Validation Schemas
const singleDiagnosisSchema = z.object({
  cropName: z.string().min(1, "Crop name is required"),
  diseaseName: z.string().min(1, "Disease name is required"),
  confidenceScore: z.number().min(0.0).max(1.0),
  isOfflineDiagnosis: z.boolean().optional().default(true),
  notes: z.string().optional().default(""),
});

const syncBatchSchema = z.object({
  diagnoses: z.array(singleDiagnosisSchema).min(1, "Diagnoses array cannot be empty"),
});

/**
 * @route POST /api/v1/diagnoses/sync
 * @desc  Bulk batch sync offline diagnosis logs from mobile device to cloud DB
 * @access Protected
 */
export const syncDiagnosisBatch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", message: "User authentication required" });
      return;
    }

    const parseResult = syncBatchSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const userId = req.user.userId;
    const diagnosisDocs = parseResult.data.diagnoses.map((item) => ({
      ...item,
      userId,
      syncedAt: new Date(),
    }));

    // Bulk insert documents into MongoDB
    const inserted = await DiagnosisLog.insertMany(diagnosisDocs);

    res.status(201).json({
      message: "Diagnosis logs synchronized successfully",
      syncedCount: inserted.length,
      syncedIds: inserted.map((doc) => doc._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/diagnoses
 * @desc  Get paginated list of diagnosis logs for authenticated user
 * @access Protected
 */
export const getUserDiagnoses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", message: "User authentication required" });
      return;
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { userId: req.user.userId };

    const totalDocs = await DiagnosisLog.countDocuments(query);
    const diagnoses = await DiagnosisLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      diagnoses,
      pagination: {
        totalDocs,
        page,
        limit,
        totalPages: Math.ceil(totalDocs / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/diagnoses/:id
 * @desc  Get specific diagnosis log details by ID
 * @access Protected
 */
export const getDiagnosisById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", message: "User authentication required" });
      return;
    }

    const { id } = req.params;
    const diagnosis = await DiagnosisLog.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!diagnosis) {
      res.status(404).json({ error: "NotFound", message: "Diagnosis log record not found" });
      return;
    }

    res.status(200).json({ diagnosis });
  } catch (error) {
    next(error);
  }
};
