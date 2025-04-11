/**
 * Contract ABIs Index File
 * 
 * Exports all ABIs from a single location for easy importing.
 */

// Import ABIs
import { erc20Abi } from './erc20Abi';
import { nftAbi } from './nftAbi';
import { faucetAbi } from './faucetAbi';
import { 
  swapAbi, 
  priorUsdcSwapAbi, 
  priorUsdtSwapAbi, 
  usdcUsdtSwapAbi 
} from './priorSwapAbis';

// Export individual ABIs
export {
  erc20Abi,
  nftAbi,
  faucetAbi,
  swapAbi,
  priorUsdcSwapAbi,
  priorUsdtSwapAbi,
  usdcUsdtSwapAbi
};

// Create a grouped object of all ABIs
export const CONTRACT_ABIS = {
  erc20: erc20Abi,
  nft: nftAbi,
  faucet: faucetAbi,
  swaps: {
    prior: {
      usdc: priorUsdcSwapAbi,
      usdt: priorUsdtSwapAbi
    },
    stablecoins: {
      usdcUsdt: usdcUsdtSwapAbi
    },
    legacy: swapAbi
  }
};

export default CONTRACT_ABIS;