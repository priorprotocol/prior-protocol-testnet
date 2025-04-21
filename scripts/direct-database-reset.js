/**
 * Direct Database Reset Script
 * This script directly executes SQL to completely wipe all database tables and reset them
 */
import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Set up the global WebSocket constructor for neon
globalThis.WebSocket = ws.WebSocket;

// Database configuration
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable not found');
  process.exit(1);
}

// Demo user to recreate after reset
const DEMO_USER_ADDRESS = '0xf4b08b6c0401c9568f3f3abf2a10c2950df98eae';

async function directDatabaseReset() {
  console.log('🔄 Starting direct database reset...');
  console.log('⚠️ WARNING: This will delete ALL data from the database!');
  
  const pool = new Pool({ connectionString });
  
  try {
    console.log('🔌 Connected to database');
    
    // Start a transaction to ensure all-or-nothing operation
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log('🧨 Starting transaction');
      
      // Delete data from all tables in reverse order to avoid foreign key constraints
      // 1. First delete votes
      const votesResult = await client.query('DELETE FROM votes RETURNING *');
      console.log(`🗑️ Deleted ${votesResult.rowCount} votes`);
      
      // 2. Delete user_quests
      const userQuestsResult = await client.query('DELETE FROM user_quests RETURNING *');
      console.log(`🗑️ Deleted ${userQuestsResult.rowCount} user quests`);
      
      // 3. Delete user_quizzes if it exists
      try {
        const userQuizzesResult = await client.query('DELETE FROM user_quizzes RETURNING *');
        console.log(`🗑️ Deleted ${userQuizzesResult.rowCount} user quizzes`);
      } catch (error) {
        console.log('ℹ️ user_quizzes table not found or error during deletion, skipping...');
      }
      
      // 4. Delete transactions
      const transactionsResult = await client.query('DELETE FROM transactions RETURNING *');
      console.log(`🗑️ Deleted ${transactionsResult.rowCount} transactions`);
      
      // 5. Delete users
      const usersResult = await client.query('DELETE FROM users RETURNING *');
      console.log(`🗑️ Deleted ${usersResult.rowCount} users`);
      
      // 6. Reset proposal vote counts
      await client.query(`
        UPDATE proposals 
        SET yes_votes = 0, no_votes = 0 
      `);
      console.log('✅ Reset all proposal votes to zero');
      
      // Recreate the demo user
      await client.query(`
        INSERT INTO users (address, badges, points, total_swaps, total_claims)
        VALUES ($1, $2, 0, 0, 0)
      `, [DEMO_USER_ADDRESS, '[]']);
      console.log(`✅ Recreated demo user with address ${DEMO_USER_ADDRESS}`);
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');
      
      console.log('🎉 Database reset completed successfully!');
    } catch (error) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      console.error('❌ Error during database reset, rolling back:', error);
      throw error;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Execute the reset
directDatabaseReset();