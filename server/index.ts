import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import http from "http";
import cors from "cors";
import { createServer } from 'http';
import WebSocket from 'ws';


// Export the Express app for production use
export const app = express();

// Add CORS headers manually to handle preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  log(`CORS request from origin: ${origin}`);  
  const allowedOrigins = [
    'https://testnetpriorprotocol.xyz',
    'http://testnetpriorprotocol.xyz',
    'https://www.testnetpriorprotocol.xyz',
    'http://www.testnetpriorprotocol.xyz',
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
    'https://deploy-preview-*.netlify.app',
    'https://prior-protocol-testnet-priorprotocol.replit.app',
    'http://prior-protocol-testnet-priorprotocol.replit.app'
  ];  
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
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, cache-control, no-cache, If-Modified-Since, Range');
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    log(`Using fallback CORS for origin: ${origin}`);    
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else {
      res.header('Access-Control-Allow-Origin', 'https://prior-protocol-testnet-priorprotocol.replit.app');
      res.header('Access-Control-Allow-Credentials', 'true');
    }    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, cache-control, no-cache, If-Modified-Since, Range');
  }  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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


// API routes
app.use('/api', registerRoutes(app));

// Health check endpoint (from edited code)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export the server for production use
export let server: http.Server;

// Setup function that can be called in development or production
export const setupServer = async () => {
  log("🔄 Initializing in-memory storage...");
  try {
    await storage.refreshLeaderboardCache();
    log("✅ Leaderboard cache refreshed successfully");
  } catch (error) {
    log(`🔴 Error initializing storage: ${error}`);
    log("⚠️ The application will start but with limited functionality");
  }
  

  // Create HTTP server (from edited code, but using createServer)
  server = createServer(app);

  // Initialize WebSocket server (from edited code)
  const wss = new WebSocket.Server({ server });

  // WebSocket connection handling (from edited code)
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });


  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    log(`🔴 Error handling request to ${req.method} ${req.path}: ${err.stack || err.message || err}`);
    res.status(status).json({ 
      message,
      error: app.get("env") === "development" ? err.message : "An error occurred"
    });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return server;
};

(async () => {
  try {
    const appServer = await setupServer();
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