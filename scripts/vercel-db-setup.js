// This script is designed to be run as part of Vercel build process
// It ensures the database is properly set up with the required schema
// Run this with: node scripts/vercel-db-setup.js

import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from '../shared/schema.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  console.log('Starting Vercel database setup...');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set');
    console.error('Please set DATABASE_URL in your Vercel project settings');
    process.exit(1);
  }
  
  try {
    console.log('Connecting to database...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });
    
    // Check if migrations directory exists
    const migrationsDir = path.join(__dirname, '../migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('Creating migrations directory...');
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    // Run migrations
    console.log('Running database migrations...');
    await migrate(db, { migrationsFolder: migrationsDir });
    
    // Verify database connection and tables
    console.log('Verifying database setup...');
    
    // Check if users table exists by attempting to query it
    try {
      const result = await db.query.users.findMany({ limit: 1 });
      console.log('Database tables verified:', result !== null);
    } catch (error) {
      console.error('Error verifying tables:', error.message);
      // Don't exit here, as we might need to create the tables
    }
    
    console.log('Database setup completed');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

// Run the database setup
setupDatabase().then(() => {
  console.log('Vercel database initialization complete');
  process.exit(0);
}).catch(error => {
  console.error('Vercel database initialization failed:', error);
  process.exit(1);
});