import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";

/**
 * Production Express Application Configuration.
 */
const app = express();

// 1. Security Middleware
app.use(helmet());

// 2. CORS Middleware
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 3. HTTP Request Logging
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// 4. Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * @route GET /health
 * @desc  System Health Check Endpoint
 * @access Public
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "online",
    service: "SmartCropAI-Backend",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsage: {
      rssMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      heapTotalMB: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
    },
    environment: env.NODE_ENV,
  });
});

/**
 * 404 Route Handler for undefined endpoints.
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "NotFound",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Global Error Handler Middleware.
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`💥 Global Exception Handler caught: ${err.message}`, err.stack);
  res.status(500).json({
    error: "InternalServerError",
    message: env.NODE_ENV === "production" ? "An internal server error occurred" : err.message,
    timestamp: new Date().toISOString(),
  });
});

export default app;
