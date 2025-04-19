/**
 * Transaction Tracker Service
 * 
 * This service provides functions to record various transaction types
 * directly to the database from blockchain events.
 */

import { storage } from '../storage';
import { ensureUserExists } from '../middleware/userTracker';

/**
 * Record a swap transaction directly to the database
 */
export async function recordSwapTransaction(params: {
  address: string;
  txHash: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  blockNumber?: number;
}) {
  try {
    const { address, txHash, fromToken, toToken, fromAmount, toAmount, blockNumber } = params;
    
    // Make sure user exists
    const user = await ensureUserExists(address);
    
    // Create the transaction record
    const transaction = await storage.createTransaction({
      userId: user.id,
      type: 'swap',
      txHash,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      blockNumber: blockNumber || null,
      status: 'completed'
    });
    
    // Increment swap count for user
    const newSwapCount = await storage.incrementUserSwapCount(user.id);
    console.log(`User ${address} now has ${newSwapCount} swaps recorded`);
    
    // Check daily swap count to determine points
    const dailySwapCount = await storage.getDailySwapCount(user.id);
    
    // Points logic - 0.5 points per swap, max 5 swaps per day (2.5 points)
    const MAX_DAILY_SWAPS_FOR_POINTS = 5;
    const POINTS_PER_SWAP = 0.5;
    
    // Only award points for the first 5 swaps per day
    if (dailySwapCount <= MAX_DAILY_SWAPS_FOR_POINTS) {
      await storage.addUserPoints(user.id, POINTS_PER_SWAP);
      console.log(`Awarded ${POINTS_PER_SWAP} points to user ${address} for swap. Daily swaps: ${dailySwapCount}/${MAX_DAILY_SWAPS_FOR_POINTS}`);
    } else {
      console.log(`No points awarded to user ${address}. Daily swap limit reached: ${dailySwapCount}/${MAX_DAILY_SWAPS_FOR_POINTS}`);
    }
    
    return transaction;
  } catch (error) {
    console.error('Error recording swap transaction:', error);
    throw error;
  }
}

/**
 * Record a faucet claim transaction directly to the database
 */
export async function recordFaucetClaimTransaction(params: {
  address: string;
  txHash: string;
  amount?: string;
  blockNumber?: number;
}) {
  try {
    const { address, txHash, amount = '1', blockNumber } = params;
    
    // Make sure user exists
    const user = await ensureUserExists(address);
    
    // Update user's last claim time
    const updatedUser = await storage.updateUserLastClaim(user.address);
    
    // Create the transaction record
    const transaction = await storage.createTransaction({
      userId: user.id,
      type: 'faucet_claim',
      txHash,
      fromToken: null,
      toToken: 'PRIOR',
      fromAmount: null,
      toAmount: amount,
      blockNumber: blockNumber || null,
      status: 'completed'
    });
    
    // Increment claim count for user
    const newClaimCount = await storage.incrementUserClaimCount(user.id);
    console.log(`User ${address} now has ${newClaimCount} faucet claims recorded`);
    
    // Faucet claims don't get points anymore
    
    return transaction;
  } catch (error) {
    console.error('Error recording faucet claim transaction:', error);
    throw error;
  }
}