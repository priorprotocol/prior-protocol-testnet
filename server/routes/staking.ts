import { Router } from 'express';
import { storage } from '../storage';
import { insertNftStakingRecordSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();
const apiPrefix = '/api';

// Get staking journey summary for an address
router.get(`${apiPrefix}/staking/:address/journey`, async (req, res) => {
  try {
    const { address } = req.params;
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address parameter is required'
      });
    }

    const stakingJourney = await storage.getStakingJourneySummary(address);
    
    return res.status(200).json({
      success: true,
      data: stakingJourney
    });
  } catch (error) {
    console.error('Error fetching staking journey:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch staking journey',
      error: String(error)
    });
  }
});

// Get all staking records for an address
router.get(`${apiPrefix}/staking/:address/records`, async (req, res) => {
  try {
    const { address } = req.params;
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address parameter is required'
      });
    }

    const stakingRecords = await storage.getNftStakingRecordsByAddress(address);
    
    return res.status(200).json({
      success: true,
      data: stakingRecords
    });
  } catch (error) {
    console.error('Error fetching staking records:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch staking records',
      error: String(error)
    });
  }
});

// Create a new staking record
router.post(`${apiPrefix}/staking/record`, async (req, res) => {
  try {
    const validationSchema = insertNftStakingRecordSchema.extend({
      address: z.string().min(1)
    });
    
    const validatedData = validationSchema.parse(req.body);
    
    // Find user ID by address
    const user = await storage.getUser(validatedData.address);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with the provided address'
      });
    }
    
    // Create staking record
    const record = await storage.createNftStakingRecord({
      ...validatedData,
      userId: user.id
    });
    
    return res.status(201).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error creating staking record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create staking record',
      error: String(error)
    });
  }
});

// Record first-time bonus for an address
router.post(`${apiPrefix}/staking/:address/bonus`, async (req, res) => {
  try {
    const { address } = req.params;
    const { amount = 200 } = req.body; // Default bonus is 200 points
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address parameter is required'
      });
    }
    
    // Find user by address
    const user = await storage.getUser(address);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with the provided address'
      });
    }
    
    // Record the first-time bonus
    const result = await storage.recordFirstTimeBonus(user.id, address, amount);
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error recording staking bonus:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record staking bonus',
      error: String(error)
    });
  }
});

// Admin endpoint to grant bonus to a list of addresses (privileged)
router.post(`${apiPrefix}/staking/grant-bonuses`, async (req, res) => {
  try {
    const { addresses, amount = 200 } = req.body;
    
    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A non-empty array of addresses is required'
      });
    }

    // Admin authorization check
    const adminAddress = '0x4CfC531df94339DEF7dcd603AAC1a2dEaF6888b7';
    const requesterAddress = req.headers['x-wallet-address'] as string;
    
    if (!requesterAddress || requesterAddress.toLowerCase() !== adminAddress.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. This operation requires admin privileges.'
      });
    }
    
    // Process each address
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const address of addresses) {
      try {
        // Find user by address
        const user = await storage.getUser(address);
        if (!user) {
          results.push({ address, success: false, error: 'User not found' });
          failCount++;
          continue;
        }
        
        // Record the bonus
        const result = await storage.recordFirstTimeBonus(user.id, address, amount);
        results.push({ address, success: true, data: { userId: user.id, bonusAmount: amount } });
        successCount++;
      } catch (error) {
        results.push({ address, success: false, error: String(error) });
        failCount++;
      }
    }
    
    return res.status(200).json({
      success: true,
      summary: {
        total: addresses.length,
        success: successCount,
        failed: failCount
      },
      results
    });
  } catch (error) {
    console.error('Error in batch bonus granting:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process bonus grants',
      error: String(error)
    });
  }
});

export default router;