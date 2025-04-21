/**
 * Transaction Tracker Service
 * 
 * This service provides functions to record various transaction types
 * directly to the database from blockchain events.
 */

import { storage } from '../storage';
import { ensureUserExists } from '../middleware/userTracker';
import { db } from '../db';
import { transactions } from '../../shared/schema';
import { eq } from 'drizzle-orm';

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
    
    // Create the transaction record - IMPORTANT: leave points as undefined for swaps
    // This way the createTransaction method will calculate points properly
    const transaction = await storage.createTransaction({
      userId: user.id,
      type: 'swap',
      txHash,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      blockNumber: blockNumber || null,
      status: 'completed',
      // Don't set points here - let the storage.createTransaction method calculate them
    });
    
    console.log(`Transaction recorded for user ${address}: ${txHash} - ${fromAmount} ${fromToken} to ${toAmount} ${toToken}`);
    
    // Check daily swap count to determine points
    const dailySwapCount = await storage.getDailySwapCount(user.id);
    
    // Points logic - FIXED: EXACTLY 0.5 points per swap, max 5 swaps per day (2.5 points)
    // Important: this value must be consistent throughout the app
    const MAX_DAILY_SWAPS_FOR_POINTS = 5;
    const POINTS_PER_SWAP = 0.5; // Fixed at EXACTLY 0.5 - do not modify this value
    
    // Store the transaction result with additional metadata
    let result: any = { ...transaction };
    
    // Only award points for the first 5 swaps per day
    if (dailySwapCount <= MAX_DAILY_SWAPS_FOR_POINTS) {
      console.log(`[PointsSystem] Awarded ${POINTS_PER_SWAP} points for swap #${dailySwapCount} to user ${user.id}`);
      console.log(`User ${user.id} has completed ${dailySwapCount} swaps`);
      console.log(`User ${user.id} has completed ${dailySwapCount} swaps today`);
      console.log(`Awarded ${POINTS_PER_SWAP} points to user ${user.id} for swap`);
      
      // Add the exact points value to the result for debugging
      result.pointsAdded = POINTS_PER_SWAP;
      
      // If this is exactly the 5th swap, trigger immediate points recalculation
      if (dailySwapCount === MAX_DAILY_SWAPS_FOR_POINTS) {
        console.log(`[PointsSystem] 🔄 Auto-triggering points recalculation for user ${user.id} (${address}) after 5th daily swap`);
        
        try {
          // Import the database-storage to access recalculation methods
          const { storage: dbStorage } = require('../database-storage');
          
          // Get points before recalculation for comparison using database-storage
          const pointsBefore = await dbStorage.getUserPointsById(user.id);
          
          // Perform the recalculation using database-storage
          const pointsAfter = await dbStorage.recalculatePointsForUser(user.id);
          
          console.log(`[PointsSystem] ✅ Auto-recalculation complete. User ${user.id} (${address}) points: ${pointsBefore} → ${pointsAfter}`);
          
          // Add recalculation info to the result
          result.pointsRecalculated = true;
          result.pointsBefore = pointsBefore;
          result.pointsAfter = pointsAfter;
          result.maxSwapsReached = true;
          
          // Import necessary functions for WebSocket notification
          const { broadcastNotification } = require('../routes');
          
          if (typeof broadcastNotification === 'function') {
            // Broadcast user-specific points update
            broadcastNotification({
              type: 'points_update',
              userId: user.id,
              address: user.address,
              pointsBefore,
              pointsAfter,
              timestamp: new Date().toISOString()
            });
            
            // Also broadcast global leaderboard update
            const { totalGlobalPoints } = await storage.getLeaderboard(1);
            const { count: userCount } = await storage.getTotalUsersCount();
            
            broadcastNotification({
              type: 'leaderboard_update',
              totalGlobalPoints,
              userCount,
              timestamp: new Date().toISOString()
            });
          }
        } catch (recalcError) {
          console.error("[PointsSystem] Error during automatic points recalculation:", recalcError);
        }
      }
    } else {
      console.log(`No points awarded to user ${address}. Daily swap limit reached: ${dailySwapCount}/${MAX_DAILY_SWAPS_FOR_POINTS}`);
      result.maxSwapsReached = true;
    }
    
    return result;
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
    
    // Create the transaction record with explicitly zero points
    const transaction = await storage.createTransaction({
      userId: user.id,
      type: 'faucet_claim',
      txHash,
      fromToken: null,
      toToken: 'PRIOR',
      fromAmount: null,
      toAmount: amount,
      blockNumber: blockNumber || null,
      status: 'completed',
      points: 0 // Explicitly set to 0 as faucet claims don't earn points
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