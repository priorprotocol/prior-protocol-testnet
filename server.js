// This is a simple entry point file for running the built application
// It's used by Vercel and other Node.js hosting platforms

// Import the built application from the dist directory
import { app, setupServer, server } from './dist/index.js';

// Initialize the server
(async () => {
  try {
    // Setup the server (registers routes, etc.)
    await setupServer();
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();