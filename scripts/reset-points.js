/**
 * Script to trigger the complete reset of all user points and swap transactions
 * This script clears all swap-related points and transactions from the database
 */

import fetch from 'node-fetch';

async function resetPointsAndTransactions() {
  try {
    console.log('Starting complete reset of all user points and swap transactions...');
    
    // Use local URL for development
    const baseUrl = process.env.BASE_URL || 'https://prior-protocol-testnet.replit.app';
    const url = `${baseUrl}/api/maintenance/reset-points-and-transactions`;
    
    console.log(`Using API endpoint: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('Reset complete!');
    console.log(`Reset points for ${result.summary.usersReset} users`);
    console.log(`Deleted ${result.summary.transactionsDeleted} swap transactions`);
    console.log(`Total points reset: ${result.summary.pointsReset}`);
    
    return result;
  } catch (error) {
    console.error('Error resetting points and transactions:', error);
    throw error;
  }
}

// Run the reset operation
resetPointsAndTransactions()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });