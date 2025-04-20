import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { DatabaseStorage } from "./database-storage";
import http from "http";
import cors from "cors";

// Export the Express app for production use
export const app = express();

// Configure CORS to allow requests from any origin in development
// In production, you would want to restrict this to specific domains
app.use(cors({
  origin: true, // Allow any origin
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add middleware for logging API responses
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Export the server for production use
export let server: http.Server;

// Setup function that can be called in development or production
export const setupServer = async () => {
  // Initialize database if using DatabaseStorage
  if (storage instanceof DatabaseStorage) {
    try {
      log("Initializing database...");
      await (storage as DatabaseStorage).seedDatabase();
      log("Database initialized successfully");
    } catch (error) {
      log(`Error initializing database: ${error}`);
    }
  }
  
  // Register API routes
  server = await registerRoutes(app);

  // Add error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite in development or serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return server;
};

// Start the server in development mode
// This code will run when the file is executed directly
// In ESM, we can't directly check if this is the main module, so we just run it
// The server.js file will handle imports differently for production
(async () => {
  try {
    const appServer = await setupServer();
    
    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = process.env.PORT || 5000;
    appServer.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    log(`Error starting server: ${error}`);
  }
})();
