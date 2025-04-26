import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { DatabaseStorage } from "./database-storage";
import http from "http";
import cors from "cors";
import path from "path";

// Export the Express app for production use
export const app = express();

// Add CORS headers
app.use(cors({
  origin: true,
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
      log(logLine);
    }
  });

  next();
});


// Setup function that can be called in development or production
export const setupServer = async () => {
  const port = process.env.PORT || 5000;

  try {
    // Initialize database if using DatabaseStorage
    if (storage instanceof DatabaseStorage) {
      log("🔄 Initializing database connection...");
      await (storage as DatabaseStorage).seedDatabase();
      log("✅ Database initialization completed");
    }

    // Create HTTP server
    const server = http.createServer(app);

    // Register routes
    await registerRoutes(app);

    // Setup Vite in development or serve static files in production
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      // Serve static files from the client build directory
      app.use(express.static(path.join(process.cwd(), 'client/dist')));
      
      // Handle client-side routing by serving index.html for all routes
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
          // Skip API routes
          return res.status(404).send('API endpoint not found');
        }
        res.sendFile(path.join(process.cwd(), 'client/dist/index.html'));
      });
    }

    // Check if port is in use and handle graceful shutdown
    try {
      // Attempt to close any existing connections
      server.close();
      
      // Start server with improved error handling
      server.listen(port, '0.0.0.0', () => {
        log(`🚀 Server running on port ${port}`);
      });

      // Handle server errors
      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          log(`❌ Port ${port} is already in use. Trying to close existing connection...`);
          require('child_process').exec(`npx kill-port ${port}`, (err: any) => {
            if (err) {
              log(`Failed to free port ${port}: ${err}`);
              process.exit(1);
            }
            // Retry starting server after port is freed
            server.listen(port, '0.0.0.0');
          });
        } else {
          log(`Server error: ${error}`);
          process.exit(1);
        }
      });

      return server;
    } catch (error) {
      log(`Failed to start server: ${error}`);
      throw error;
    }
  } catch (error) {
    log(`Error starting server: ${error}`);
    throw error;
  }
};

// Enhanced error handling middleware with more detailed logging
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log detailed error information
    log(`🔴 Error handling request to ${req.method} ${req.path}: ${err.stack || err.message || err}`);

    // Send appropriate error response without exposing internal details
    res.status(status).json({ 
      message,
      error: app.get("env") === "development" ? err.message : "An error occurred"
    });

    // Don't throw the error after handling it - this causes unhandled rejections
    // and can crash the server in production
  });


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
      reusePort: true
    }, () => {
      log(`🚀 Server running on port ${port}`);
    });
  } catch (error) {
    log(`Error starting server: ${error}`);
  }
})();