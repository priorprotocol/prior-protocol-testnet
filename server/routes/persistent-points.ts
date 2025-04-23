import express from 'express';
import { storage } from '../storage';

const persistentPointsRouter = express.Router();

/**
 * GET /api/users/:address/persistent-points
 * Get persistent points for a user
 */
persistentPointsRouter.get('/users/:address/persistent-points', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Normalize address
    const normalizedAddress = address.toLowerCase();
    console.log(`[API] Getting persistent points for address: ${normalizedAddress}`);
    
    // Get user by address, auto-create if needed
    let user = await storage.getUser(normalizedAddress);
    
    if (!user) {
      console.log(`Auto-creating user for address: ${normalizedAddress}`);
      try {
        user = await storage.createUser({
          address: normalizedAddress
        });
        console.log(`User created with ID: ${user.id}`);
      } catch (createError) {
        console.error(`Failed to create user for ${normalizedAddress}:`, createError);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to create user"
        });
      }
    }
    
    // Get persistent points data
    const persistentPointsData = await storage.getPersistentPoints(user.id);
    
    console.log(`[API] Retrieved persistent points for ${normalizedAddress}:`, persistentPointsData);
    return res.json({
      success: true,
      data: persistentPointsData
    });
  } catch (error) {
    console.error("[API Error] Failed to get persistent points:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to get persistent points" 
    });
  }
});

/**
 * POST /api/users/:address/sync-persistent-points
 * Manually sync persistent points for a user
 */
persistentPointsRouter.post('/users/:address/sync-persistent-points', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Normalize address
    const normalizedAddress = address.toLowerCase();
    console.log(`[API] Syncing persistent points for address: ${normalizedAddress}`);
    
    // Get user by address, auto-create if needed
    let user = await storage.getUser(normalizedAddress);
    
    if (!user) {
      console.log(`Auto-creating user for address: ${normalizedAddress}`);
      try {
        user = await storage.createUser({
          address: normalizedAddress
        });
        console.log(`User created with ID: ${user.id}`);
      } catch (createError) {
        console.error(`Failed to create user for ${normalizedAddress}:`, createError);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to create user"
        });
      }
    }
    
    // Sync persistent points
    try {
      console.log(`[API] Starting to sync persistent points for user ${user.id} (${normalizedAddress})`);
      const syncResult = await storage.syncPersistentPoints(user.id);
      console.log(`[API] Sync completed successfully for ${normalizedAddress}. Result:`, syncResult);
      
      return res.json({
        success: true,
        data: syncResult
      });
    } catch (syncError) {
      console.error(`[API] Failed to sync persistent points for ${normalizedAddress}:`, syncError);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to sync persistent points",
        error: syncError instanceof Error ? syncError.message : String(syncError)
      });
    }
  } catch (error) {
    console.error("[API Error] Failed to sync persistent points:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to sync persistent points" 
    });
  }
});

export default persistentPointsRouter;