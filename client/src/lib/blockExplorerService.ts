// Format token values based on decimals with better precision
function formatTokenValue(value: string, decimals: number = 18): string {
  if (!value) return '0';
  try {
    // Handle extreme values better than parseFloat
    const isNegative = value.startsWith('-');
    const absValue = isNegative ? value.substring(1) : value;
    
    // If the value is too small or zero, return 0
    if (absValue === '0' || absValue === '') return '0';
    
    // Cut the value into two parts: integer and decimal
    let intPart = '0';
    let decPart = absValue;
    
    // If value is longer than decimals, split it
    if (absValue.length > decimals) {
      intPart = absValue.slice(0, absValue.length - decimals) || '0';
      decPart = absValue.slice(absValue.length - decimals);
    }
    
    // Add leading zeros to decimal part if needed
    decPart = decPart.padStart(decimals, '0');
    
    // Combine the parts with decimal point
    let result = `${intPart}.${decPart}`;
    
    // Remove trailing zeros and decimal point if not needed
    result = result.replace(/\.?0+$/, '');
    
    // Add the negative sign back if needed
    return isNegative ? `-${result}` : result;
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
 * Simple sleep function to wait between retries
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches normal transactions for an address from Base Sepolia Explorer API with retry logic
 * @param address Wallet address to fetch transactions for
 */
async function fetchNormalTransactions(address: string): Promise<any[]> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second
  
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      console.log(`Fetching normal transactions for address: ${address} (attempt ${retries + 1}/${MAX_RETRIES})`);
      
      // Real API call to Base Sepolia explorer with API key
      const url = `${BASE_EXPLORER_API}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${BASESCAN_API_KEY}`;
      
      const response = await fetch(url);
      
      // Check for network failure
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === '1' && Array.isArray(data.result)) {
        console.log(`Found ${data.result.length} normal transactions`);
        return data.result;
      } else if (data.status === '0' && data.message === 'No transactions found') {
        // This is a valid "empty" response, not an error
        console.log('No normal transactions found for this address');
        return [];
      } else {
        // Other API errors like rate limiting or invalid API key
        console.warn('API error fetching normal transactions:', data.message);
        throw new Error(`API error: ${data.message}`);
      }
    } catch (error) {
      console.error(`Error fetching normal transactions (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
      
      retries++;
      if (retries < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY/1000}s...`);
        await sleep(RETRY_DELAY);
      }
    }
  }
  
  console.log('All retry attempts failed for normal transactions');
  return [];  // Return empty array after all retries failed
}

/**
 * Fetches ERC-20 token transactions for an address from Base Sepolia Explorer API with retry logic
 * @param address Wallet address to fetch transactions for
 */
async function fetchTokenTransactions(address: string): Promise<any[]> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second
  
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      console.log(`Fetching token transactions for address: ${address} (attempt ${retries + 1}/${MAX_RETRIES})`);
      
      // Real API call to Base Sepolia explorer for token transactions with API key
      const url = `${BASE_EXPLORER_API}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${BASESCAN_API_KEY}`;
      
      const response = await fetch(url);
      
      // Check for network failure
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === '1' && Array.isArray(data.result)) {
        console.log(`Found ${data.result.length} token transactions`);
        return data.result;
      } else if (data.status === '0' && data.message === 'No transactions found') {
        // This is a valid "empty" response, not an error
        console.log('No token transactions found for this address');
        return [];
      } else {
        // Other API errors like rate limiting or invalid API key
        console.warn('API error fetching token transactions:', data.message);
        throw new Error(`API error: ${data.message}`);
      }
    } catch (error) {
      console.error(`Error fetching token transactions (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
      
      retries++;
      if (retries < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY/1000}s...`);
        await sleep(RETRY_DELAY);
      }
    }
  }
  
  console.log('All retry attempts failed for token transactions');
  return [];  // Return empty array after all retries failed
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
  const faucetContract = FAUCET_CONTRACT.toLowerCase();
  
  // Check if this is a token transaction to/from a swap contract
  if (tx.contractAddress) {
    const contractAddr = tx.contractAddress.toLowerCase();
    // If this is a token transaction for a supported token (PRIOR, USDC, USDT)
    if ([priorContract, usdcContract, usdtContract].includes(contractAddr)) {
      // Make sure it's not a faucet claim
      if (tx.to?.toLowerCase() !== faucetContract && tx.from?.toLowerCase() !== faucetContract) {
        // And it's to/from a swap contract
        if (swapContractAddresses.includes(tx.to?.toLowerCase()) || 
            swapContractAddresses.includes(tx.from?.toLowerCase())) {
          return true;
        }
      }
    }
  }
  
  // Direct interaction with swap contracts
  if (swapContractAddresses.includes(tx.to?.toLowerCase())) {
    // Input data looks like a swap function
    if (tx.input && tx.input.length > 10) {
      // Check for common swap method signatures
      const swapMethodIds = [
        '0x38ed1739', // swapExactTokensForTokens
        '0x8803dbee', // swapTokensForExactTokens
        '0x4a25d94a', // swapTokensForExactETH
        '0x18cbafe5', // swapExactTokensForETH
      ];
      
      for (const methodId of swapMethodIds) {
        if (tx.input.startsWith(methodId)) {
          return true;
        }
      }
      
      // If we can't match a specific method ID, any input to a swap contract is likely a swap
      return true;
    }
  }
  
  // Check for swap method names
  if (tx.methodName && (
    tx.methodName.toLowerCase().includes('swap') || 
    tx.methodName.toLowerCase().includes('exchange')
  )) {
    return true;
  }
  
  if (tx.functionName && (
    tx.functionName.toLowerCase().includes('swap') || 
    tx.functionName.toLowerCase().includes('exchange')
  )) {
    return true;
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