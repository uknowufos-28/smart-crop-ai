import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env
dotenv.config();

/**
 * Zod schema defining strict environment variable type constraints.
 */
const envSchema = z.object({
  PORT: z
    .string()
    .default("5000")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val < 65536, {
      message: "PORT must be a valid port number between 1 and 65535",
    }),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  MONGODB_URI: z
    .string()
    .default("mongodb://localhost:27017/smartcropai"),
  JWT_SECRET: z
    .string()
    .min(16, { message: "JWT_SECRET must be at least 16 characters long" })
    .default("production_super_secret_jwt_key_change_in_prod_12345!"),
  CORS_ORIGIN: z.string().default("*"),
});

/**
 * Validates process.env against envSchema.
 * Throws an explicit error and terminates process if invalid.
 */
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid Backend Environment Variables:");
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
