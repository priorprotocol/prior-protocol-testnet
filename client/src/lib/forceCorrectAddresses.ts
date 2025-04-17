/**
 * Force Correct Addresses
 * 
 * This file ensures that all components only use the latest contract addresses for the
 * Base Sepolia testnet. It's used as a central source of truth for contract addresses
 * and replaces any outdated addresses that might be cached or used elsewhere.
 */

// Define the correct addresses explicitly
export const CORRECT_ADDRESSES = {
  // Token contracts
  PRIOR_TOKEN: "0xeFC91C5a51E8533282486FA2601dFfe0a0b16EDb",
  USDC_TOKEN: "0xdB07b0b4E88D9D5A79A08E91fEE20Bb41f9989a2",
  
  // Swap contract
  PRIOR_USDC_SWAP: "0x8957e1988905311EE249e679a29fc9deCEd4D910",
  
  // Faucet contract
  PRIOR_FAUCET: "0xa206dC56F1A56a03aEa0fCBB7c7A62b5bE1Fe419",
  
  // NFT contract
  PRIOR_PIONEER_NFT: "0x2a45dfDbdCfcF72CBE835435eD54f4beE7d06D59"
};

// Helper functions to get the correct addresses
export function getCorrectPriorTokenAddress(): string {
  return CORRECT_ADDRESSES.PRIOR_TOKEN;
}

export function getCorrectUsdcTokenAddress(): string {
  return CORRECT_ADDRESSES.USDC_TOKEN;
}

export function getCorrectSwapAddress(): string {
  return CORRECT_ADDRESSES.PRIOR_USDC_SWAP;
}

export function getCorrectFaucetAddress(): string {
  return CORRECT_ADDRESSES.PRIOR_FAUCET;
}

export function getCorrectNftAddress(): string {
  return CORRECT_ADDRESSES.PRIOR_PIONEER_NFT;
}

// Helper to check if an address matches one of our correct addresses
export function identifyCorrectToken(address: string): string | null {
  const normalizedAddress = address.toLowerCase();
  
  if (normalizedAddress === CORRECT_ADDRESSES.PRIOR_TOKEN.toLowerCase()) {
    return "PRIOR";
  }
  
  if (normalizedAddress === CORRECT_ADDRESSES.USDC_TOKEN.toLowerCase()) {
    return "USDC";
  }
  
  return null;
}

// Clear any cached balances and token data
export function clearTokenCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tokenBalances');
    localStorage.removeItem('tokenApprovals');
    localStorage.removeItem('cachedBalances');
    localStorage.removeItem('lastPriorSwap');
    console.log("Token cache cleared");
  }
}

// Initialize by clearing any cached data
clearTokenCache();