/**
 * Environment configuration for the server
 * Helps manage different deployment environments
 */

// Default values for development
const defaultConfig = {
  NODE_ENV: 'development',
  PORT: 3000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prior',
  DATABASE_TYPE: process.env.DATABASE_TYPE || 'postgres', // 'postgres' or 'mysql'
  BASESCAN_API_KEY: process.env.BASESCAN_API_KEY || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

// Process environment variables
export const env = {
  NODE_ENV: process.env.NODE_ENV || defaultConfig.NODE_ENV,
  PORT: parseInt(process.env.PORT || defaultConfig.PORT.toString(), 10),
  DATABASE_URL: process.env.DATABASE_URL || defaultConfig.DATABASE_URL,
  DATABASE_TYPE: process.env.DATABASE_TYPE || defaultConfig.DATABASE_TYPE,
  BASESCAN_API_KEY: process.env.BASESCAN_API_KEY || defaultConfig.BASESCAN_API_KEY,
  CORS_ORIGIN: process.env.CORS_ORIGIN || defaultConfig.CORS_ORIGIN,
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV !== 'production',
};