import 'dotenv/config';
import fetch from 'node-fetch';

const BASE_EXPLORER_API = 'https://api-sepolia.basescan.org/api';
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || '';

export const TOKEN_CONTRACTS = {
  PRIOR: '0xeFC91C5a51E8533282486FA2601dFfe0a0b16EDb',
  USDC: '0xdB07b0b4E88D9D5A79A08E91fEE20Bb41f9989a2',
  USDT: '', // Not used in new deployment
};

export const SWAP_CONTRACTS = {
  'PRIOR-USDC': '0x8957e1988905311EE249e679a29fc9deCEd4D910',
  'PRIOR-USDT': '', // Not used in new deployment
  'USDC-USDT': '',  // Not used in new deployment
};

export const FAUCET_CONTRACT = '0xa206dC56F1A56a03aEa0fCBB7c7A62b5bE1Fe419';
export const PRIOR_NFT_CONTRACT = '0x2a45dfDbdCfcF72CBE835435eD54f4beE7d06D59';

/**
 * Fetch transaction history for an address using Basescan API
 */
export async function getTransactionHistory(address: string) {
  try {
    console.log('API Key available:', !!BASESCAN_API_KEY);
    
    // Make API request to Basescan
    const url = `${BASE_EXPLORER_API}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${BASESCAN_API_KEY}`;
    
    console.log('Fetching from:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fetch token transaction history for an address using Basescan API
 */
export async function getTokenTransactionHistory(address: string) {
  try {
    // Make API request to Basescan
    const url = `${BASE_EXPLORER_API}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${BASESCAN_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching token transaction history:', error);
    return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Export all functions and constants
export default {
  getTransactionHistory,
  getTokenTransactionHistory,
  TOKEN_CONTRACTS,
  SWAP_CONTRACTS,
  FAUCET_CONTRACT,
  PRIOR_NFT_CONTRACT
};