/**
 * Base Sepolia Testnet Contract Addresses
 * 
 * This file contains all contract addresses used in the Prior Protocol testnet.
 * Update this file when deploying new contract versions.
 */

// IMPORTANT: HARD-CODED CONTRACT ADDRESSES
// These addresses are the source of truth for the entire application
// DO NOT CHANGE without updating all services

// Prior Token (ERC20) - CORRECT ADDRESS
export const PRIOR_TOKEN = "0xeFC91C5a51E8533282486FA2601dFfe0a0b16EDb";

// Stablecoin Tokens - CORRECT ADDRESSES
export const TOKENS = {
  USDC: "0xdB07b0b4E88D9D5A79A08E91fEE20Bb41f9989a2", // 6 decimals
  USDT: "" // Not used in new deployment - completely removed
};

// DEX / Swap Contracts - CORRECT ADDRESS
export const SWAP_CONTRACTS = {
  PRIOR_USDC: "0x8957e1988905311EE249e679a29fc9deCEd4D910",
  PRIOR_USDT: "", // Not used in new deployment - completely removed
  USDC_USDT: ""   // Not used in new deployment - completely removed
};

// Faucet Contract - CORRECT ADDRESS
export const PRIOR_FAUCET = "0xa206dC56F1A56a03aEa0fCBB7c7A62b5bE1Fe419";

// NFT Contract - CORRECT ADDRESS
export const PRIOR_PIONEER_NFT = "0x2a45dfDbdCfcF72CBE835435eD54f4beE7d06D59";

// All contract addresses grouped as an object for easy importing
export const CONTRACT_ADDRESSES = {
  priorToken: PRIOR_TOKEN,
  tokens: TOKENS,
  swapContracts: SWAP_CONTRACTS,
  priorFaucet: PRIOR_FAUCET,
  priorPioneerNFT: PRIOR_PIONEER_NFT
};

// Export a function to get all addresses (useful for debugging)
export function getAllAddresses() {
  return CONTRACT_ADDRESSES;
}

export default CONTRACT_ADDRESSES;