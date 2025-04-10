/**
 * Contract Services
 * 
 * Provides utility functions for interacting with smart contracts.
 * All contract-related logic should be centralized here.
 */

import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from './addresses';
import { TOKEN_DECIMALS, TOKEN_SYMBOLS } from './metadata/tokens';
import { erc20Abi, swapAbi, faucetAbi, nftAbi } from './abis';

// Function to get token contract instance
export const getTokenContract = async (tokenAddress: string) => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return new ethers.Contract(tokenAddress, erc20Abi, provider);
};

// Function to get token contract with signer (for transactions)
export const getTokenContractWithSigner = async (tokenAddress: string) => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(tokenAddress, erc20Abi, signer);
};

// Function to get Swap contract instance
export const getSwapContract = async () => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return new ethers.Contract(CONTRACT_ADDRESSES.priorSwap, swapAbi, provider);
};

// Function to get Swap contract instance with signer (for transactions)
export const getSwapContractWithSigner = async () => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESSES.priorSwap, swapAbi, signer);
};

// Function to get Faucet contract instance
export const getFaucetContract = async () => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return new ethers.Contract(CONTRACT_ADDRESSES.priorFaucet, faucetAbi, provider);
};

// Function to get Faucet contract with signer (for transactions)
export const getFaucetContractWithSigner = async () => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESSES.priorFaucet, faucetAbi, signer);
};

// Function to get NFT contract
export const getNftContract = async () => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return new ethers.Contract(CONTRACT_ADDRESSES.priorPioneerNFT, nftAbi, provider);
};

// Get token symbol from address
export const getTokenSymbol = (tokenAddress: string): string => {
  const lowerCaseAddress = tokenAddress.toLowerCase();
  
  if (lowerCaseAddress === CONTRACT_ADDRESSES.priorToken.toLowerCase()) {
    return "PRIOR";
  }
  
  for (const [symbol, address] of Object.entries(CONTRACT_ADDRESSES.mockTokens)) {
    if (lowerCaseAddress === address.toLowerCase()) {
      return symbol;
    }
  }
  
  return "Unknown";
};

// Get token decimals from address
export const getTokenDecimalsFromAddress = (tokenAddress: string): number => {
  const symbol = getTokenSymbol(tokenAddress);
  return TOKEN_DECIMALS[symbol as keyof typeof TOKEN_DECIMALS] || 18; // Default to 18 if not found
};

// Function to get token balance
export const getTokenBalance = async (tokenAddress: string, address: string): Promise<string> => {
  try {
    console.log(`Fetching token balance for address: ${address} and token: ${tokenAddress}`);
    const contract = await getTokenContract(tokenAddress);
    const symbol = getTokenSymbol(tokenAddress);
    console.log(`Token symbol: ${symbol}`);
    
    const balance = await contract.balanceOf(address);
    console.log(`Raw balance result for ${symbol}: ${balance.toString()}`);
    
    const decimals = TOKEN_DECIMALS[symbol as keyof typeof TOKEN_DECIMALS] || 18;
    console.log(`Using decimals: ${decimals} for ${symbol}`);
    
    return ethers.utils.formatUnits(balance, decimals);
  } catch (error) {
    console.error("Error getting token balance:", error);
    return "0.0";
  }
};

// Function to approve tokens for swap
export const approveTokens = async (tokenAddress: string, amount: string): Promise<boolean> => {
  try {
    const contract = await getTokenContractWithSigner(tokenAddress);
    const decimals = getTokenDecimalsFromAddress(tokenAddress);
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);
    
    // Approve the swap contract to spend the tokens
    const tx = await contract.approve(CONTRACT_ADDRESSES.priorSwap, parsedAmount);
    await tx.wait();
    return true;
  } catch (error) {
    console.error("Error approving tokens:", error);
    return false;
  }
};

// Function to swap tokens
export const swapTokens = async (
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
): Promise<any> => {
  try {
    const swapContract = await getSwapContractWithSigner();
    const fromSymbol = getTokenSymbol(fromTokenAddress);
    const toSymbol = getTokenSymbol(toTokenAddress);
    const decimals = getTokenDecimalsFromAddress(fromTokenAddress);
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);
    
    let tx;
    
    // From PRIOR to other tokens
    if (fromSymbol === "PRIOR") {
      if (toSymbol === "USDC") {
        tx = await swapContract.swapPriorForUSDC(parsedAmount);
      } else if (toSymbol === "USDT") {
        tx = await swapContract.swapPriorForUSDT(parsedAmount);
      } else if (toSymbol === "DAI") {
        tx = await swapContract.swapPriorForDAI(parsedAmount);
      } else if (toSymbol === "WETH") {
        tx = await swapContract.swapPriorForWETH(parsedAmount);
      }
    } 
    // From other tokens to PRIOR
    else {
      if (fromSymbol === "USDC") {
        tx = await swapContract.swapUSDCForPrior(parsedAmount);
      } else if (fromSymbol === "USDT") {
        tx = await swapContract.swapUSDTForPrior(parsedAmount);
      } else if (fromSymbol === "DAI") {
        tx = await swapContract.swapDAIForPrior(parsedAmount);
      } else if (fromSymbol === "WETH") {
        tx = await swapContract.swapWETHForPrior(parsedAmount);
      }
    }
    
    return tx.wait();
  } catch (error) {
    console.error("Error swapping tokens:", error);
    throw error; // Re-throw to handle in UI
  }
};

// Function to claim tokens from faucet
export const claimFromFaucet = async (): Promise<boolean> => {
  try {
    const faucetContract = await getFaucetContractWithSigner();
    
    const tx = await faucetContract.claim();
    await tx.wait();
    return true;
  } catch (error) {
    console.error("Error claiming from faucet:", error);
    return false;
  }
};

// Function to check if user can claim from faucet
export const getFaucetInfo = async (address: string) => {
  try {
    const faucetContract = await getFaucetContract();
    
    const lastClaimTime = await faucetContract.checkClaim(address);
    const nextClaimTime = Number(lastClaimTime.toString()) + 24 * 60 * 60; // 24 hours in seconds
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    
    return {
      canClaim: currentTime > nextClaimTime,
      nextClaimTime: new Date(nextClaimTime * 1000),
      timeRemaining: Math.max(0, nextClaimTime - currentTime)
    };
  } catch (error) {
    console.error("Error checking faucet info:", error);
    return {
      canClaim: false,
      nextClaimTime: new Date(),
      timeRemaining: 24 * 60 * 60
    };
  }
};

// Get the exchange rate between PRIOR and USDC (1 PRIOR = x USDC)
export const getPriorToUSDCRate = async (): Promise<string> => {
  try {
    const swapContract = await getSwapContract();
    const rate = await swapContract.PRIOR_TO_USDC_RATE();
    // Return as a string to handle formatting later in the UI
    return "0.000005"; // Fixed rate for testnet
  } catch (error) {
    console.error("Error getting PRIOR to USDC rate:", error);
    return "0.000005"; // Default rate if error
  }
};

// Get the exchange rate between PRIOR and USDT
export const getPriorToUSDTRate = async (): Promise<string> => {
  try {
    const swapContract = await getSwapContract();
    const rate = await swapContract.PRIOR_TO_USDT_RATE();
    // Return as a string to handle formatting later in the UI
    return "0.000005"; // Fixed rate for testnet
  } catch (error) {
    console.error("Error getting PRIOR to USDT rate:", error);
    return "0.000005"; // Default rate if error
  }
};

// Get the exchange rate between PRIOR and DAI
export const getPriorToDAIRate = async (): Promise<string> => {
  try {
    const swapContract = await getSwapContract();
    const rate = await swapContract.PRIOR_TO_DAI_RATE();
    // Return as a string to handle formatting later in the UI
    return "0.000005"; // Fixed rate for testnet
  } catch (error) {
    console.error("Error getting PRIOR to DAI rate:", error);
    return "0.000005"; // Default rate if error
  }
};

// Get the exchange rate between PRIOR and WETH
export const getPriorToWETHRate = async (): Promise<string> => {
  try {
    const swapContract = await getSwapContract();
    const rate = await swapContract.PRIOR_TO_WETH_RATE();
    // Return as a string to handle formatting later in the UI
    return "0.0000001"; // Fixed rate for testnet
  } catch (error) {
    console.error("Error getting PRIOR to WETH rate:", error);
    return "0.0000001"; // Default rate if error
  }
};

// Get the swap fee percentage
export const getSwapFee = async (): Promise<number> => {
  try {
    const swapContract = await getSwapContract();
    const feeBasisPoints = await swapContract.FEE_BASIS_POINTS();
    return parseInt(feeBasisPoints.toString()) / 100; // Convert basis points to percentage
  } catch (error) {
    console.error("Error getting swap fee:", error);
    return 0.5; // Default fee if error (0.5%)
  }
};

// Function to check if the user has the Prior Pioneer NFT
export const checkPriorPioneerNFT = async (address: string): Promise<boolean> => {
  try {
    const nftContract = await getNftContract();
    
    const balance = await nftContract.balanceOf(address);
    return balance.gt(0);
  } catch (error) {
    console.error("Error checking Pioneer NFT:", error);
    return false;
  }
};

// Function to calculate the expected output amount for a swap
export const calculateSwapOutput = async (fromTokenAddress: string, toTokenAddress: string, amountIn: string): Promise<string> => {
  try {
    const fromSymbol = getTokenSymbol(fromTokenAddress);
    const toSymbol = getTokenSymbol(toTokenAddress);
    const fromDecimals = getTokenDecimalsFromAddress(fromTokenAddress);
    const toDecimals = getTokenDecimalsFromAddress(toTokenAddress);
    
    // Get the appropriate rate based on the token pair
    let rate = "0";
    
    if (fromSymbol === "PRIOR" && toSymbol === "USDC") {
      rate = await getPriorToUSDCRate();
    } else if (fromSymbol === "PRIOR" && toSymbol === "USDT") {
      rate = await getPriorToUSDTRate();
    } else if (fromSymbol === "PRIOR" && toSymbol === "DAI") {
      rate = await getPriorToDAIRate();
    } else if (fromSymbol === "PRIOR" && toSymbol === "WETH") {
      rate = await getPriorToWETHRate();
    } else if (fromSymbol === "USDC" && toSymbol === "PRIOR") {
      rate = (1 / parseFloat(await getPriorToUSDCRate())).toString();
    } else if (fromSymbol === "USDT" && toSymbol === "PRIOR") {
      rate = (1 / parseFloat(await getPriorToUSDTRate())).toString();
    } else if (fromSymbol === "DAI" && toSymbol === "PRIOR") {
      rate = (1 / parseFloat(await getPriorToDAIRate())).toString();
    } else if (fromSymbol === "WETH" && toSymbol === "PRIOR") {
      rate = (1 / parseFloat(await getPriorToWETHRate())).toString();
    }
    
    // Get the swap fee
    const feePercentage = await getSwapFee();
    
    // Calculate the output amount
    const amountOut = parseFloat(amountIn) * parseFloat(rate);
    
    // Apply the fee
    const amountOutAfterFee = amountOut * (1 - feePercentage / 100);
    
    return amountOutAfterFee.toFixed(toDecimals);
  } catch (error) {
    console.error("Error calculating swap output:", error);
    return "0";
  }
};