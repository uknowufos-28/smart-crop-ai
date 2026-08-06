import { Router } from "express";
import { register, login, getProfile } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * Public Authentication Endpoints
 */
router.post("/register", register);
router.post("/login", login);

/**
 * Protected Authentication Endpoints
 */
router.get("/me", authenticateToken, getProfile);

export default router;
