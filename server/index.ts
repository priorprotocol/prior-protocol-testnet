import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
// Temporarily disabled due to syntax errors
// import { DatabaseStorage } from "./database-storage";
import http from "http";
import cors from "cors";

// Export the Express app for production use
export const app = express();

// Add CORS headers manually to handle preflight requests
app.use((req, res, next) => {
  // Debug information
  const origin = req.headers.origin;
  log(`CORS request from origin: ${origin}`);
  
  // IMPORTANT: Ensure all Netlify and Replit domains are explicitly listed here
  const allowedOrigins = [
    // Custom domains
    'https://testnetpriorprotocol.xyz',
    'http://testnetpriorprotocol.xyz',
    'https://www.testnetpriorprotocol.xyz',
    'http://www.testnetpriorprotocol.xyz',
    // Netlify domains
    'https://priortestnetv2.netlify.app',
    'http://priortestnetv2.netlify.app',
    'https://prior-protocol-testnet.netlify.app',
    'http://prior-protocol-testnet.netlify.app',
    'https://testnetpriorprotocol.netlify.app',
    'http://testnetpriorprotocol.netlify.app',
    'https://prior-testnet.netlify.app',
    'http://prior-testnet.netlify.app',
    'https://prior-test.netlify.app',
    'http://prior-test.netlify.app',
    'https://prior-protocol.netlify.app',
    'http://prior-protocol.netlify.app',
    // Don't forget the actual deploy previews on Netlify which use different domains
    'https://deploy-preview-*.netlify.app',
    // Replit domains
    'https://prior-protocol-testnet-priorprotocol.replit.app',
    'http://prior-protocol-testnet-priorprotocol.replit.app'
  ];
  
  // Check if origin is in allowed list or matches our development domains
  // For Netlify deploy previews which have dynamic URLs
  const isNetlifyPreview = origin && (
    origin.includes('netlify.app') || 
    origin.includes('netlify.com')
  );
  
  if (origin && (
    allowedOrigins.includes(origin) || 
    origin.includes('localhost') ||
    origin.includes('replit.dev') ||
    origin.includes('replit.app') ||
    origin.includes('janeway.replit') ||
    isNetlifyPreview
  )) {
    log(`Allowing CORS for origin: ${origin}`);
    // Set the exact origin rather than * for security
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, cache-control, no-cache, If-Modified-Since, Range');
    // Important for cookies/sessions
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    // Fallback for development, but use more restrictive settings
    log(`Using fallback CORS for origin: ${origin}`);
    
    // IMPORTANT: With credentials mode 'include', we can't use '*' for Allow-Origin
    // So we need to explicitly set the origin if it exists, or default to a known domain
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else {
      // If no origin, use primary domain as fallback
      res.header('Access-Control-Allow-Origin', 'https://prior-protocol-testnet-priorprotocol.replit.app');
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, cache-control, no-cache, If-Modified-Since, Range');
  }
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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
  // We're using in-memory storage for now (DatabaseStorage is disabled)
  log("🔄 Initializing in-memory storage...");

  // Initialize any necessary in-memory data
  try {
    // Force a cache refresh on startup to ensure consistent data
    await storage.refreshLeaderboardCache();
    log("✅ Leaderboard cache refreshed successfully");
  } catch (error) {
    log(`🔴 Error initializing storage: ${error}`);
    log("⚠️ The application will start but with limited functionality");
  }
  
  // Register API routes
  server = await registerRoutes(app);

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
