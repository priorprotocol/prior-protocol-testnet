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
  PRIOR: '0xeFC91C5a51E8533282486FA2601dFfe0a0b16EDb',
  USDC: '0xdB07b0b4E88D9D5A79A08E91fEE20Bb41f9989a2',
};
const SWAP_CONTRACTS = {
  'PRIOR-USDC': '0x8957e1988905311EE249e679a29fc9deCEd4D910',
};
const FAUCET_CONTRACT = '0xa206dC56F1A56a03aEa0fCBB7c7A62b5bE1Fe419';
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
        console.warn('API error fetching normal transactions:', data.status);
        // Log more detailed error info
        console.log('API response details:', data);
        
        // For NOTOK status, it could be API key issues or rate limiting
        if (data.status === 'NOTOK') {
          console.log('Base Sepolia Explorer API returned NOTOK status. This could be due to:');
          console.log('1. API rate limiting');
          console.log('2. API key permissions');
          console.log('3. Service temporarily unavailable');
          console.log('Falling back to database records');
          return []; // Return empty array instead of throwing
        }
        
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
        console.warn('API error fetching token transactions:', data.status);
        // Log more detailed error info
        console.log('API response details:', data);
        
        // For NOTOK status, it could be API key issues or rate limiting
        if (data.status === 'NOTOK') {
          console.log('Base Sepolia Explorer API returned NOTOK status. This could be due to:');
          console.log('1. API rate limiting');
          console.log('2. API key permissions');
          console.log('3. Service temporarily unavailable');
          console.log('Falling back to database records');
          return []; // Return empty array instead of throwing
        }
        
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
  const priorContract = TOKEN_CONTRACTS.PRIOR.toLowerCase();
  
  // Case 1: Direct interaction with the faucet contract (most common)
  if (tx.to?.toLowerCase() === faucetContract) {
    // Check for common faucet function signatures
    const faucetFunctionSignatures = [
      '0x1249c58b', // claim()
      '0x9f678cca', // drip()
      '0x28cad79b', // requestTokens()
      '0x4e71d92d', // claim() alternative signature
      '0xe1f21c67', // request() alternative signature
      '0x' // Default method call with no parameters
    ];
    
    // If input data exists, check for known faucet signatures
    if (tx.input) {
      // First check exact matches with common signatures
      for (const sig of faucetFunctionSignatures) {
        if (tx.input.startsWith(sig)) {
          console.log(`Identified faucet transaction by method signature: ${sig}`);
          return true;
        }
      }
    }
    
    // Any interaction with the faucet contract is likely a claim
    console.log(`Identified faucet transaction by direct contract interaction with: ${faucetContract}`);
    return true;
  }
  
  // Case 2: Token transfer from the faucet contract 
  if (tx.from?.toLowerCase() === faucetContract) {
    console.log(`Identified faucet transaction by sender: ${faucetContract}`);
    return true;
  }
  
  // Case 3: Token transfer related to PRIOR from the faucet
  if (tx.tokenSymbol === 'PRIOR' || tx.tokenName === 'Prior Protocol Token') {
    if (tx.from?.toLowerCase() === faucetContract || tx.to?.toLowerCase() === faucetContract) {
      console.log(`Identified faucet transaction via PRIOR token transfer involving faucet`);
      return true;
    }
  }
  
  // Case 4: Any transaction involving the PRIOR contract and faucet contract
  if (tx.contractAddress?.toLowerCase() === priorContract) {
    if (tx.from?.toLowerCase() === faucetContract || tx.to?.toLowerCase() === faucetContract) {
      console.log(`Identified faucet transaction via PRIOR contract interaction with faucet`);
      return true;
    }
  }
  
  // Case 5: Check for ERC20 Transfer events from logs
  if (tx.logs) {
    for (const log of tx.logs) {
      // If this log is from the PRIOR contract and involves the faucet
      if (log.address?.toLowerCase() === priorContract) {
        if (log.topics && log.topics.length > 0) {
          // Standard ERC20 Transfer event topic
          const transferEventTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
          if (log.topics[0] === transferEventTopic) {
            // Check if faucet address is in any topic
            if (log.topics.some((topic: string) => topic.toLowerCase().includes(faucetContract.slice(2)))) {
              console.log(`Identified faucet transaction via Transfer event logs`);
              return true;
            }
          }
        }
      }
    }
  }
  
  // Case 6: Check transaction function name/description
  const keywords = ['claim', 'faucet', 'drip', 'request token', 'airdrop'];
  if (tx.functionName && keywords.some(keyword => tx.functionName.toLowerCase().includes(keyword))) {
    console.log(`Identified faucet transaction via function name: ${tx.functionName}`);
    return true;
  }
  
  // Case 7: Check method ID if available and known faucet methods
  if (tx.methodId) {
    const faucetMethodIds = ['0x1249c58b', '0x9f678cca', '0x28cad79b', '0x4e71d92d', '0xe1f21c67'];
    if (faucetMethodIds.includes(tx.methodId)) {
      console.log(`Identified faucet transaction via methodId: ${tx.methodId}`);
      return true;
    }
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
  const faucetContract = FAUCET_CONTRACT.toLowerCase();
  
  // Check if this is a token transaction to/from a swap contract
  if (tx.contractAddress) {
    const contractAddr = tx.contractAddress.toLowerCase();
    // If this is a token transaction for a supported token (PRIOR, USDC)
    if ([priorContract, usdcContract].includes(contractAddr)) {
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
  console.log('Parsing faucet transaction:', tx.hash);
  
  // Convert blockNumber to number if it's a string
  const blockNumber = typeof tx.blockNumber === 'string' ? parseInt(tx.blockNumber, 10) : tx.blockNumber || 0;
  
  // Default faucet claim amount is 1 PRIOR
  let toAmount = '1';
  
  // Try to extract the amount from the transaction if possible
  if (tx.value && tx.tokenDecimal) {
    // For token transactions, get the value from the token transfer
    toAmount = formatTokenValue(tx.value, parseInt(tx.tokenDecimal));
    console.log(`Extracted amount from token tx: ${toAmount} (raw: ${tx.value}, decimals: ${tx.tokenDecimal})`);
  } else if (tx.value && tx.tokenSymbol === 'PRIOR') {
    // For token transactions without decimal info but known to be PRIOR
    toAmount = formatTokenValue(tx.value, 18);
    console.log(`Extracted amount from PRIOR tx: ${toAmount} (raw: ${tx.value})`);
  } else if (tx.logs && tx.logs.length > 0) {
    // Try to extract from logs
    console.log(`Attempting to extract amount from ${tx.logs.length} transaction logs`);
    for (const log of tx.logs) {
      if (log.data && log.data !== '0x' && log.data.length > 2) {
        try {
          // Try to interpret the data as a token amount
          const amountHex = log.data.slice(2);
          const amountBigInt = BigInt('0x' + amountHex);
          if (amountBigInt > 0) {
            toAmount = formatTokenValue(amountBigInt.toString(), 18);
            console.log(`Extracted amount from logs: ${toAmount} (raw: ${amountBigInt.toString()})`);
            break;
          }
        } catch (e) {
          console.warn('Error parsing log data:', e);
        }
      }
    }
  } else if (tx.input && tx.input.length >= 74) {
    // Try to extract from input data for some faucet contracts
    // Input format: 0x<method_id><params>
    try {
      // Skip method ID (4 bytes / 8 hex chars) and get first parameter (32 bytes / 64 hex chars)
      const valueHex = tx.input.slice(10, 74);
      const valueBigInt = BigInt('0x' + valueHex);
      
      // Check if this looks like a reasonable value (not zero and not unrealistically large)
      if (valueBigInt > 0 && valueBigInt < BigInt('1000000000000000000000')) { // 1000 tokens max
        toAmount = formatTokenValue(valueBigInt.toString(), 18);
        console.log(`Extracted amount from input data: ${toAmount} (raw: ${valueBigInt.toString()})`);
      }
    } catch (e) {
      console.warn('Error parsing input data:', e);
    }
  }
  
  // Ensure the amount is not unrealistically large or small
  try {
    const parsed = parseFloat(toAmount);
    if (isNaN(parsed) || parsed <= 0) {
      console.log('Amount was invalid, defaulting to 1 PRIOR');
      toAmount = '1';
    } else if (parsed > 1000) {
      // Cap unrealistically large values at 1000 tokens
      console.log(`Capping unrealistic amount ${parsed} to 1000 PRIOR`);
      toAmount = '1000';
    }
  } catch (e) {
    toAmount = '1';
  }
  
  // Ensure the transaction uses the correct literal type
  const txType: 'faucet_claim' = 'faucet_claim';
  
  const parsedTx: ParsedTransaction = {
    txHash: tx.hash,
    blockNumber: blockNumber,
    timestamp: new Date(parseInt(tx.timeStamp || Date.now()/1000) * 1000).toISOString(),
    type: txType,
    fromToken: null,
    toToken: 'PRIOR',
    fromAmount: null,
    toAmount: toAmount,
    status: 'completed'
  };
  
  console.log('Parsed faucet transaction:', parsedTx);
  return parsedTx;
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
    const blockNumber = typeof tx.blockNumber === 'string' ? parseInt(tx.blockNumber, 10) : tx.blockNumber || 0;
    
    // Ensure the transaction uses the correct literal type
    const txType: 'swap' = 'swap';
    
    if (relatedTx) {
      // This is an output of a swap
      const parsedTx: ParsedTransaction = {
        txHash: tx.hash,
        blockNumber: blockNumber,
        timestamp: new Date(parseInt(tx.timeStamp || Date.now()/1000) * 1000).toISOString(),
        type: txType,
        fromToken: relatedTx.tokenSymbol,
        toToken: tx.tokenSymbol,
        fromAmount: relatedTx.value ? formatTokenValue(relatedTx.value, parseInt(relatedTx.tokenDecimal || '18')) : null,
        toAmount: tx.value ? formatTokenValue(tx.value, parseInt(tx.tokenDecimal || '18')) : null,
        status: 'completed'
      };
      return parsedTx;
    }
    
    // This might be the input side of a swap, but we don't have the output yet
    const parsedTx: ParsedTransaction = {
      txHash: tx.hash,
      blockNumber: blockNumber,
      timestamp: new Date(parseInt(tx.timeStamp || Date.now()/1000) * 1000).toISOString(),
      type: txType,
      fromToken: tx.tokenSymbol,
      toToken: null, // We don't know the output token yet
      fromAmount: tx.value ? formatTokenValue(tx.value, parseInt(tx.tokenDecimal || '18')) : null,
      toAmount: null,
      status: 'completed'
    };
    return parsedTx;
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
    
    console.log('Fetching historical transactions from Base Sepolia Explorer for address:', address);
    
    // Fetch both normal and token transactions
    const [normalTxs, tokenTxs] = await Promise.all([
      fetchNormalTransactions(address),
      fetchTokenTransactions(address)
    ]);
    
    // Combine all transactions - deduplicate by hash
    const txMap = new Map();
    [...normalTxs, ...tokenTxs].forEach(tx => {
      if (!txMap.has(tx.hash)) {
        txMap.set(tx.hash, tx);
      } else {
        // If we already have this hash, merge any additional properties
        const existingTx = txMap.get(tx.hash);
        txMap.set(tx.hash, { ...existingTx, ...tx });
      }
    });
    
    const allTxs = Array.from(txMap.values());
    console.log(`Found ${allTxs.length} total transactions (${normalTxs.length} normal, ${tokenTxs.length} token)`);
    
    // Process and filter transactions
    const parsedTransactions: ParsedTransaction[] = [];
    
    // First identify faucet transactions
    const faucetTxs = allTxs.filter(tx => isFaucetTransaction(tx));
    console.log(`Identified ${faucetTxs.length} faucet transactions`);
    
    for (const tx of faucetTxs) {
      parsedTransactions.push(parseFaucetTransaction(tx));
    }
    
    // Then identify swap transactions
    const swapCandidates = allTxs.filter(tx => isSwapTransaction(tx) && !isFaucetTransaction(tx));
    console.log(`Identified ${swapCandidates.length} potential swap transactions`);
    
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
    
    // Sort transactions by timestamp/block number (recent first)
    parsedTransactions.sort((a, b) => {
      // Try to sort by timestamp first
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      
      if (timeA !== timeB) {
        return timeB - timeA; // Descending order
      }
      
      // If timestamps are same or invalid, sort by block number
      return b.blockNumber - a.blockNumber;
    });
    
    // Log summary of what we found
    console.log(`Processed ${parsedTransactions.length} transactions: ${
      parsedTransactions.filter(tx => tx.type === 'faucet_claim').length
    } faucet claims, ${
      parsedTransactions.filter(tx => tx.type === 'swap').length
    } swaps`);
    
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