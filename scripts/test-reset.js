const fetch = require('node-fetch');

async function testCompleteReset() {
  try {
    console.log("Testing the complete database reset endpoint...");
    
    // Make the POST request to the reset endpoint
    const response = await fetch('http://localhost:4000/api/maintenance/complete-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("Reset completed successfully!");
    console.log(JSON.stringify(result, null, 2));
    
    // Now fetch the leaderboard to verify it's empty except for the demo user
    const leaderboardResponse = await fetch('http://localhost:4000/api/leaderboard');
    const leaderboard = await leaderboardResponse.json();
    
    console.log("\nVerifying leaderboard:");
    console.log("Number of users:", leaderboard.users.length);
    console.log("Users:", JSON.stringify(leaderboard.users, null, 2));
    
  } catch (error) {
    console.error("Error during test:", error);
  }
}

testCompleteReset();