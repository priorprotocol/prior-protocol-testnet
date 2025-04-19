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
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Using memory storage as fallback.");
}

// Create a PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL || '';
export const pool = new Pool({ connectionString });

// Create a drizzle instance using the pool and schema
export const db = drizzle(pool, { schema });