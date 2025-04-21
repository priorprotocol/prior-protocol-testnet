#!/usr/bin/env node

/**
 * Script to trigger a complete database reset
 * This script completely clears all user data, points, and transactions except for a demo user
 */

import fetch from 'node-fetch';

async function testReplitEndpoint() {
  console.log('Testing if the Replit endpoint exists and is accessible...');
  try {
    const resp = await fetch('https://prior-protocol-testnet-priorprotocol.replit.app');
    console.log(`Base URL response: ${resp.status} ${resp.statusText}`);
    console.log('Root endpoint accessibility test complete.');
  } catch (error) {
    console.error('Error connecting to Replit:', error.message);
  }
}

async function testAllEndpoints() {
  // Try both versions of the endpoint
  const endpoints = [
    'https://prior-protocol-testnet-priorprotocol.replit.app/api/maintenance/complete-reset',
    'https://prior-protocol-testnet-priorprotocol.replit.app/api/maintenance/reset-points-and-transactions'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`Testing endpoint: ${endpoint}`);
    try {
      const response = await fetch(endpoint, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log(`OPTIONS response: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error(`Error testing ${endpoint}:`, error.message);
    }
  }
}

async function completeResetDatabase() {
  try {
    console.log('Starting complete reset of entire database...');
    
    // First test if the Replit endpoint is accessible
    await testReplitEndpoint();
    
    // Then test the specific endpoints
    await testAllEndpoints();
    
    // Define API endpoint - let's try both versions
    const API_ENDPOINTS = [
      'https://prior-protocol-testnet-priorprotocol.replit.app/api/maintenance/complete-reset',
      'https://prior-protocol-testnet-priorprotocol.replit.app/api/maintenance/reset-points-and-transactions'
    ];
    
    for (const API_ENDPOINT of API_ENDPOINTS) {
      console.log(`Attempting reset using endpoint: ${API_ENDPOINT}`);
      
      try {
        // Send reset request
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log(`Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to reset database: ${response.status} ${response.statusText} - ${errorText}`);
          continue;
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
        } else if (result.usersReset) {
          console.log(`Reset points for ${result.usersReset} users`);
          console.log(`Deleted ${result.transactionsDeleted} transactions`);
          console.log(`Total points reset: ${result.pointsReset}`);
        } else {
          console.log('No detailed summary available in the response');
        }
        
        console.log(`Reset attempt using ${API_ENDPOINT} completed.`);
      } catch (error) {
        console.error(`Error during reset with ${API_ENDPOINT}:`, error.message);
      }
    }
    
    console.log('Script completed all reset attempts');
    
  } catch (error) {
    console.error('Error during database reset:', error);
    process.exit(1);
  }
}

// Execute the reset
completeResetDatabase();