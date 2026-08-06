import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Production MongoDB Database Connection Manager.
 * Handles pool connections, event logging, and graceful disconnects.
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    // Configure Mongoose options
    mongoose.set("strictQuery", true);

    // Event listeners
    mongoose.connection.on("connected", () => {
      console.log("🍃 MongoDB database connected successfully.");
    });

    mongoose.connection.on("error", (err) => {
      console.error("💥 MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB connection disconnected.");
    });

    // Establish connection
    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV === "development",
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    console.error("💥 Failed to connect to MongoDB:", error);
    // In production, database connection failure should abort server startup
    if (env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

/**
 * Closes the active MongoDB connection cleanly.
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed gracefully.");
  }
};
