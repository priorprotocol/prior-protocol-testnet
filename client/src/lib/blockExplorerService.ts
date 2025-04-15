// Simple function to format token values based on decimals
function formatTokenValue(value: string, decimals: number = 18): string {
  if (!value) return '0';
  try {
    // Simple implementation that avoids BigInt
    const num = parseFloat(value) / Math.pow(10, decimals);
    return num.toString();
  } catch (error) {
    console.error('Error formatting token value:', error);
    return '0';
  }
}

// Constants for Base Sepolia Explorer APIs and smart contracts
const BASE_EXPLORER_API = 'https://api-sepolia.basescan.org/api';
const BASESCAN_API_KEY = import.meta.env.VITE_BASESCAN_API_KEY || '';
const TOKEN_CONTRACTS = {
  PRIOR: '0xBc8697476a56679534b15994C0f1122556bBF9F4',
  USDC: '0xc6d67115Cf17A55F9F22D29b955654A7c96781C5',
  USDT: '0x2B744c80C4895fDC2003108E186aB7613c0ec7E',
};
const SWAP_CONTRACTS = {
  'PRIOR-USDC': '0xaB73D1a2334Bf336DD103d739a239bba1A56b6ED',
  'PRIOR-USDT': '0xdb68d6D064c36d45c92365f61F689FC2d1661F65',
  'USDC-USDT': '0xbbd5997cfA849876289ebab4CddcD4Bc538B0244',
};
const FAUCET_CONTRACT = '0xD0CA4219ABFd3A0535cafDCe3FB5707dc66F7cCe';
const PRIOR_NFT_CONTRACT = '0x2a45dfDbdCfcF72CBE835435eD54f4beE7d06D59';

// Interface for transactions from the block explorer
export interface BlockExplorerTransaction {
  hash: string;
  blockNumber: number | string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  contractAddress?: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimal?: string;
  input?: string;
  methodId?: string;
  methodName?: string;
  functionName?: string;
  gasPrice?: string;
  gasUsed?: string;
  confirmations?: string;
}

// Standardized transaction for our backend
export interface ParsedTransaction {
  txHash: string;
  blockNumber: number;
  timestamp: string;
  type: 'swap' | 'faucet_claim' | 'nft_mint' | 'other';
  fromToken?: string | null;
  toToken?: string | null;
  fromAmount?: string | null;
  toAmount?: string | null;
  status: 'completed';
}

/**
 * Fetches normal transactions for an address from Base Sepolia Explorer API
 * @param address Wallet address to fetch transactions for
 */
async function fetchNormalTransactions(address: string): Promise<any[]> {
  try {
    console.log('Fetching normal transactions for address:', address);
    
    // Real API call to Base Sepolia explorer with API key
    const url = `${BASE_EXPLORER_API}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${BASESCAN_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && Array.isArray(data.result)) {
      console.log(`Found ${data.result.length} normal transactions`);
      return data.result;
    } else {
      console.warn('No normal transactions found or API error:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching normal transactions:', error);
    return [];
  }
}

/**
 * Fetches ERC-20 token transactions for an address from Base Sepolia Explorer API
 * @param address Wallet address to fetch transactions for
 */
async function fetchTokenTransactions(address: string): Promise<any[]> {
  try {
    console.log('Fetching token transactions for address:', address);
    
    // Real API call to Base Sepolia explorer for token transactions with API key
    const url = `${BASE_EXPLORER_API}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${BASESCAN_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && Array.isArray(data.result)) {
      console.log(`Found ${data.result.length} token transactions`);
      return data.result;
    } else {
      console.warn('No token transactions found or API error:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching token transactions:', error);
    return [];
  }
}

/**
 * Determines if a transaction is related to the faucet
 * @param tx Transaction to analyze
 */
function isFaucetTransaction(tx: any): boolean {
  const faucetContract = FAUCET_CONTRACT.toLowerCase();
  
  // Normal transactions to the faucet contract
  if (tx.to?.toLowerCase() === faucetContract) {
    // Check for claim() function call (0x1249c58b)
    if (tx.input?.startsWith('0x1249c58b')) {
      return true;
    }
  }
  
  // Token transfer from faucet contract
  if (tx.from?.toLowerCase() === faucetContract && 
      tx.tokenSymbol === 'PRIOR' && 
      tx.contractAddress?.toLowerCase() === TOKEN_CONTRACTS.PRIOR.toLowerCase()) {
    return true;
  }
  
  return false;
}

/**
 * Determines if a transaction is related to swaps
 * @param tx Transaction to analyze
 */
function isSwapTransaction(tx: any): boolean {
  const swapContractAddresses = Object.values(SWAP_CONTRACTS).map(addr => addr.toLowerCase());
  const priorContract = TOKEN_CONTRACTS.PRIOR.toLowerCase();
  const usdcContract = TOKEN_CONTRACTS.USDC.toLowerCase();
  const usdtContract = TOKEN_CONTRACTS.USDT.toLowerCase();
  
  // Check if this is a token transaction to/from a swap contract
  if (tx.contractAddress) {
    const contractAddr = tx.contractAddress.toLowerCase();
    // If this is a token transaction for a supported token (PRIOR, USDC, USDT)
    if ([priorContract, usdcContract, usdtContract].includes(contractAddr)) {
      // And it's to/from a swap contract
      if (swapContractAddresses.includes(tx.to?.toLowerCase()) || 
          swapContractAddresses.includes(tx.from?.toLowerCase())) {
        return true;
      }
    }
  }
  
  // Direct interaction with swap contracts
  if (swapContractAddresses.includes(tx.to?.toLowerCase())) {
    // Input data looks like a swap function
    if (tx.input && tx.input.length > 10) {
      // Most swap function signatures start with "0x" and then have specific patterns
      // This is simplified - in a real app, you'd check specific function signatures
      return true;
    }
  }
  
  return false;
}

/**
 * Parse faucet transaction details
 * @param tx Transaction to parse
 */
function parseFaucetTransaction(tx: any): ParsedTransaction {
  // Convert blockNumber to number if it's a string
  const blockNumber = typeof tx.blockNumber === 'string' ? parseInt(tx.blockNumber, 10) : tx.blockNumber;
  
  return {
    txHash: tx.hash,
    blockNumber: blockNumber,
    timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
    type: 'faucet_claim',
    fromToken: null,
    toToken: 'PRIOR',
    fromAmount: null,
    toAmount: tx.value ? formatTokenValue(tx.value, parseInt(tx.tokenDecimal || '18')) : '1',
    status: 'completed'
  };
}

/**
 * Parse swap transaction details
 * @param tx Transaction to analyze
 * @param otherTxs Related transactions (for paired swaps)
 */
function parseSwapTransaction(tx: any, otherTxs: any[]): ParsedTransaction | null {
  // This is a simplified implementation - in a real app, you'd need to handle complex swap paths
  // and properly pair input and output tokens by analyzing related transactions
  
  // For this demo, we're assuming a simple token transfer to a swap contract means a swap
  if (isSwapTransaction(tx) && tx.tokenSymbol) {
    // Find swapped token in the same transaction hash
    const relatedTx = otherTxs.find(
      t => t.hash === tx.hash && t.tokenSymbol !== tx.tokenSymbol
    );
    
    // Convert blockNumber to number if it's a string
    const blockNumber = typeof tx.blockNumber === 'string' ? parseInt(tx.blockNumber, 10) : tx.blockNumber;
    
    if (relatedTx) {
      // This is an output of a swap
      return {
        txHash: tx.hash,
        blockNumber: blockNumber,
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
        type: 'swap',
        fromToken: relatedTx.tokenSymbol,
        toToken: tx.tokenSymbol,
        fromAmount: relatedTx.value ? formatTokenValue(relatedTx.value, parseInt(relatedTx.tokenDecimal || '18')) : null,
        toAmount: tx.value ? formatTokenValue(tx.value, parseInt(tx.tokenDecimal || '18')) : null,
        status: 'completed'
      };
    }
    
    // This might be the input side of a swap, but we don't have the output yet
    return {
      txHash: tx.hash,
      blockNumber: blockNumber,
      timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      type: 'swap',
      fromToken: tx.tokenSymbol,
      toToken: null, // We don't know the output token yet
      fromAmount: tx.value ? formatTokenValue(tx.value, parseInt(tx.tokenDecimal || '18')) : null,
      toAmount: null,
      status: 'completed'
    };
  }
  
  return null;
}

/**
 * Gets relevant transactions for an address from Base Sepolia Explorer
 * @param address The wallet address to get transactions for
 */
export async function fetchBlockExplorerTransactions(address: string): Promise<ParsedTransaction[]> {
  try {
    // Lowercase the address for consistent comparisons
    address = address.toLowerCase();
    
    // Fetch both normal and token transactions
    const [normalTxs, tokenTxs] = await Promise.all([
      fetchNormalTransactions(address),
      fetchTokenTransactions(address)
    ]);
    
    // Combine all transactions
    const allTxs = [...normalTxs, ...tokenTxs];
    
    // Process and filter transactions
    const parsedTransactions: ParsedTransaction[] = [];
    
    // First identify faucet transactions
    for (const tx of allTxs) {
      if (isFaucetTransaction(tx)) {
        parsedTransactions.push(parseFaucetTransaction(tx));
      }
    }
    
    // Then identify swap transactions
    const swapCandidates = allTxs.filter(tx => isSwapTransaction(tx) && !isFaucetTransaction(tx));
    const processedHashes = new Set<string>();
    
    for (const tx of swapCandidates) {
      // Skip if we've already processed this transaction hash
      if (processedHashes.has(tx.hash)) continue;
      
      const parsedSwap = parseSwapTransaction(tx, swapCandidates);
      if (parsedSwap) {
        parsedTransactions.push(parsedSwap);
        // Mark this transaction as processed
        processedHashes.add(tx.hash);
      }
    }
    
    // Log if we don't find any transactions
    if (parsedTransactions.length === 0) {
      console.log('No transactions found for this address on Base Sepolia network');
    }
    
    return parsedTransactions;
  } catch (error) {
    console.error('Error processing transactions:', error);
    return [];
  }
}