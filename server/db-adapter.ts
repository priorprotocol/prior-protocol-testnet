/**
 * Database Adapter for supporting both PostgreSQL (Neon for production) and MySQL deployments
 * This file helps switching between database types based on environment
 */

import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import postgres from 'postgres';
import * as mysql from 'mysql2/promise';
import * as schema from '../shared/schema';
import ws from 'ws';

// Environment variables - properly typed
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL || '';
const DATABASE_TYPE = process.env.DATABASE_TYPE || 'postgres';
const IS_VERCEL = process.env.VERCEL || false;

// Configure Neon for serverless environments
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws as any;
}

// Log connection information
console.log(`Database adapter initializing in ${NODE_ENV} mode`);
if (!DATABASE_URL) {
  console.warn('DATABASE_URL not set - using memory storage as fallback');
}

// Create and export database connection based on type and environment
let db: any;

// Determine if we should use Neon PostgreSQL (for Vercel/production)
const useNeon = (DATABASE_TYPE === 'postgres' && (IS_VERCEL || NODE_ENV === 'production'));

if (DATABASE_TYPE === 'mysql') {
  // MySQL connection
  console.log('Connecting to MySQL database...');
  const pool = mysql.createPool(DATABASE_URL);
  db = drizzleMysql(pool, { 
    schema,
    mode: NODE_ENV === 'production' ? 'default' : 'default'
  });
  console.log('Database connected: MySQL');
} else if (useNeon) {
  // Neon PostgreSQL (for Vercel & production)
  console.log('Connecting to Neon PostgreSQL database (serverless mode)...');
  const pool = new Pool({ connectionString: DATABASE_URL });
  db = drizzleNeon(pool, { schema });
  console.log('Database connected: Neon PostgreSQL (serverless)');
} else {
  // Standard PostgreSQL (for development)
  console.log('Connecting to standard PostgreSQL database...');
  const client = postgres(DATABASE_URL);
  db = drizzlePostgres(client, { schema });
  console.log('Database connected: Standard PostgreSQL');
}

export { db };