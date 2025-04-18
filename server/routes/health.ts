/**
 * Health check endpoint for Railway deployment
 */

import { Router } from 'express';

const router = Router();

// Simple health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'prior-protocol-testnet',
    version: process.env.npm_package_version || '1.0.0'
  });
});

export default router;