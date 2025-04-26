
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';
import { app, setupServer } from './dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the server
(async () => {
  try {
    const server = await setupServer();
    
    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, 'client/dist')));
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        res.sendFile(path.join(__dirname, 'client/dist/index.html'));
      });
    }

    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
