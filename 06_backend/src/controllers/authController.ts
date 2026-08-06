import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

// Zod Input Validation Schemas
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["farmer", "agronomist", "admin"]).optional().default("farmer"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address format"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Generates signed JWT access token (valid for 7 days).
 */
const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign({ userId, email, role }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * @route POST /api/v1/auth/register
 * @desc  Register new user, hash password with BCrypt, & return JWT token
 * @access Public
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, email, password, role } = parseResult.data;

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        error: "Conflict",
        message: "An account with this email address already exists.",
      });
      return;
    }

    // Hash password with BCrypt cost factor 12
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save User Document
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    const token = generateToken(newUser._id.toString(), newUser.email, newUser.role);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/v1/auth/login
 * @desc  Authenticate user email & password, & return JWT token
 * @access Public
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parseResult.data;

    // Query user explicitly selecting hidden password field
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !user.password) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid email address or password.",
      });
      return;
    }

    // Verify password match using BCrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid email address or password.",
      });
      return;
    }

    const token = generateToken(user._id.toString(), user.email, user.role);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/auth/me
 * @desc  Get current authenticated user profile
 * @access Protected
 */
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", message: "User identity missing" });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: "NotFound", message: "User account not found." });
      return;
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
