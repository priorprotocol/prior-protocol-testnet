import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from "../shared/schema";

// Configure neon for serverless environments
if (typeof WebSocket === 'undefined') {
  // In Node.js environments (during development and SSR)
  neonConfig.webSocketConstructor = ws as any;
} 

// Check for DATABASE_URL environment variable
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prior';
console.log("🔄 Initializing database connection with:", DATABASE_URL.split('@')[1]); // Log only host/db part

// Enhanced PostgreSQL connection pool configuration with retry logic
const connectionString = process.env.DATABASE_URL;

// Create a more resilient connection pool with specific settings for production use
export const pool = new Pool({
  connectionString,
  max: 20,               // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,  // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait for a connection to become available
  // Improved error handling with explicit event handlers
});

// Set up connection monitoring for improved reliability
pool.on('error', (err) => {
  console.error('⚠️ Unexpected error on idle PostgreSQL client:', err);
  // Don't crash on connection errors, attempt recovery
});

// Check that the pool is working correctly
let isPoolHealthy = false;
const checkPoolHealth = async () => {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      isPoolHealthy = true;
      console.log('✅ Database connection pool initialized successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('🔴 Failed to initialize database connection pool:', error);
    isPoolHealthy = false;
    // Schedule a retry
    setTimeout(checkPoolHealth, 5000);
  }
};

// Initial health check
checkPoolHealth().catch(console.error);

// Create a drizzle instance using the pool and schema
export const db = drizzle(pool, { schema });

// Export a function to check if the database connection is healthy
export const isDatabaseHealthy = () => isPoolHealthy;