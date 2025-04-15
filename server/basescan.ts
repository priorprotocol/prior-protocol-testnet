import 'dotenv/config';
import fetch from 'node-fetch';

const BASE_EXPLORER_API = 'https://api-sepolia.basescan.org/api';
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || '';

export const TOKEN_CONTRACTS = {
  PRIOR: '0xBc8697476a56679534b15994C0f1122556bBF9F4',
  USDC: '0xc6d67115Cf17A55F9F22D29b955654A7c96781C5',
  USDT: '0x2B744c80C4895fDC2003108E186aB7613c0ec7E',
};

export const SWAP_CONTRACTS = {
  'PRIOR-USDC': '0xaB73D1a2334Bf336DD103d739a239bba1A56b6ED',
  'PRIOR-USDT': '0xdb68d6D064c36d45c92365f61F689FC2d1661F65',
  'USDC-USDT': '0xbbd5997cfA849876289ebab4CddcD4Bc538B0244',
};

export const FAUCET_CONTRACT = '0xD0CA4219ABFd3A0535cafDCe3FB5707dc66F7cCe';
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
    return { status: 'error', message: error.message };
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
    return { status: 'error', message: error.message };
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