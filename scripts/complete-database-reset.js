#!/usr/bin/env node

/**
 * Script to trigger a complete database reset
 * This script completely clears all user data, points, and transactions except for a demo user
 */

import fetch from 'node-fetch';

async function completeResetDatabase() {
  try {
    console.log('Starting complete reset of entire database...');
    
    // Define API endpoint
    const API_ENDPOINT = process.env.NODE_ENV === 'production'
      ? 'https://prior-protocol-testnet-priorprotocol.replit.app/api/maintenance/complete-reset'
      : 'http://localhost:5000/api/maintenance/complete-reset';
    
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
    console.log('Server response:', JSON.stringify(result, null, 2));
    
    // Check for the summary data structure in the response
    if (result.summary) {
      console.log(`Deleted ${result.summary.usersDeleted || 0} users`);
      console.log(`Deleted ${result.summary.transactionsDeleted || 0} transactions`);
      console.log(`Deleted ${result.summary.userQuestsDeleted || 0} user quests`);
      console.log(`Deleted ${result.summary.votesDeleted || 0} votes`);
    } else {
      console.log('No detailed summary available in the response');
    }
    
    console.log('Script completed successfully');
    
  } catch (error) {
    console.error('Error during database reset:', error);
    process.exit(1);
  }
}

// Execute the reset
completeResetDatabase();