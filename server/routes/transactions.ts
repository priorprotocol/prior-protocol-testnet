/**
 * Transaction-specific routes
 */

import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { recordSwapTransaction, recordFaucetClaimTransaction } from '../services/transactionTracker';
import { ensureUserExists } from '../middleware/userTracker';

const router = Router();

// Record any transaction with auto user creation
router.post('/transactions', async (req, res) => {
  try {
    // Check if we received userId or userAddress
    let userId = req.body.userId;
    let user = null;
    let address = null;
    
    // If we have a wallet address instead of userId
    if (!userId && req.body.userAddress) {
      address = req.body.userAddress;
    } 
    // If we have a direct userId that looks like a wallet address (e.g. from Swap.tsx)
    else if (typeof userId === 'string' && userId.startsWith('0x')) {
      address = userId;
      userId = null; // Clear userId since we'll resolve it from address
    } 
    // If userId is specified with address format in other fields
    else if (!userId && req.body.address) {
      address = req.body.address;
    }
    
    // Normalize address if we have one
    if (address) {
      user = await ensureUserExists(address);
      userId = user.id;
    }
    
    // If we don't have a userId by now, return error
    if (!userId) {
      return res.status(400).json({ message: "Missing user identifier (userId or address)" });
    }
    
    console.log(`Creating transaction for user ID: ${userId}`);
    
    // Extract transaction data from request
    const { 
      type, 
      txHash, 
      fromToken, 
      toToken, 
      fromAmount, 
      toAmount, 
      status = 'completed',
      blockNumber
    } = req.body;
    
    // Create transaction record
    const transaction = await storage.createTransaction({
      userId,
      type,
      txHash,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      status,
      blockNumber
    });
    
    // If it's a swap, increment swap count and potentially award points
    if (type === 'swap') {
      // Increment swap count
      const newCount = await storage.incrementUserSwapCount(userId);
      console.log(`User ${userId} has completed ${newCount} swaps`);
      
      // Get daily swap count to see if eligible for points
      const dailySwapCount = await storage.getDailySwapCount(userId);
      console.log(`User ${userId} has completed ${dailySwapCount} swaps today`);
      
      // Award points based on simplified rules (0.5 points per swap, max 5 per day)
      const MAX_DAILY_SWAPS_FOR_POINTS = 5;
      const POINTS_PER_SWAP = 0.5;
      
      if (dailySwapCount <= MAX_DAILY_SWAPS_FOR_POINTS) {
        await storage.addUserPoints(userId, POINTS_PER_SWAP);
        console.log(`Awarded ${POINTS_PER_SWAP} points to user ${userId} for swap`);
      } else {
        console.log(`No points awarded to user ${userId} - daily swap limit reached`);
      }
    } 
    // If it's a faucet claim, update last claim time
    else if (type === 'faucet_claim' && user) {
      await storage.updateUserLastClaim(user.address);
      await storage.incrementUserClaimCount(userId);
    }
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: "Error creating transaction", error: String(error) });
  }
});

// Dedicated swap recording endpoint
router.post('/users/:address/swaps', async (req, res) => {
  const swapSchema = z.object({
    txHash: z.string(),
    fromToken: z.string(),
    toToken: z.string(),
    fromAmount: z.string(),
    toAmount: z.string(),
    blockNumber: z.number().optional()
  });
  
  try {
    const { address } = req.params;
    const swapData = swapSchema.parse(req.body);
    
    // Record the swap transaction with full tracking
    const transaction = await recordSwapTransaction({
      address,
      ...swapData
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error recording swap:', error);
    res.status(500).json({ message: "Error recording swap", error: String(error) });
  }
});

// Dedicated faucet claim recording endpoint
router.post('/users/:address/faucet-claims', async (req, res) => {
  const claimSchema = z.object({
    txHash: z.string(),
    amount: z.string().optional(),
    blockNumber: z.number().optional()
  });
  
  try {
    const { address } = req.params;
    const claimData = claimSchema.parse(req.body);
    
    // Record the faucet claim with full tracking
    const transaction = await recordFaucetClaimTransaction({
      address,
      ...claimData
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error recording faucet claim:', error);
    res.status(500).json({ message: "Error recording faucet claim", error: String(error) });
  }
});

export default router;