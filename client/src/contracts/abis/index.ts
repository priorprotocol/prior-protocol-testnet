/**
 * Contract ABIs Index File
 * 
 * Exports all ABIs from a single location for easy importing.
 */

// Import ABIs
import { erc20Abi } from './erc20Abi';
import { nftAbi } from './nftAbi';
import { faucetAbi } from './faucetAbi';
import { swapAbi } from './swapAbi';

// Export individual ABIs
export {
  erc20Abi,
  nftAbi,
  faucetAbi,
  swapAbi
};

// Create a grouped object of all ABIs
export const CONTRACT_ABIS = {
  erc20: erc20Abi,
  nft: nftAbi,
  faucet: faucetAbi,
  swap: swapAbi
};

export default CONTRACT_ABIS;