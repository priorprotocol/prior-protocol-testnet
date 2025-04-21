import fetch from 'node-fetch';

async function testCompleteReset() {
  try {
    console.log("Testing the complete database reset endpoint...");
    
    // Make the POST request to the reset endpoint
    const response = await fetch('https://3fc5893c-d61d-434f-8ce4-b01a9f2789a4-00-1spg6srf64d1g.janeway.replit.dev/api/maintenance/complete-reset', {
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
    const leaderboardResponse = await fetch('https://3fc5893c-d61d-434f-8ce4-b01a9f2789a4-00-1spg6srf64d1g.janeway.replit.dev/api/leaderboard');
    const leaderboard = await leaderboardResponse.json();
    
    console.log("\nVerifying leaderboard:");
    console.log("Number of users:", leaderboard.users.length);
    console.log("Users:", JSON.stringify(leaderboard.users, null, 2));
    
  } catch (error) {
    console.error("Error during test:", error);
  }
}

testCompleteReset();