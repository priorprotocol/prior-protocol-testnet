import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const router = express.Router();

// Get persistent points for a user
router.get('/users/:address/persistent-points', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'User address is required'
      });
    }
    
    // First, get the user
    const user = await storage.getUser(address);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get the persistent points
    const persistentPointsInfo = await storage.getPersistentPoints(user.id);
    
    return res.status(200).json({
      success: true,
      data: persistentPointsInfo
    });
  } catch (error) {
    console.error(`Error getting persistent points:`, error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while getting persistent points',
      error: String(error)
    });
  }
});

// Force sync persistent points for a user
router.post('/users/:address/sync-persistent-points', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'User address is required'
      });
    }
    
    // First, get the user
    const user = await storage.getUser(address);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Sync persistent points
    const result = await storage.syncPersistentPoints(user.id);
    
    return res.status(200).json({
      success: true,
      message: 'Persistent points synced successfully',
      data: result
    });
  } catch (error) {
    console.error(`Error syncing persistent points:`, error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while syncing persistent points',
      error: String(error)
    });
  }
});

// Admin endpoint to rebuild persistent points for all users
router.post('/admin/rebuild-persistent-points', async (req, res) => {
  try {
    // Check for admin authorization (using the same admin address as other endpoints)
    const adminAddress = "0x4CfC531df94339DEF7dcd603AAC1a2dEaF6888b7";
    const { address } = req.body;
    
    if (address?.toLowerCase() !== adminAddress.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Admin privileges required.'
      });
    }
    
    console.log(`[PersistentPoints] Admin rebuilding persistent points for all users`);
    
    // Get all users
    const allUsers = await storage.getLeaderboard(1000); // Get a large number of users
    const userResults = [];
    
    // Process each user
    for (const user of allUsers.users) {
      try {
        // Sync persistent points
        const syncResult = await storage.syncPersistentPoints(user.id);
        
        userResults.push({
          userId: user.id,
          address: user.address,
          persistentPoints: syncResult.persistentPoints,
          regularPoints: syncResult.regularPoints,
          updatedAt: syncResult.updatedAt
        });
      } catch (error) {
        console.error(`Error syncing persistent points for user ${user.id}:`, error);
        // Continue with other users even if one fails
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Persistent points rebuilt for ${userResults.length} users`,
      data: {
        totalUsers: userResults.length,
        results: userResults
      }
    });
  } catch (error) {
    console.error(`Error rebuilding persistent points:`, error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while rebuilding persistent points',
      error: String(error)
    });
  }
});

export default router;