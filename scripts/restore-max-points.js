/**
 * Script to restore 2.5 points to everyone who swapped today
 * This will set 2.5 points for any user who has totalSwaps >= 5
 * For users with fewer swaps, it will set points = totalSwaps * 0.5
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { eq } from 'drizzle-orm';
import { db } from '../server/db.js';
import { users } from '../shared/schema.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function to restore points
async function restoreMaxPoints() {
  console.log('Starting restoration of max points...');
  
  try {
    // Get all users with their total swaps
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users in the system.`);

    let updatedUsers = 0;
    let totalPointsRestored = 0;

    // Process each user
    for (const user of allUsers) {
      let updatedPoints = 0;
      
      // If user has 5 or more swaps, they should have 2.5 points maximum
      if (user.totalSwaps >= 5) {
        updatedPoints = 2.5;
      } 
      // Otherwise, they should have totalSwaps * 0.5 points
      else if (user.totalSwaps > 0) {
        updatedPoints = user.totalSwaps * 0.5;
      }
      
      // Only update if points need to be changed
      if (parseFloat(user.points) !== updatedPoints) {
        // Calculate points difference for reporting
        const pointsBefore = parseFloat(user.points);
        const pointsDiff = updatedPoints - pointsBefore;
        totalPointsRestored += pointsDiff;
        
        // Update the user record
        await db.update(users)
          .set({ points: updatedPoints.toString() })
          .where(eq(users.id, user.id));
        
        console.log(`Updated user ${user.address}: ${pointsBefore} → ${updatedPoints} points (${pointsDiff > 0 ? '+' : ''}${pointsDiff.toFixed(1)})`);
        updatedUsers++;
      }
    }

    console.log(`\nRestoration complete:`);
    console.log(`- Updated ${updatedUsers} users`);
    console.log(`- Total points restored: ${totalPointsRestored.toFixed(1)}`);
    
    return {
      success: true,
      updatedUsers,
      totalPointsRestored
    };
  } catch (error) {
    console.error('Error restoring points:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute the main function
const result = await restoreMaxPoints();
console.log(JSON.stringify(result, null, 2));
process.exit(result.success ? 0 : 1);