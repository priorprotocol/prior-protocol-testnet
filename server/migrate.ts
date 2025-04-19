// Database migration script for Vercel deployment
// This will be executed during build to ensure the database schema is up to date

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate as migrateNeon } from 'drizzle-orm/neon-serverless/migrator';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import postgres from 'postgres';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Configure Neon for serverless environments
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws as any;
}

// Get file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsFolder = path.join(__dirname, '../migrations');

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL;
const IS_VERCEL = process.env.VERCEL || false;

// Check for DATABASE_URL
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Ensure DATABASE_URL is not undefined for TypeScript
const connectionString = DATABASE_URL as string;

// Log migration information
console.log(`Running database migrations in ${NODE_ENV} mode`);
console.log(`Migrations folder: ${migrationsFolder}`);

async function runMigrations() {
  try {
    // Use Neon with serverless mode for Vercel
    if (IS_VERCEL || NODE_ENV === 'production') {
      console.log('Using Neon serverless adapter for migrations...');
      const pool = new Pool({ connectionString });
      const db = drizzleNeon(pool, { schema });
      await migrateNeon(db, { migrationsFolder });
    } else {
      // Standard PostgreSQL for development
      console.log('Using standard PostgreSQL adapter for migrations...');
      const migrationClient = postgres(connectionString, { max: 1 });
      const db = drizzle(migrationClient);
      await migrate(db, { migrationsFolder });
      await migrationClient.end();
    }
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Run migrations when this script is executed directly
if (process.argv[1] === __filename) {
  runMigrations().then(() => {
    process.exit(0);
  });
}

export { runMigrations };