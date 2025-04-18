/**
 * Database Adapter for supporting both PostgreSQL and MySQL deployments
 * This file helps switching between database types based on environment
 */

import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import postgres from 'postgres';
import * as mysql from 'mysql2/promise';
import * as schema from '../shared/schema';

// Environment variables - properly typed
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prior';
const DATABASE_TYPE = process.env.DATABASE_TYPE || 'postgres';

// Determine which database to use based on environment variables
const isDatabaseMySQL = DATABASE_TYPE === 'mysql';

// Create and export database connection based on type
let db: any;

if (isDatabaseMySQL) {
  // MySQL connection
  console.log('Connecting to MySQL database...');
  const pool = mysql.createPool(DATABASE_URL);
  db = drizzleMysql(pool, { 
    schema,
    mode: NODE_ENV === 'production' ? 'default' : 'default'
  });
  console.log('Database connected: MySQL');
} else {
  // Default to PostgreSQL
  console.log('Connecting to PostgreSQL database...');
  const client = postgres(DATABASE_URL);
  db = drizzlePostgres(client, { schema });
  console.log('Database connected: PostgreSQL');
}

export { db };