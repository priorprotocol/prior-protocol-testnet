/**
 * Transaction Tracker Service
 * 
 * This service provides functions to record various transaction types
 * directly to the database from blockchain events.
 */

import { storage } from '../storage';
import { ensureUserExists } from '../middleware/userTracker';
import { db, pool } from '../db';
import { transactions } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Constants for points calculation
// IMPORTANT: This value must be exactly 0.5 points per swap across all code
const POINTS_PER_SWAP = 0.5;
const MAX_DAILY_SWAPS_FOR_POINTS = 5;

/**
 * Record a swap transaction directly to the database
 * This function is robust and prioritizes direct SQL for reliable recording
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
    
    console.log(`Recording swap transaction for user ${address}: ${txHash} - ${fromAmount} ${fromToken} to ${toAmount} ${toToken}`);
    
    // Make sure user exists
    const user = await ensureUserExists(address);
    console.log(`Using user with ID ${user.id} for transaction recording`);
    
    // First check if this transaction already exists to avoid duplicates
    try {
      const existingTx = await pool.query(`
        SELECT * FROM transactions WHERE tx_hash = $1 LIMIT 1
      `, [txHash]);
      
      if (existingTx.rows && existingTx.rows.length > 0) {
        console.log(`Transaction with hash ${txHash} already exists with ID ${existingTx.rows[0].id}, returning existing record`);
        return existingTx.rows[0];
      }
    } catch (checkError) {
      console.error('Error checking for existing transaction:', checkError);
      // Continue with creation attempt
    }
    
    // Direct SQL insert as primary method for reliability
    let transaction;
    try {
      console.log(`Creating transaction directly via SQL for ${txHash}`);
      const result = await pool.query(`
        INSERT INTO transactions (
          user_id, type, from_token, to_token, from_amount, to_amount, 
          tx_hash, status, block_number, points, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (tx_hash) DO NOTHING
        RETURNING *
      `, [
        user.id,
        'swap',
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        txHash,
        'completed',
        blockNumber || null,
        POINTS_PER_SWAP.toString() // Always use string for Postgres decimal compatibility
      ]);
      
      // Check if the insert succeeded
      if (result.rows && result.rows.length > 0) {
        transaction = result.rows[0];
        console.log(`Successfully created transaction with direct SQL - ID: ${transaction.id}`);
        
        // Also update the user's points and swap count immediately
        await pool.query(`
          UPDATE users 
          SET points = CAST(COALESCE(points, '0') AS DECIMAL(10,2)) + CAST($1 AS DECIMAL(10,2)), 
              total_swaps = COALESCE(total_swaps, 0) + 1
          WHERE id = $2
        `, [POINTS_PER_SWAP.toString(), user.id]);
        
        console.log(`Updated user ${user.id} points and swap count`);
        
        // Immediately verify the transaction was saved
        try {
          const verification = await pool.query(`
            SELECT * FROM transactions WHERE tx_hash = $1
          `, [txHash]);
          
          if (verification.rows && verification.rows.length > 0) {
            console.log(`VERIFICATION: Transaction ${txHash} successfully saved in DB - ID: ${verification.rows[0].id}`);
            console.log(`VERIFICATION: Points awarded: ${verification.rows[0].points}`);
          } else {
            console.error(`VERIFICATION FAILED: Transaction ${txHash} not found in DB despite successful creation!`);
          }
        } catch (verifyError) {
          console.error(`Error during transaction verification:`, verifyError);
        }
      } else {
        // Insert might have failed due to ON CONFLICT, try to fetch the existing record
        console.log(`No transaction returned from insert (likely due to ON CONFLICT), checking if it exists...`);
        const checkExisting = await pool.query(`
          SELECT * FROM transactions WHERE tx_hash = $1
        `, [txHash]);
        
        if (checkExisting.rows && checkExisting.rows.length > 0) {
          transaction = checkExisting.rows[0];
          console.log(`Found existing transaction - ID: ${transaction.id}`);
        } else {
          // If direct SQL failed and no existing transaction, try storage as fallback
          console.log(`Direct SQL insert returned no rows and no existing transaction found, using storage fallback`);
          
          // Create transaction object for storage
          const txData = {
            userId: user.id,
            type: 'swap',
            txHash,
            fromToken,
            toToken,
            fromAmount,
            toAmount,
            blockNumber: blockNumber || null,
            status: 'completed',
            points: POINTS_PER_SWAP.toString() // Convert to string for PostgreSQL compatibility
          };
          
          // Try storage as fallback
          try {
            transaction = await storage.createTransaction(txData);
            console.log(`Successfully created transaction via storage fallback - ID: ${transaction.id}`);
          } catch (storageError) {
            console.error(`Storage fallback also failed:`, storageError);
            throw new Error(`Failed to create transaction through all available methods`);
          }
        }
      }
    } catch (directSqlError) {
      console.error(`Direct SQL insert failed:`, directSqlError);
      
      // If direct SQL fails, try storage as fallback
      console.log(`Attempting storage fallback after SQL failure`);
      
      // Create transaction object for storage
      const txData = {
        userId: user.id,
        type: 'swap',
        txHash,
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        blockNumber: blockNumber || null,
        status: 'completed',
        points: POINTS_PER_SWAP.toString() // Convert to string for PostgreSQL compatibility
      };
      
      try {
        transaction = await storage.createTransaction(txData);
        console.log(`Successfully created transaction via storage fallback - ID: ${transaction.id}`);
      } catch (storageError) {
        console.error(`Storage fallback also failed:`, storageError);
        throw new Error(`Failed to create transaction through all available methods`);
      }
    }
    
    console.log(`Transaction recorded for user ${address}: ${txHash} - ${fromAmount} ${fromToken} to ${toAmount} ${toToken}`);
    
    // Check daily swap count to determine points
    const dailySwapCount = await storage.getDailySwapCount(user.id);
    
    // Using the global constants defined at the top of this file
    // POINTS_PER_SWAP = 0.5 and MAX_DAILY_SWAPS_FOR_POINTS = 5
    
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
 * Uses direct SQL for better reliability
 */
export async function recordFaucetClaimTransaction(params: {
  address: string;
  txHash: string;
  amount?: string;
  blockNumber?: number;
}) {
  try {
    const { address, txHash, amount = '1', blockNumber } = params;
    
    console.log(`Recording faucet claim transaction for ${address}: ${txHash} - ${amount} PRIOR`);
    
    // Make sure user exists
    const user = await ensureUserExists(address);
    console.log(`Using user with ID ${user.id} for faucet claim transaction`);
    
    // First check if transaction already exists
    try {
      const existingTx = await pool.query(`
        SELECT * FROM transactions WHERE tx_hash = $1 LIMIT 1
      `, [txHash]);
      
      if (existingTx.rows && existingTx.rows.length > 0) {
        console.log(`Faucet claim with hash ${txHash} already exists with ID ${existingTx.rows[0].id}, returning existing record`);
        return existingTx.rows[0];
      }
    } catch (checkError) {
      console.error('Error checking for existing faucet claim transaction:', checkError);
      // Continue with creation attempt
    }
    
    // Update user's last claim time directly with SQL
    try {
      await pool.query(`
        UPDATE users 
        SET last_claim = NOW(), 
            total_claims = COALESCE(total_claims, 0) + 1
        WHERE id = $1
      `, [user.id]);
      console.log(`Updated user ${user.id} last claim time`);
    } catch (updateError) {
      console.error('Error updating user last claim time:', updateError);
      // Still continue with transaction creation
    }
    
    // Create the transaction record with direct SQL
    let transaction;
    try {
      const result = await pool.query(`
        INSERT INTO transactions (
          user_id, type, from_token, to_token, from_amount, to_amount, 
          tx_hash, status, block_number, points, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (tx_hash) DO NOTHING
        RETURNING *
      `, [
        user.id,
        'faucet_claim',
        null,
        'PRIOR',
        null,
        amount,
        txHash,
        'completed',
        blockNumber || null,
        '0' // Explicitly set to "0" as faucet claims don't earn points
      ]);
      
      if (result.rows && result.rows.length > 0) {
        transaction = result.rows[0];
        console.log(`Successfully recorded faucet claim via direct SQL - ID: ${transaction.id}`);
      } else {
        // Insert might have failed due to ON CONFLICT, try to fetch the existing record
        const checkExisting = await pool.query(`
          SELECT * FROM transactions WHERE tx_hash = $1
        `, [txHash]);
        
        if (checkExisting.rows && checkExisting.rows.length > 0) {
          transaction = checkExisting.rows[0];
          console.log(`Found existing faucet claim transaction - ID: ${transaction.id}`);
        } else {
          // If direct SQL failed and no existing transaction, try storage as fallback
          console.log(`Direct SQL insert for faucet claim returned no rows, using storage fallback`);
          transaction = await storage.createTransaction({
            userId: user.id,
            type: 'faucet_claim',
            txHash,
            fromToken: null,
            toToken: 'PRIOR',
            fromAmount: null,
            toAmount: amount,
            blockNumber: blockNumber || null,
            status: 'completed',
            points: "0" // Explicitly set to "0" as faucet claims don't earn points
          });
        }
      }
    } catch (directSqlError) {
      console.error(`Direct SQL insert for faucet claim failed:`, directSqlError);
      
      // If direct SQL fails, try storage as fallback
      console.log(`Attempting storage fallback for faucet claim after SQL failure`);
      transaction = await storage.createTransaction({
        userId: user.id,
        type: 'faucet_claim',
        txHash,
        fromToken: null,
        toToken: 'PRIOR',
        fromAmount: null,
        toAmount: amount,
        blockNumber: blockNumber || null,
        status: 'completed',
        points: "0" // Explicitly set to "0" as faucet claims don't earn points
      });
    }
    
    console.log(`Faucet claim transaction recorded for user ${address}: ${txHash} - ${amount} PRIOR`);
    
    return transaction;
  } catch (error) {
    console.error('Error recording faucet claim transaction:', error);
    throw error;
  }
}