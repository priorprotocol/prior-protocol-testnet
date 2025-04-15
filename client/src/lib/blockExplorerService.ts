// BlockExplorer Service for fetching transaction data directly from Base Sepolia Explorer
// Basescan API Docs: https://basescan.org/apis

import { ethers } from 'ethers';

const BASE_SEPOLIA_API = 'https://api-sepolia.basescan.org/api';

// You'd typically use an environment variable for this
// If needed, you can obtain a free API key from https://basescan.org/myapikey
const API_KEY = '';

// Cache to avoid repeated API requests for the same addresses
const transactionCache: Record<string, any[]> = {};
const cacheTTL = 60000; // 1 minute cache validity
const lastFetchTime: Record<string, number> = {};

// Contract addresses
const CONTRACT_ADDRESSES = {
  PRIOR: '0xBc8697476a56679534b15994C0f1122556bBF9F4',
  USDC: '0xc6d67115Cf17A55F9F22D29b955654A7c96781C5',
  USDT: '0x2B744c80C4895fDC2003108E186aB7613c0ec7E',
  PRIOR_USDC_SWAP: '0xaB73D1a2334Bf336DD103d739a239bba1A56b6ED',
  PRIOR_USDT_SWAP: '0xdb68d6D064c36d45c92365f61F689FC2d1661F65',
  USDC_USDT_SWAP: '0xbbd5997cfA849876289ebab4CddcD4Bc538B0244',
  FAUCET: '0xD0CA4219ABFd3A0535cafDCe3FB5707dc66F7cCe'
};

// Check if a transaction is related to our contracts
const isRelevantTransaction = (tx: any): boolean => {
  if (!tx.to) return false;
  
  const lowerTo = tx.to.toLowerCase();
  const lowerFrom = tx.from.toLowerCase();
  
  // Check if the transaction involves any of our contract addresses
  return Object.values(CONTRACT_ADDRESSES).some(
    addr => addr.toLowerCase() === lowerTo
  );
};

// Function to categorize transactions (swap, faucet claim, etc.)
const categorizeTransaction = (tx: any): { type: string; fromToken?: string; toToken?: string } => {
  if (!tx.to) return { type: 'unknown' };
  
  const lowerTo = tx.to.toLowerCase();
  
  // Categorize based on the contract being interacted with
  if (lowerTo === CONTRACT_ADDRESSES.FAUCET.toLowerCase()) {
    return { type: 'faucet_claim', toToken: 'PRIOR' };
  } else if (lowerTo === CONTRACT_ADDRESSES.PRIOR_USDC_SWAP.toLowerCase()) {
    // We'd need to decode the transaction input to know exact direction
    // For simplicity, we'll just mark it as a PRIOR-USDC swap
    return { type: 'swap', fromToken: 'PRIOR', toToken: 'USDC' };
  } else if (lowerTo === CONTRACT_ADDRESSES.PRIOR_USDT_SWAP.toLowerCase()) {
    return { type: 'swap', fromToken: 'PRIOR', toToken: 'USDT' };
  } else if (lowerTo === CONTRACT_ADDRESSES.USDC_USDT_SWAP.toLowerCase()) {
    return { type: 'swap', fromToken: 'USDC', toToken: 'USDT' };
  }
  
  return { type: 'unknown' };
};

// Convert explorer transaction to our app's format
const formatTransaction = (tx: any, walletAddress: string) => {
  const category = categorizeTransaction(tx);
  
  return {
    id: parseInt(tx.hash.substring(0, 10), 16) % 100000, // Generate a predictable ID from hash
    txHash: tx.hash,
    timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
    status: tx.isError === "0" ? "completed" : "failed",
    blockNumber: parseInt(tx.blockNumber),
    type: category.type,
    fromToken: category.fromToken || null,
    toToken: category.toToken || null,
    // For true accuracy, we'd need to decode the transaction input and logs
    fromAmount: "1.0", // Placeholder
    toAmount: category.type === 'faucet_claim' ? "1.0" : "10.0", // Placeholder
    userAddress: walletAddress,
    points: category.type === 'swap' ? 2 : 0 // 2 points per swap, 0 for faucet
  };
};

export const fetchBlockExplorerTransactions = async (
  walletAddress: string
): Promise<any[]> => {
  // Check if we have a fresh cache
  const now = Date.now();
  if (
    transactionCache[walletAddress] &&
    lastFetchTime[walletAddress] &&
    now - lastFetchTime[walletAddress] < cacheTTL
  ) {
    console.log('Using cached transactions for', walletAddress);
    return transactionCache[walletAddress];
  }

  try {
    console.log('Fetching transactions from block explorer for', walletAddress);
    
    // Construct API URL for normal transactions
    const url = `${BASE_SEPOLIA_API}?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc${API_KEY ? `&apikey=${API_KEY}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Explorer API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== '1') {
      console.warn('Explorer API returned error:', data.message);
      // If there's an error but we have cached data, return it
      if (transactionCache[walletAddress]) {
        return transactionCache[walletAddress];
      }
      return [];
    }
    
    // Filter for transactions involving our contracts and format them
    const relevantTxs = data.result
      .filter((tx: any) => isRelevantTransaction(tx))
      .map((tx: any) => formatTransaction(tx, walletAddress));
    
    // Update cache
    transactionCache[walletAddress] = relevantTxs;
    lastFetchTime[walletAddress] = now;
    
    return relevantTxs;
  } catch (error) {
    console.error('Error fetching transactions from block explorer:', error);
    
    // Return cached data if available
    if (transactionCache[walletAddress]) {
      return transactionCache[walletAddress];
    }
    
    return [];
  }
};

// Function to get transaction details from block explorer by hash
export const getTransactionByHash = async (txHash: string) => {
  try {
    const url = `${BASE_SEPOLIA_API}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}${API_KEY ? `&apikey=${API_KEY}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Explorer API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.warn('Explorer API returned error:', data.error.message);
      return null;
    }
    
    return data.result;
  } catch (error) {
    console.error('Error fetching transaction by hash:', error);
    return null;
  }
};