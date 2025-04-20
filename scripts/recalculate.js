/**
 * Script to trigger the recalculation of all user points
 * This ensures every user's points match the updated points algorithm
 */

const fetch = require('node-fetch');

async function recalculatePoints() {
  try {
    console.log('Starting points recalculation for all users...');
    
    const response = await fetch('http://localhost:3000/api/maintenance/recalculate-points', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('Recalculation complete!');
    console.log(`Updated ${result.summary.usersUpdated} users`);
    console.log(`Total points before: ${result.summary.totalPointsBefore}, after: ${result.summary.totalPointsAfter}`);
    console.log(`Net difference: ${result.summary.difference}`);
    
    // Log each user's details
    console.log('\nUser details:');
    result.details.forEach(user => {
      console.log(`User ${user.userId} (${user.address.substring(0, 8)}...): ${user.pointsBefore} → ${user.pointsAfter} points | ${user.totalSwaps} total swaps, ${user.pointEarningSwaps} point-earning swaps | NFT staked: ${user.nftStaked ? 'Yes' : 'No'}`);
    });
    
    return result;
  } catch (error) {
    console.error('Error recalculating points:', error);
    throw error;
  }
}

// Run the recalculation
recalculatePoints()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });