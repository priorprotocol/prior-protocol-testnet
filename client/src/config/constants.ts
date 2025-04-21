/**
 * Application-wide constants
 */

// Admin wallet address - only this address can access admin functionality
export const ADMIN_ADDRESS = '0x4CfC531df94339DEF7dcd603AAC1a2dEaF6888b7';

// Prior token information
export const PRIOR_TOKEN = {
  symbol: 'PRIOR',
  address: '0xD4d41fd29d1557566B1e3729d63559DC9DA32C79',
  decimals: 18
};

// Point system configuration
export const POINTS_CONFIG = {
  // Points per swap
  POINTS_PER_SWAP: 1.5,
  // Maximum swaps that can earn points per day
  MAX_DAILY_SWAPS: 5,
  // Maximum points per day (POINTS_PER_SWAP * MAX_DAILY_SWAPS)
  MAX_DAILY_POINTS: 7.5
};

// Protocol configuration
export const PROTOCOL_CONFIG = {
  // Standard swap fee for all pairs
  SWAP_FEE_PERCENT: 0.5,
  // Fixed exchange rate for testing
  PRIOR_USDC_RATE: 2 // 1 PRIOR = 2 USDC
};