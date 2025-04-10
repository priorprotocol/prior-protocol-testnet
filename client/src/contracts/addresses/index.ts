/**
 * Base Sepolia Testnet Contract Addresses
 * 
 * This file contains all contract addresses used in the Prior Protocol testnet.
 * Update this file when deploying new contract versions.
 */

// Prior Token (ERC20)
export const PRIOR_TOKEN = "0x15b5Cca71598A1e2f5C8050ef3431dCA49F8EcbD";

// DEX / Swap Contract 
export const PRIOR_SWAP = "0x4e659af0932de50379391794d4dad10f21b9235b";

// Faucet Contract
export const PRIOR_FAUCET = "0x4ec7095749ecc40c9d33c28fA2FafaD1A4FadF3c";

// NFT Contract
export const PRIOR_PIONEER_NFT = "0x2a45dfDbdCfcF72CBE835435eD54f4beE7d06D59";

// Mock tokens (for testing)
export const MOCK_TOKENS = {
  USDC: "0xb950C186B2f15D0D85416AC19A16D6F23fD586b7", // 6 decimals
  USDT: "0xeED9C99a850399F0C408616dc8F9dDCb948aeaA2", // 6 decimals
  DAI: "0x72f30eb1cE25523Ea2Fa63eDe9797481634E496B",  // 6 decimals
  WETH: "0xc413B81c5fb4798b8e4c6053AADd383C4Dc3703B"  // 18 decimals
};

// All contract addresses grouped as an object for easy importing
export const CONTRACT_ADDRESSES = {
  priorToken: PRIOR_TOKEN,
  priorSwap: PRIOR_SWAP,
  priorFaucet: PRIOR_FAUCET,
  priorPioneerNFT: PRIOR_PIONEER_NFT,
  mockTokens: MOCK_TOKENS
};

// Export a function to get all addresses (useful for debugging)
export function getAllAddresses() {
  return {
    PRIOR_TOKEN,
    PRIOR_SWAP,
    PRIOR_FAUCET,
    PRIOR_PIONEER_NFT,
    MOCK_TOKENS
  };
}

export default CONTRACT_ADDRESSES;