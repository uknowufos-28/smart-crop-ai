import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";

/**
 * Server Entry Point & Process Manager for SmartCropAI.
 */
const startServer = async () => {
  // Connect to MongoDB database
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 SmartCropAI Production REST Server listening on port: ${env.PORT} [ENV: ${env.NODE_ENV}]`);
    console.log(`🏥 Health Check URL: http://localhost:${env.PORT}/health`);
  });

  /**
   * Graceful Shutdown Handler for SIGTERM & SIGINT.
   */
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
    await disconnectDatabase();
    server.close(() => {
      console.log("✅ HTTP server closed. Process terminating clean.");
      process.exit(0);
    });

    // Force exit after 10s timeout
    setTimeout(() => {
      console.error("⚠️ Forced shutdown after timeout!");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

startServer();
