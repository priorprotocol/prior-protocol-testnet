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
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  return new ethers.Contract(tokenAddress, erc20Abi, provider);
};

// Function to get token contract with signer (for transactions)
export const getTokenContractWithSigner = async (tokenAddress: string) => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();
  return new ethers.Contract(tokenAddress, erc20Abi, signer);
};

// Function to get the appropriate swap contract based on token pair
export const getSwapContract = async (fromToken?: string, toToken?: string) => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  
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
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
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
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  return new ethers.Contract(CONTRACT_ADDRESSES.priorFaucet, faucetAbi, provider);
};

// Function to get Faucet contract with signer (for transactions)
export const getFaucetContractWithSigner = async () => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESSES.priorFaucet, faucetAbi, signer);
};

// Function to get NFT contract
export const getNftContract = async () => {
  if (!window.ethereum) throw new Error("No ethereum provider found");
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  return new ethers.Contract(CONTRACT_ADDRESSES.priorPioneerNFT, nftAbi, provider);
};

// Get token symbol from address
export const getTokenSymbol = (tokenAddress: string): string => {
  // Normalize the input address
  const lowerCaseAddress = tokenAddress.toLowerCase();
  
  // Check if the address is the PRIOR token
  if (lowerCaseAddress === CONTRACT_ADDRESSES.priorToken.toLowerCase()) {
    console.log(`Identified address ${tokenAddress} as PRIOR token`);
    return "PRIOR";
  }
  
  // Check if the address matches any of our known tokens
  for (const [symbol, address] of Object.entries(CONTRACT_ADDRESSES.tokens)) {
    const tokenLowerAddress = (typeof address === 'string') ? address.toLowerCase() : '';
    if (lowerCaseAddress === tokenLowerAddress) {
      console.log(`Identified address ${tokenAddress} as ${symbol} token`);
      return symbol;
    }
  }
  
  // Log a warning if no match is found
  console.warn(`Could not identify token symbol for address: ${tokenAddress}`);
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
    
    // Special handling for USDC/USDT with 6 decimals
    if (symbol === "USDC" || symbol === "USDT") {
      try {
        // Convert to string for manual handling
        const rawValue = balance.toString();
        
        // Check if this is likely an 18-decimal value (very large)
        // For USDC/USDT, if it's using 18 decimals instead of 6, the value would be extremely large
        if (rawValue.length > 12) {
          console.log(`Detected large ${symbol} value (probably using 18 decimals instead of 6):`, rawValue);
          
          // Manual fix: For a value like 3999999999999000000 (18 decimals), 
          // we need to convert it to 3.999999 (6 decimals)
          // Calculate the correct 6-decimal value
          const scaledValue = ethers.BigNumber.from(rawValue).div(ethers.BigNumber.from(10).pow(12));
          console.log(`Converted value (18 to 6 decimals): ${scaledValue.toString()}`);
          
          // Now format with 6 decimals
          const valueWithDecimal = ethers.utils.formatUnits(scaledValue, 6);
          console.log(`${symbol} balance updated:`, valueWithDecimal);
          return valueWithDecimal;
        }
        
        // For normal USDC/USDT values using the correct 6 decimals
        const valueWithDecimal = ethers.utils.formatUnits(rawValue, 6);
        console.log(`${symbol} balance updated:`, valueWithDecimal);
        return valueWithDecimal;
      } catch (error) {
        console.error("Error formatting stablecoin balance:", error);
        try {
          // Fallback: try to format with 6 decimals directly
          const formattedBalance = ethers.utils.formatUnits(balance, 6);
          console.log(`${symbol} balance updated (fallback):`, formattedBalance);
          return formattedBalance;
        } catch (fallbackError) {
          console.error("Fallback formatting also failed:", fallbackError);
          return "0.00";
        }
      }
    } 
    // For PRIOR with 18 decimals
    else {
      const formattedBalance = ethers.utils.formatUnits(balance, decimals);
      const numBalance = parseFloat(formattedBalance);
      const result = numBalance.toFixed(4);
      console.log(`${symbol} balance updated:`, result);
      return result;
    }
  } catch (error) {
    console.error(`Error fetching balance for ${tokenAddress}:`, error);
    return "0.00";
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
  amount: string, // This is a string representation of the token amount, needs parsing with correct decimals
  swapContractAddress?: string,
  minAmountOut?: string,
): Promise<ethers.providers.TransactionReceipt> => {
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
    
    // For stablecoin to stablecoin swaps, also use a reasonable amount
    if ((fromSymbol === "USDC" && toSymbol === "USDT") || 
        (fromSymbol === "USDT" && toSymbol === "USDC")) {
      // For stablecoin swap testing, allow slightly larger amounts since they have 1:1 ratio
      if (parseFloat(amount) > 10) {
        console.log("Amount too large for testnet stablecoin swap, reducing to 10");
        safeAmount = "10";
      }
    }
    
    const parsedAmount = ethers.utils.parseUnits(safeAmount, decimals);
    console.log(`Parsed amount for ${fromSymbol}: ${parsedAmount.toString()}`);
    
    let tx;
    
    try {
      // For ALL stablecoin swaps (either to PRIOR or between stablecoins),
      // we need to approve the tokens first
      if (fromSymbol === "USDC" || fromSymbol === "USDT") {
        console.log(`Approving ${fromSymbol} tokens for swap contract at ${swapContractAddress}...`);
        
        // Ensure we have a valid contract address for approval
        if (!swapContractAddress) {
          throw new Error("No swap contract address provided for token approval");
        }
        
        // We need to approve the tokens before swapping when the source is a stablecoin
        const success = await approveTokens(fromTokenAddress, swapContractAddress, safeAmount);
        
        if (!success) {
          throw new Error(`Failed to approve ${fromSymbol} tokens for swap`);
        }
        
        console.log(`${fromSymbol} tokens approved successfully!`);
        
        // Add a small delay after approval to ensure it's processed before the swap
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
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
      if (error.message && error.message.includes("liquidity")) {
        if (fromSymbol === "PRIOR") {
          console.log("Trying again with a very small amount due to liquidity constraint for PRIOR");
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
        } else if ((fromSymbol === "USDC" && toSymbol === "USDT") || (fromSymbol === "USDT" && toSymbol === "USDC")) {
          console.log("Trying again with a smaller amount due to liquidity constraint for stablecoin swap");
          const tinyAmount = "1"; // Use a very small amount (1 USDC/USDT)
          
          // Make sure to re-approve for the smaller amount if this is a stablecoin pair
          if (swapContractAddress) {
            console.log(`Re-approving ${fromSymbol} tokens for reduced amount: ${tinyAmount}`);
            const approvalSuccess = await approveTokens(fromTokenAddress, swapContractAddress, tinyAmount);
            if (!approvalSuccess) {
              throw new Error(`Failed to approve ${fromSymbol} tokens for reduced swap amount`);
            }
            
            // Add a small delay after approval
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          const tinyParsedAmount = ethers.utils.parseUnits(tinyAmount, decimals);
          
          if (fromSymbol === "USDC" && toSymbol === "USDT") {
            tx = await swapContract.swapUsdcToUsdt(tinyParsedAmount);
          } else if (fromSymbol === "USDT" && toSymbol === "USDC") {
            tx = await swapContract.swapUsdtToUsdc(tinyParsedAmount);
          }
          
          return tx.wait();
        } else {
          throw error;
        }
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
export const claimFromFaucet = async (userAddress?: string): Promise<boolean> => {
  try {
    console.log("Starting faucet claim process...");
    if (!window.ethereum) {
      console.error("No ethereum provider found");
      return false;
    }
    
    try {
      // Get the current connected address
      const provider = new ethers.providers.Web3Provider(window.ethereum as any); 
      const signer = provider.getSigner();
      const signerAddress = await signer.getAddress();
      
      // Always ensure we have a checksummed address
      const checksummedAddress = ethers.utils.getAddress(signerAddress);
      console.log("Checksummed signer address for faucet claim:", checksummedAddress);
      
      // Get the faucet contract with signer
      const faucetContract = await getFaucetContractWithSigner();
      console.log("Faucet contract address:", CONTRACT_ADDRESSES.priorFaucet);
      
      // Check if we can claim first using our checksummed address
      try {
        const canClaim = await faucetContract.canClaim(checksummedAddress);
        console.log("Can claim status:", canClaim);
        if (!canClaim) {
          console.log("Cannot claim yet according to contract");
          // Get the last claim time
          const lastClaimTime = await faucetContract.lastClaim(checksummedAddress);
          const waitTime = await faucetContract.WAIT_TIME();
          const nextClaimTime = Number(lastClaimTime.toString()) + Number(waitTime.toString());
          const currentTime = Math.floor(Date.now() / 1000);
          console.log(`Last claim: ${lastClaimTime}, Next claim: ${nextClaimTime}, Current time: ${currentTime}`);
          
          const waitTimeInHours = Math.ceil((nextClaimTime - currentTime) / 3600);
          throw new Error(`You must wait ${waitTimeInHours} hour(s) before claiming again.`);
        }
      } catch (checkError: any) {
        console.log("Error checking claim status:", checkError);
        
        // If this is the wait time error we just threw, propagate it
        if (checkError.message && checkError.message.includes("You must wait")) {
          throw checkError;
        }
        // For other errors, continue and let the claim function handle it internally
      }
      
      // Make the claim transaction - the claim function does not take parameters, 
      // it uses msg.sender internally in the contract
      console.log("Claiming with msg.sender...");
      const tx = await faucetContract.claim();
      console.log("Claim transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Claim transaction receipt:", receipt);
      
      // Verify the transaction was successful
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      
      console.log("Claim transaction confirmed in block:", receipt.blockNumber);
      
      return true;
    } catch (error) {
      console.error("Error in claimFromFaucet:", error);
      throw error; // Propagate the error to be handled by the caller
    }
  } catch (error) {
    console.error("Error claiming from faucet:", error);
    throw error; // Propagate the error to be handled by the caller
  }
};

// Function to check if user can claim from faucet
export const getFaucetInfo = async (address: string) => {
  try {
    // Ensure the address is checksummed
    const checksummedAddress = ethers.utils.getAddress(address);
    
    const faucetContract = await getFaucetContract();
    console.log("Checking faucet claim status for address:", checksummedAddress);
    
    // First, directly check if user can claim using the contract's canClaim function
    try {
      const canClaimNow = await faucetContract.canClaim(checksummedAddress);
      console.log("Can claim status from contract:", canClaimNow);
      
      if (canClaimNow) {
        return {
          canClaim: true,
          nextClaimTime: new Date(),
          timeRemaining: 0
        };
      }
    } catch (err) {
      console.error("Error calling canClaim:", err);
    }
    
    // Get last claim time using lastClaim mapping on the contract
    const lastClaimTime = await faucetContract.lastClaim(checksummedAddress);
    console.log("Last claim time:", lastClaimTime.toString());
    
    const waitTime = await faucetContract.WAIT_TIME();
    console.log("Wait time between claims:", waitTime.toString());
    
    const nextClaimTime = Number(lastClaimTime.toString()) + Number(waitTime.toString());
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
    
    console.log(`Calculating swap from ${fromSymbol} (${fromDecimals} decimals) to ${toSymbol} (${toDecimals} decimals)`);
    console.log(`Input amount: ${amountIn}`);
    
    // Get the appropriate swap contract based on the token pair
    const swapContract = await getSwapContract(fromTokenAddress, toTokenAddress);
    
    // Parse the input amount with the correct decimals
    const parsedAmountIn = ethers.utils.parseUnits(amountIn, fromDecimals);
    console.log(`Parsed input amount: ${parsedAmountIn.toString()}`);
    
    let outputAmount;
    
    try {
      // Call the appropriate calculation function based on the swap pair
      if (fromSymbol === "PRIOR" && toSymbol === "USDC") {
        outputAmount = await swapContract.calculatePriorToUsdc(parsedAmountIn);
        console.log(`Contract calculated PRIOR to USDC: ${outputAmount.toString()}`);
      } else if (fromSymbol === "USDC" && toSymbol === "PRIOR") {
        outputAmount = await swapContract.calculateUsdcToPrior(parsedAmountIn);
        console.log(`Contract calculated USDC to PRIOR: ${outputAmount.toString()}`);
      } else if (fromSymbol === "PRIOR" && toSymbol === "USDT") {
        outputAmount = await swapContract.calculatePriorToUsdt(parsedAmountIn);
        console.log(`Contract calculated PRIOR to USDT: ${outputAmount.toString()}`);
      } else if (fromSymbol === "USDT" && toSymbol === "PRIOR") {
        outputAmount = await swapContract.calculateUsdtToPrior(parsedAmountIn);
        console.log(`Contract calculated USDT to PRIOR: ${outputAmount.toString()}`);
      } else if (fromSymbol === "USDC" && toSymbol === "USDT") {
        outputAmount = await swapContract.calculateUsdcToUsdt(parsedAmountIn);
        console.log(`Contract calculated USDC to USDT: ${outputAmount.toString()}`);
      } else if (fromSymbol === "USDT" && toSymbol === "USDC") {
        outputAmount = await swapContract.calculateUsdtToUsdc(parsedAmountIn);
        console.log(`Contract calculated USDT to USDC: ${outputAmount.toString()}`);
      } else {
        throw new Error(`Swap calculation not supported for pair: ${fromSymbol}/${toSymbol}`);
      }
      
      // Format the output with the correct decimals
      const formattedOutput = ethers.utils.formatUnits(outputAmount, toDecimals);
      console.log(`Formatted output (${toDecimals} decimals): ${formattedOutput}`);
      return formattedOutput;
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
      
      console.log(`Using fixed rate calculation: 1 ${fromSymbol} = ${rate} ${toSymbol}`);
      
      // Apply a 0.5% swap fee
      const amountOut = parseFloat(amountIn) * parseFloat(rate);
      const amountOutAfterFee = amountOut * 0.995; // 0.5% fee
      
      // For stablecoins with 6 decimals, we need to return the correct decimal format
      if ((toSymbol === "USDC" || toSymbol === "USDT") && toDecimals === 6) {
        const formatted = amountOutAfterFee.toFixed(6);
        console.log(`Fixed rate calculation result: ${formatted} (6 decimals)`);
        return formatted;
      }
      
      // For other tokens, use the default formatting
      const formatted = amountOutAfterFee.toFixed(4);
      console.log(`Fixed rate calculation result: ${formatted} (default format)`);
      return formatted;
    }
  } catch (error) {
    console.error("Error calculating swap output:", error);
    return "0";
  }
};