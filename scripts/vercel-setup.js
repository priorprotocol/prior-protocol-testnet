// Comprehensive setup script for Vercel deployment
// This script handles database connection, migration, and seeding
// It's designed to be run in the Vercel build process

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from '../dist/shared/schema.js';
import ws from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Configure Neon for serverless environments
neonConfig.webSocketConstructor = ws;

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

// Log with timestamp and color
function log(message, color = RESET) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${RESET}`);
}

async function setupVercel() {
  log('Starting Vercel deployment setup...', YELLOW);
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    log('ERROR: DATABASE_URL environment variable is not set', RED);
    log('Please set DATABASE_URL in your Vercel project settings', RED);
    process.exit(1);
  }
  
  try {
    log('Connecting to Neon PostgreSQL database...', YELLOW);
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });
    
    // Check database connection
    log('Verifying database connection...', YELLOW);
    try {
      await pool.query('SELECT NOW()');
      log('Database connection successful', GREEN);
    } catch (error) {
      log(`Database connection failed: ${error.message}`, RED);
      process.exit(1);
    }
    
    // Path to migrations
    const migrationsDir = path.resolve(process.cwd(), 'migrations');
    
    // Create migrations directory if it doesn't exist
    if (!fs.existsSync(migrationsDir)) {
      log('Creating migrations directory...', YELLOW);
      fs.mkdirSync(migrationsDir, { recursive: true });
      
      // Create a sample migration if none exists
      const sampleMigrationPath = path.join(migrationsDir, '0000_initial_migration.sql');
      if (!fs.existsSync(sampleMigrationPath)) {
        log('Creating initial migration file...', YELLOW);
        const initialMigration = `
-- Custom SQL migration for Prior Protocol Testnet
-- This migration is automatically generated during Vercel deployment

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "address" TEXT NOT NULL UNIQUE,
  "username" TEXT,
  "points" NUMERIC(10, 2) DEFAULT 0,
  "rank" INTEGER,
  "lastClaimTime" TIMESTAMP,
  "badges" TEXT[] DEFAULT '{}',
  "totalSwaps" INTEGER DEFAULT 0,
  "totalClaims" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "tokens" (
  "id" SERIAL PRIMARY KEY,
  "symbol" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "decimals" INTEGER DEFAULT 18,
  "imageUrl" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "quests" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL,
  "reward" NUMERIC(10, 2) DEFAULT 0,
  "requirements" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "user_quests" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "users"("id"),
  "questId" INTEGER REFERENCES "quests"("id"),
  "status" TEXT DEFAULT 'in_progress',
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "proposals" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "creator" TEXT NOT NULL,
  "status" TEXT DEFAULT 'active',
  "votesFor" INTEGER DEFAULT 0,
  "votesAgainst" INTEGER DEFAULT 0,
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "votes" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "users"("id"),
  "proposalId" INTEGER REFERENCES "proposals"("id"),
  "voteType" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "proposalId")
);

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "users"("id"),
  "type" TEXT NOT NULL,
  "hash" TEXT,
  "amount" NUMERIC(20, 8),
  "tokenSymbol" TEXT,
  "details" JSONB,
  "status" TEXT DEFAULT 'completed',
  "points" NUMERIC(10, 2) DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "quizzes" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "difficulty" TEXT DEFAULT 'beginner',
  "points" NUMERIC(10, 2) DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "quiz_questions" (
  "id" SERIAL PRIMARY KEY,
  "quizId" INTEGER REFERENCES "quizzes"("id"),
  "question" TEXT NOT NULL,
  "options" JSONB NOT NULL,
  "correctAnswer" TEXT NOT NULL,
  "explanation" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "user_quizzes" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "users"("id"),
  "quizId" INTEGER REFERENCES "quizzes"("id"),
  "score" INTEGER DEFAULT 0,
  "completed" BOOLEAN DEFAULT false,
  "answers" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "quizId")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_users_address" ON "users"("address");
CREATE INDEX IF NOT EXISTS "idx_users_points" ON "users"("points");
CREATE INDEX IF NOT EXISTS "idx_transactions_userId" ON "transactions"("userId");
CREATE INDEX IF NOT EXISTS "idx_transactions_type" ON "transactions"("type");
        `;
        fs.writeFileSync(sampleMigrationPath, initialMigration);
      }
    }
    
    // Run migrations
    log('Running database migrations...', YELLOW);
    try {
      await migrate(db, { migrationsFolder: migrationsDir });
      log('Migrations completed successfully', GREEN);
    } catch (error) {
      log(`Migration error: ${error.message}`, RED);
      log('Continuing with setup despite migration error...', YELLOW);
      // Don't exit here - we'll try to create tables directly if needed
    }
    
    // Verify database schema
    log('Verifying database schema...', YELLOW);
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        );
      `);
      
      const tablesExist = result.rows[0].exists;
      
      if (tablesExist) {
        log('Database schema verified successfully', GREEN);
      } else {
        log('Tables do not exist, running direct schema creation...', YELLOW);
        // Try to create tables directly in case migrations failed
        await pool.query(`
          -- Create essential tables
          CREATE TABLE IF NOT EXISTS "users" (
            "id" SERIAL PRIMARY KEY,
            "address" TEXT NOT NULL UNIQUE,
            "username" TEXT,
            "points" NUMERIC(10, 2) DEFAULT 0,
            "rank" INTEGER,
            "lastClaimTime" TIMESTAMP,
            "badges" TEXT[] DEFAULT '{}',
            "totalSwaps" INTEGER DEFAULT 0,
            "totalClaims" INTEGER DEFAULT 0,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS "tokens" (
            "id" SERIAL PRIMARY KEY,
            "symbol" TEXT NOT NULL UNIQUE,
            "name" TEXT NOT NULL,
            "address" TEXT NOT NULL,
            "decimals" INTEGER DEFAULT 18,
            "imageUrl" TEXT,
            "description" TEXT,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS "transactions" (
            "id" SERIAL PRIMARY KEY,
            "userId" INTEGER REFERENCES "users"("id"),
            "type" TEXT NOT NULL,
            "hash" TEXT,
            "amount" NUMERIC(20, 8),
            "tokenSymbol" TEXT,
            "details" JSONB,
            "status" TEXT DEFAULT 'completed',
            "points" NUMERIC(10, 2) DEFAULT 0,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        log('Essential tables created successfully', GREEN);
      }
    } catch (error) {
      log(`Schema verification error: ${error.message}`, RED);
      log('Continuing with setup...', YELLOW);
    }
    
    // Seed essential data (tokens) if needed
    log('Checking for essential data...', YELLOW);
    try {
      const tokenResult = await pool.query('SELECT COUNT(*) FROM tokens');
      const tokenCount = parseInt(tokenResult.rows[0].count);
      
      if (tokenCount === 0) {
        log('Seeding essential token data...', YELLOW);
        await pool.query(`
          INSERT INTO tokens (symbol, name, address, decimals, imageUrl, description)
          VALUES 
            ('PRIOR', 'Prior Protocol Token', '0xeFC91C5a51E8533282486FA2601dFfe0a0b16EDb', 18, '/tokens/prior.svg', 'The native token of the Prior Protocol ecosystem'),
            ('USDC', 'USD Coin', '0xdB07b0b4E88D9D5A79A08E91fEE20Bb41f9989a2', 6, '/tokens/usdc.svg', 'A stablecoin pegged to the US dollar')
          ON CONFLICT (symbol) DO NOTHING;
        `);
        log('Token data seeded successfully', GREEN);
      } else {
        log('Token data already exists, skipping seeding', GREEN);
      }
    } catch (error) {
      log(`Token data seeding error: ${error.message}`, RED);
    }
    
    log('Vercel setup completed successfully', GREEN);
  } catch (error) {
    log(`Vercel setup failed: ${error.stack || error.message}`, RED);
    process.exit(1);
  }
}

// Run the setup
setupVercel().then(() => {
  log('Vercel deployment preparation complete', GREEN);
  process.exit(0);
}).catch(error => {
  log(`Fatal error during setup: ${error}`, RED);
  process.exit(1);
});