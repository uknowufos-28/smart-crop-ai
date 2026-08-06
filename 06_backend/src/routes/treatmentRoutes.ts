import { Router } from "express";
import {
  getAllTreatments,
  getTreatmentByDisease,
  createTreatment,
} from "../controllers/treatmentController.js";
import { authenticateToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

// Public treatment lookup endpoints
router.get("/", getAllTreatments);
router.get("/:diseaseName", getTreatmentByDisease);

// Protected administrative creation endpoint (Admin or Agronomist only)
router.post("/", authenticateToken, authorizeRoles("admin", "agronomist"), createTreatment);

export default router;
