import fetch from 'node-fetch';

async function testCompleteReset() {
  console.log("Testing complete database reset API...");
  
  try {
    const response = await fetch('http://localhost:3000/api/maintenance/complete-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log("Complete reset API result:", result);
    return result;
  } catch (error) {
    console.error("Error calling complete reset API:", error);
    throw error;
  }
}

async function testRecalculatePoints() {
  console.log("Testing points recalculation API...");
  
  try {
    const response = await fetch('http://localhost:3000/api/maintenance/recalculate-points', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log("Points recalculation API result:", result);
    return result;
  } catch (error) {
    console.error("Error calling points recalculation API:", error);
    throw error;
  }
}

// Run both tests
async function runTests() {
  try {
    await testCompleteReset();
    console.log("\n");
    await testRecalculatePoints();
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

runTests();