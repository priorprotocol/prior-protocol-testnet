/**
 * Fix Points Script
 * This script updates all transactions to use 0.5 points per swap
 * and triggers a full recalculation for all users
 */

import fetch from 'node-fetch';
import { db } from '../server/db.js';
import { transactions, users } from '../shared/schema.js';
import { eq, and, sql } from 'drizzle-orm';

async function fixAllTransactionPoints() {
  try {
    console.log('[FixPoints] Starting the process to fix all swap points to 0.5 per transaction');
    
    // 1. Update all swap transactions in the database directly
    const updateResult = await db.execute(
      sql`UPDATE transactions SET points = 0.5 
          WHERE type = 'swap' 
          AND status = 'completed'`
    );

    console.log(`[FixPoints] Updated all swap transactions to 0.5 points`);
    
    // 2. Trigger recalculation of all user points
    console.log('[FixPoints] Triggering recalculation for all users...');
    
    // Get all users
    const allUsers = await db.select().from(users);
    let usersUpdated = 0;
    let totalPointsBefore = 0;
    let totalPointsAfter = 0;
    
    for (const user of allUsers) {
      // Get current points
      const currentPoints = user.points || 0;
      totalPointsBefore += currentPoints;
      
      console.log(`[FixPoints] Recalculating for user: ${user.id} (${user.address}) - currently has ${currentPoints} points`);
      
      // Get all swap transactions for this user
      const swapTransactions = await db
        .select()
        .from(transactions)
        .where(and(
          eq(transactions.userId, user.id),
          eq(transactions.type, 'swap'),
          eq(transactions.status, 'completed')
        ))
        .orderBy(sql`${transactions.timestamp} ASC`);
      
      // Group transactions by day for proper points calculation
      const transactionsByDay = {};
      
      for (const tx of swapTransactions) {
        const txDate = new Date(tx.timestamp);
        const day = txDate.toISOString().substring(0, 10); // YYYY-MM-DD
        
        if (!transactionsByDay[day]) {
          transactionsByDay[day] = [];
        }
        
        transactionsByDay[day].push(tx);
      }
      
      // Calculate points: 0.5 per swap, max 5 swaps per day
      let newPoints = 0;
      
      for (const day in transactionsByDay) {
        const daySwaps = transactionsByDay[day];
        // Only count the first 5 swaps each day toward points
        const pointSwapsForDay = Math.min(daySwaps.length, 5);
        const pointsForDay = pointSwapsForDay * 0.5; // Exactly 0.5 points per swap
        
        console.log(`[FixPoints] User ${user.id} earned ${pointsForDay.toFixed(1)} points from ${pointSwapsForDay} swaps on ${day}`);
        newPoints += pointsForDay;
      }
      
      // Round to 1 decimal place for clean display
      newPoints = Math.round(newPoints * 10) / 10;
      
      // Update user with new points
      await db
        .update(users)
        .set({ 
          points: newPoints,
          totalSwaps: swapTransactions.length
        })
        .where(eq(users.id, user.id));
      
      totalPointsAfter += newPoints;
      usersUpdated++;
      
      console.log(`[FixPoints] Updated user ${user.id} (${user.address}): ${currentPoints} → ${newPoints} points`);
    }
    
    console.log(`[FixPoints] Fix completed. Updated ${usersUpdated} users.`);
    console.log(`[FixPoints] Total points before: ${totalPointsBefore}, after: ${totalPointsAfter}`);
    
    return {
      usersUpdated,
      totalPointsBefore,
      totalPointsAfter
    };
  } catch (error) {
    console.error('[FixPoints] Error during points fix process:', error);
    throw error;
  }
}

// Only run if called directly
if (process.argv[1].includes('fix-points.js')) {
  console.log('[FixPoints] Starting the fix-points.js script');
  fixAllTransactionPoints()
    .then(result => {
      console.log('[FixPoints] Script completed successfully:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('[FixPoints] Script failed with error:', error);
      process.exit(1);
    });
} else {
  // Export for import elsewhere
  export { fixAllTransactionPoints };
}