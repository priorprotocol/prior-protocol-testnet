/**
 * Base Sepolia Testnet Contract Addresses
 * 
 * This file contains all contract addresses used in the Prior Protocol testnet.
 * Update this file when deploying new contract versions.
 */

// Prior Token (ERC20)
export const PRIOR_TOKEN = "0xBc8697476a56679534b15994C0f1122556bBF9F4";

// Stablecoin Tokens
export const TOKENS = {
  USDC: "0xc6d67115Cf17A55F9F22D29b955654A7c96781C5", // 6 decimals
  USDT: "0x2B744c80C4895fDC2003108E186aBD7613c0ec7E"  // 6 decimals
};

// DEX / Swap Contracts
export const SWAP_CONTRACTS = {
  PRIOR_USDC: "0xaB73D1a2334Bf336DD103d739a239bba1A56b6ED",
  PRIOR_USDT: "0xdb68d6D064c36d45c92365f61F689FC2d1661F65",
  USDC_USDT: "0xbbd5997cfA849876289ebab4CddcD4Bc538B0244"
};

// Faucet Contract
export const PRIOR_FAUCET = "0xD0CA4219ABFd3A0535cafDCe3FB5707dc66F7cCe";

// NFT Contract
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