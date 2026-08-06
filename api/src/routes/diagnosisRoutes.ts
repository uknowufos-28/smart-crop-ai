import { Router } from "express";
import {
  syncDiagnosisBatch,
  getUserDiagnoses,
  getDiagnosisById,
} from "../controllers/diagnosisController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// All diagnosis routes require JWT authentication
router.use(authenticateToken);

router.post("/sync", syncDiagnosisBatch);
router.get("/", getUserDiagnoses);
router.get("/:id", getDiagnosisById);

export default router;
