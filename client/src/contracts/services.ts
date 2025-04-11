/**
 * Contract Services
 * 
 * Provides utility functions for interacting with smart contracts.
 * All contract-related logic should be centralized here.
 */

import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, SWAP_CONTRACTS } from './addresses';
import { TOKEN_DECIMALS, TOKEN_SYMBOLS } from './metadata/tokens';
import { 
  erc20Abi, 
  priorUsdcSwapAbi, 
  priorUsdtSwapAbi, 
  usdcUsdtSwapAbi,
  faucetAbi, 
  nftAbi 
} from './abis';

// Function to get token contract instance
export const getTokenContract = async (tokenAddress: string) => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return new ethers.Contract(tokenAddress, erc20Abi, provider);
};

// Function to get token contract with signer (for transactions)
export const getTokenContractWithSigner = async (tokenAddress: string) => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  
  // Force wallet connection before getting signer
  try {
    console.log("Requesting accounts to ensure connection for token contract");
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  } catch (error) {
    console.error("Error requesting accounts for token contract:", error);
    throw new Error("Failed to connect to wallet. Please unlock your wallet and try again.");
  }
  
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(tokenAddress, erc20Abi, signer);
};

// Function to get the appropriate swap contract based on token pair
export const getSwapContract = async (fromToken?: string, toToken?: string) => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  
  // If no tokens specified, default to PRIOR-USDC swap contract
  if (!fromToken || !toToken) {
    return new ethers.Contract(
      SWAP_CONTRACTS.PRIOR_USDC, 
      priorUsdcSwapAbi, 
      provider
    );
  }
  
  // Normalize token addresses to lowercase for comparison
  const from = fromToken.toLowerCase();
  const to = toToken.toLowerCase();
  const prior = CONTRACT_ADDRESSES.priorToken.toLowerCase();
  const usdc = CONTRACT_ADDRESSES.tokens.USDC.toLowerCase();
  const usdt = CONTRACT_ADDRESSES.tokens.USDT.toLowerCase();
  
  // Determine which swap contract to use based on token pair
  if ((from === prior && to === usdc) || (from === usdc && to === prior)) {
    return new ethers.Contract(
      SWAP_CONTRACTS.PRIOR_USDC, 
      priorUsdcSwapAbi, 
      provider
    );
  } else if ((from === prior && to === usdt) || (from === usdt && to === prior)) {
    return new ethers.Contract(
      SWAP_CONTRACTS.PRIOR_USDT, 
      priorUsdtSwapAbi, 
      provider
    );
  } else if ((from === usdc && to === usdt) || (from === usdt && to === usdc)) {
    return new ethers.Contract(
      SWAP_CONTRACTS.USDC_USDT, 
      usdcUsdtSwapAbi, 
      provider
    );
  }
  
  // Default to PRIOR-USDC if no match found
  return new ethers.Contract(
    SWAP_CONTRACTS.PRIOR_USDC, 
    priorUsdcSwapAbi, 
    provider
  );
};

// Function to get the appropriate swap contract with signer based on token pair
export const getSwapContractWithSigner = async (fromToken?: string, toToken?: string, specificContractAddress?: string) => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  
  // Force wallet connection before getting signer
  try {
    console.log("Requesting accounts to ensure connection for swap contract");
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  } catch (error) {
    console.error("Error requesting accounts for swap contract:", error);
    throw new Error("Failed to connect to wallet. Please unlock your wallet and try again.");
  }
  
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  
  // If a specific contract address is provided, use that
  if (specificContractAddress) {
    // Determine which ABI to use based on the contract address
    if (specificContractAddress === SWAP_CONTRACTS.PRIOR_USDC) {
      return new ethers.Contract(specificContractAddress, priorUsdcSwapAbi, signer);
    } else if (specificContractAddress === SWAP_CONTRACTS.PRIOR_USDT) {
      return new ethers.Contract(specificContractAddress, priorUsdtSwapAbi, signer);
    } else if (specificContractAddress === SWAP_CONTRACTS.USDC_USDT) {
      return new ethers.Contract(specificContractAddress, usdcUsdtSwapAbi, signer);
    }
  }
  
  // If no tokens specified, default to PRIOR-USDC swap contract
  if (!fromToken || !toToken) {
    return new ethers.Contract(
      SWAP_CONTRACTS.PRIOR_USDC, 
      priorUsdcSwapAbi, 
      signer
    );
  }
  
  // Normalize token addresses to lowercase for comparison
  const from = fromToken.toLowerCase();
  const to = toToken.toLowerCase();
  const prior = CONTRACT_ADDRESSES.priorToken.toLowerCase();
  const usdc = CONTRACT_ADDRESSES.tokens.USDC.toLowerCase();
  const usdt = CONTRACT_ADDRESSES.tokens.USDT.toLowerCase();
  
  // Determine which swap contract to use based on token pair
  if ((from === prior && to === usdc) || (from === usdc && to === prior)) {
    return new ethers.Contract(
      SWAP_CONTRACTS.PRIOR_USDC, 
      priorUsdcSwapAbi, 
      signer
    );
  } else if ((from === prior && to === usdt) || (from === usdt && to === prior)) {
    return new ethers.Contract(
      SWAP_CONTRACTS.PRIOR_USDT, 
      priorUsdtSwapAbi, 
      signer
    );
  } else if ((from === usdc && to === usdt) || (from === usdt && to === usdc)) {
    return new ethers.Contract(
      SWAP_CONTRACTS.USDC_USDT, 
      usdcUsdtSwapAbi, 
      signer
    );
  }
  
  // Default to PRIOR-USDC if no match found
  return new ethers.Contract(
    SWAP_CONTRACTS.PRIOR_USDC, 
    priorUsdcSwapAbi, 
    signer
  );
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
  
  // Force wallet connection before getting signer
  try {
    console.log("Requesting accounts to ensure connection for faucet contract");
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  } catch (error) {
    console.error("Error requesting accounts for faucet contract:", error);
    throw new Error("Failed to connect to wallet. Please unlock your wallet and try again.");
  }
  
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
  
  for (const [symbol, address] of Object.entries(CONTRACT_ADDRESSES.tokens)) {
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
export const approveTokens = async (tokenAddress: string, spenderAddress: string, amount: string): Promise<boolean> => {
  try {
    const contract = await getTokenContractWithSigner(tokenAddress);
    const decimals = getTokenDecimalsFromAddress(tokenAddress);
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);
    
    // Use the provided spender address (which should be the swap contract address)
    // Approve the swap contract to spend the tokens
    const tx = await contract.approve(spenderAddress, parsedAmount);
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
  swapContractAddress?: string,
  minAmountOut?: string,
): Promise<any> => {
  try {
    console.log(`Attempting to swap ${amount} from ${fromTokenAddress} to ${toTokenAddress}`);
    console.log(`Using swap contract: ${swapContractAddress}`);
    
    // Get the appropriate swap contract based on the token pair or use the provided address
    const swapContract = swapContractAddress 
      ? await getSwapContractWithSigner(fromTokenAddress, toTokenAddress, swapContractAddress)
      : await getSwapContractWithSigner(fromTokenAddress, toTokenAddress);
      
    const fromSymbol = getTokenSymbol(fromTokenAddress);
    const toSymbol = getTokenSymbol(toTokenAddress);
    const decimals = getTokenDecimalsFromAddress(fromTokenAddress);
    
    // Make sure we're using a very small amount for testing due to limited liquidity
    let safeAmount = amount;
    if (parseFloat(amount) > 0.1 && fromSymbol === "PRIOR") {
      console.log("Amount too large for testnet, reducing to 0.01");
      safeAmount = "0.01";
    }
    
    const parsedAmount = ethers.utils.parseUnits(safeAmount, decimals);
    console.log(`Parsed amount for ${fromSymbol}: ${parsedAmount.toString()}`);
    
    let tx;
    
    try {
      // PRIOR/USDC Swap - most reliable pair
      if ((fromSymbol === "PRIOR" && toSymbol === "USDC")) {
        console.log("Executing PRIOR to USDC swap");
        tx = await swapContract.swapPriorToUsdc(parsedAmount);
      } else if ((fromSymbol === "USDC" && toSymbol === "PRIOR")) {
        console.log("Executing USDC to PRIOR swap");
        tx = await swapContract.swapUsdcToPrior(parsedAmount);
      } 
      // PRIOR/USDT Swap
      else if ((fromSymbol === "PRIOR" && toSymbol === "USDT")) {
        console.log("Executing PRIOR to USDT swap");
        tx = await swapContract.swapPriorToUsdt(parsedAmount);
      } else if ((fromSymbol === "USDT" && toSymbol === "PRIOR")) {
        console.log("Executing USDT to PRIOR swap");
        tx = await swapContract.swapUsdtToPrior(parsedAmount);
      }
      // USDC/USDT Swap
      else if ((fromSymbol === "USDC" && toSymbol === "USDT")) {
        console.log("Executing USDC to USDT swap");
        tx = await swapContract.swapUsdcToUsdt(parsedAmount);
      } else if ((fromSymbol === "USDT" && toSymbol === "USDC")) {
        console.log("Executing USDT to USDC swap");
        tx = await swapContract.swapUsdtToUsdc(parsedAmount);
      } else {
        throw new Error(`Swap pair not supported: ${fromSymbol} to ${toSymbol}`);
      }
      
      console.log("Transaction submitted, waiting for confirmation...");
      return tx.wait();
    } catch (error: any) { // Fixed type issue by using 'any' for error
      console.error("Swap execution error:", error);
      
      // Try again with an even smaller amount if we get a liquidity error
      if (error.message && error.message.includes("liquidity") && fromSymbol === "PRIOR") {
        console.log("Trying again with a very small amount due to liquidity constraint");
        const tinyAmount = "0.001";
        const tinyParsedAmount = ethers.utils.parseUnits(tinyAmount, decimals);
        
        if (fromSymbol === "PRIOR" && toSymbol === "USDC") {
          tx = await swapContract.swapPriorToUsdc(tinyParsedAmount);
        } else if (fromSymbol === "PRIOR" && toSymbol === "USDT") {
          tx = await swapContract.swapPriorToUsdt(tinyParsedAmount);
        } else {
          throw error;
        }
        
        return tx.wait();
      } else {
        throw error;
      }
    }
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
    // Updated rate: 1 PRIOR = 10 USDC
    return "10"; // Fixed rate for testnet
  } catch (error) {
    console.error("Error getting PRIOR to USDC rate:", error);
    return "10"; // Default rate if error
  }
};

// Get the exchange rate between PRIOR and USDT
export const getPriorToUSDTRate = async (): Promise<string> => {
  try {
    const swapContract = await getSwapContract();
    // Updated rate: 1 PRIOR = 10 USDT
    return "10"; // Fixed rate for testnet
  } catch (error) {
    console.error("Error getting PRIOR to USDT rate:", error);
    return "10"; // Default rate if error
  }
};

// Get the exchange rate between PRIOR and DAI
export const getPriorToDAIRate = async (): Promise<string> => {
  try {
    const swapContract = await getSwapContract();
    // Updated rate: 1 PRIOR = 10 DAI (same as USDC/USDT)
    return "10"; // Fixed rate for testnet
  } catch (error) {
    console.error("Error getting PRIOR to DAI rate:", error);
    return "10"; // Default rate if error
  }
};

// Get the exchange rate between PRIOR and WETH
export const getPriorToWETHRate = async (): Promise<string> => {
  try {
    const swapContract = await getSwapContract();
    // Keep the existing WETH rate
    return "0.0005"; // Fixed rate for testnet
  } catch (error) {
    console.error("Error getting PRIOR to WETH rate:", error);
    return "0.0005"; // Default rate if error
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
    
    // Get the appropriate swap contract based on the token pair
    const swapContract = await getSwapContract(fromTokenAddress, toTokenAddress);
    
    // Parse the input amount with the correct decimals
    const parsedAmountIn = ethers.utils.parseUnits(amountIn, fromDecimals);
    let outputAmount;
    
    try {
      // Call the appropriate calculation function based on the swap pair
      if (fromSymbol === "PRIOR" && toSymbol === "USDC") {
        outputAmount = await swapContract.calculatePriorToUsdc(parsedAmountIn);
      } else if (fromSymbol === "USDC" && toSymbol === "PRIOR") {
        outputAmount = await swapContract.calculateUsdcToPrior(parsedAmountIn);
      } else if (fromSymbol === "PRIOR" && toSymbol === "USDT") {
        outputAmount = await swapContract.calculatePriorToUsdt(parsedAmountIn);
      } else if (fromSymbol === "USDT" && toSymbol === "PRIOR") {
        outputAmount = await swapContract.calculateUsdtToPrior(parsedAmountIn);
      } else if (fromSymbol === "USDC" && toSymbol === "USDT") {
        outputAmount = await swapContract.calculateUsdcToUsdt(parsedAmountIn);
      } else if (fromSymbol === "USDT" && toSymbol === "USDC") {
        outputAmount = await swapContract.calculateUsdtToUsdc(parsedAmountIn);
      } else {
        throw new Error(`Swap calculation not supported for pair: ${fromSymbol}/${toSymbol}`);
      }
      
      // Format the output with the correct decimals
      return ethers.utils.formatUnits(outputAmount, toDecimals);
    } catch (error) {
      console.error("Error calculating swap amount directly from contract:", error);
      
      // Fallback to a fixed rate calculation if the contract call fails
      let rate = "0";
      
      if (fromSymbol === "PRIOR" && toSymbol === "USDC") {
        rate = "10"; // 1 PRIOR = 10 USDC
      } else if (fromSymbol === "PRIOR" && toSymbol === "USDT") {
        rate = "10"; // 1 PRIOR = 10 USDT
      } else if (fromSymbol === "USDC" && toSymbol === "PRIOR") {
        rate = "0.1"; // 1 USDC = 0.1 PRIOR
      } else if (fromSymbol === "USDT" && toSymbol === "PRIOR") {
        rate = "0.1"; // 1 USDT = 0.1 PRIOR
      } else if (fromSymbol === "USDC" && toSymbol === "USDT") {
        rate = "1"; // 1 USDC = 1 USDT
      } else if (fromSymbol === "USDT" && toSymbol === "USDC") {
        rate = "1"; // 1 USDT = 1 USDC
      }
      
      // Apply a 0.5% swap fee
      const amountOut = parseFloat(amountIn) * parseFloat(rate);
      const amountOutAfterFee = amountOut * 0.995; // 0.5% fee
      
      return amountOutAfterFee.toFixed(toDecimals);
    }
  } catch (error) {
    console.error("Error calculating swap output:", error);
    return "0";
  }
};