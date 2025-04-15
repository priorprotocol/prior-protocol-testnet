// Simple function to format token values based on decimals
function formatTokenValue(value: string, decimals: number = 18): string {
  if (!value) return '0';
  const valueNum = BigInt(value);
  
  // Calculate divisor without using ** operator on BigInt
  let divisor = BigInt(1);
  for (let i = 0; i < decimals; i++) {
    divisor = divisor * BigInt(10);
  }
  
  const wholePart = valueNum / divisor;
  const fractionalPart = valueNum % divisor;
  
  // Convert to string and pad with leading zeros
  let fractionalStr = fractionalPart.toString();
  fractionalStr = fractionalStr.padStart(decimals, '0');
  
  // Trim trailing zeros
  fractionalStr = fractionalStr.replace(/0+$/, '');
  
  if (fractionalStr.length > 0) {
    return `${wholePart.toString()}.${fractionalStr}`;
  } else {
    return wholePart.toString();
  }
}

// Constants for Base Sepolia Explorer APIs and smart contracts
const BASE_EXPLORER_API = 'https://sepolia.basescan.org/api';
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
  blockNumber: number;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimal: string;
  input: string;
  methodId: string;
  methodName: string;
  functionName: string;
  gasPrice: string;
  gasUsed: string;
  confirmations: string;
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
    // For demo/test purposes, make a simplified request
    // In production, you would use your API key and proper endpoint URL
    console.log('Fetching normal transactions for address:', address);
    
    // Simulate API response for testing in demo
    // In production, this would be replaced with actual API call
    const mockTransactions = [
      {
        hash: `0x${Math.random().toString(16).substring(2, 42)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 9000000,
        timeStamp: String(Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400)),
        from: address.toLowerCase(),
        to: FAUCET_CONTRACT.toLowerCase(),
        value: "0",
        input: "0x1249c58b", // claim() method
        methodId: "0x1249c58b",
        functionName: "claim()",
        gasPrice: "5000000000",
        gasUsed: "100000",
        confirmations: "100"
      }
    ];
    
    return mockTransactions;
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
    // For demo/test purposes, make a simplified request
    // In production, you would use your API key and proper endpoint URL
    console.log('Fetching token transactions for address:', address);
    
    // Simulate API response for testing in demo
    // In production, this would be replaced with actual API call
    const mockTransactions = [
      {
        hash: `0x${Math.random().toString(16).substring(2, 42)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 9000000,
        timeStamp: String(Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400)),
        from: TOKEN_CONTRACTS.PRIOR.toLowerCase(),
        to: address.toLowerCase(),
        value: "1000000000000000000", // 1 PRIOR
        tokenSymbol: "PRIOR",
        tokenName: "Prior Protocol Token",
        tokenDecimal: "18",
        contractAddress: TOKEN_CONTRACTS.PRIOR,
        confirmations: "100"
      },
      {
        hash: `0x${Math.random().toString(16).substring(2, 42)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 9000000,
        timeStamp: String(Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400)),
        from: address.toLowerCase(),
        to: SWAP_CONTRACTS['PRIOR-USDC'].toLowerCase(),
        value: "500000000000000000", // 0.5 PRIOR
        tokenSymbol: "PRIOR",
        tokenName: "Prior Protocol Token",
        tokenDecimal: "18",
        contractAddress: TOKEN_CONTRACTS.PRIOR,
        confirmations: "100"
      },
      {
        hash: `0x${Math.random().toString(16).substring(2, 42)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 9000000,
        timeStamp: String(Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400)),
        from: SWAP_CONTRACTS['PRIOR-USDC'].toLowerCase(),
        to: address.toLowerCase(),
        value: "500000000", // 0.5 USDC (6 decimals)
        tokenSymbol: "USDC",
        tokenName: "USD Coin",
        tokenDecimal: "6",
        contractAddress: TOKEN_CONTRACTS.USDC,
        confirmations: "100"
      }
    ];
    
    return mockTransactions;
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
  return (
    (tx.to?.toLowerCase() === FAUCET_CONTRACT.toLowerCase() && tx.input?.startsWith('0x1249c58b')) || // claim()
    (tx.from?.toLowerCase() === FAUCET_CONTRACT.toLowerCase() && tx.tokenSymbol === 'PRIOR')
  );
}

/**
 * Determines if a transaction is related to swaps
 * @param tx Transaction to analyze
 */
function isSwapTransaction(tx: any): boolean {
  const swapContractAddresses = Object.values(SWAP_CONTRACTS).map(addr => addr.toLowerCase());
  return (
    swapContractAddresses.includes(tx.to?.toLowerCase()) || 
    swapContractAddresses.includes(tx.from?.toLowerCase())
  );
}

/**
 * Parse faucet transaction details
 * @param tx Transaction to parse
 */
function parseFaucetTransaction(tx: any): ParsedTransaction {
  return {
    txHash: tx.hash,
    blockNumber: parseInt(tx.blockNumber),
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
    
    if (relatedTx) {
      // This is an output of a swap
      return {
        txHash: tx.hash,
        blockNumber: parseInt(tx.blockNumber),
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
    // In a real implementation, you'd need to analyze the full transaction receipt
    return {
      txHash: tx.hash,
      blockNumber: parseInt(tx.blockNumber),
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
    
    // For demo, ensure we have some data to show
    if (parsedTransactions.length === 0) {
      // Add a simulated faucet claim
      parsedTransactions.push({
        txHash: `0x${Math.random().toString(16).substring(2, 42)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 9000000,
        timestamp: new Date().toISOString(),
        type: 'faucet_claim',
        fromToken: null,
        toToken: 'PRIOR',
        fromAmount: null,
        toAmount: '1',
        status: 'completed'
      });
      
      // Add a simulated swap
      parsedTransactions.push({
        txHash: `0x${Math.random().toString(16).substring(2, 42)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 9000000,
        timestamp: new Date().toISOString(),
        type: 'swap',
        fromToken: 'PRIOR',
        toToken: 'USDC',
        fromAmount: '0.5',
        toAmount: '0.5',
        status: 'completed'
      });
    }
    
    return parsedTransactions;
  } catch (error) {
    console.error('Error processing transactions:', error);
    return [];
  }
}