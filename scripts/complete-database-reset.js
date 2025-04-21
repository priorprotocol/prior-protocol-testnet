#!/usr/bin/env node

/**
 * Script to trigger a complete database reset
 * This script completely clears all user data, points, and transactions except for a demo user
 */

const fetch = require('node-fetch');

async function completeResetDatabase() {
  try {
    console.log('Starting complete reset of entire database...');
    
    // Define API endpoint
    const API_ENDPOINT = process.env.NODE_ENV === 'production'
      ? 'https://testnet.priorprotocol.replit.app/api/maintenance/reset-points-and-transactions'
      : 'http://localhost:5000/api/maintenance/reset-points-and-transactions';
    
    console.log(`Using API endpoint: ${API_ENDPOINT}`);
    
    // Send reset request
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to reset database: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('Reset complete!');
    console.log(`Reset points for ${result.usersReset} users`);
    console.log(`Deleted ${result.transactionsDeleted} transactions`);
    console.log(`Total points reset: ${result.pointsReset}`);
    console.log('Script completed successfully');
    
  } catch (error) {
    console.error('Error during database reset:', error);
    process.exit(1);
  }
}

// Execute the reset
completeResetDatabase();