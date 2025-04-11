import { ethers } from 'ethers';
import { contractAddresses } from '@/lib/contracts';
import { approveTokens } from '@/contracts/services';

// Standard ERC20 ABI for approval and balanceOf functions
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// Swap contract ABI fragments for the different swap functions
const SWAP_ABI = [
  "function swapPriorToUsdc(uint256 priorAmount) public returns (uint256)",
  "function swapUsdcToPrior(uint256 usdcAmount) public returns (uint256)",
  "function swapPriorToUsdt(uint256 priorAmount) public returns (uint256)",
  "function swapUsdtToPrior(uint256 usdtAmount) public returns (uint256)",
  "function swapUsdcToUsdt(uint256 usdcAmount) public returns (uint256)",
  "function swapUsdtToUsdc(uint256 usdtAmount) public returns (uint256)"
];

// Helper function to ensure the contract addresses are correctly mapped
export function getSwapContractAddress(fromSymbol: string, toSymbol: string): string {
  if ((fromSymbol === "PRIOR" && toSymbol === "USDC") || (fromSymbol === "USDC" && toSymbol === "PRIOR")) {
    return contractAddresses.swapContracts.PRIOR_USDC;
  } else if ((fromSymbol === "PRIOR" && toSymbol === "USDT") || (fromSymbol === "USDT" && toSymbol === "PRIOR")) {
    return contractAddresses.swapContracts.PRIOR_USDT;
  } else if ((fromSymbol === "USDC" && toSymbol === "USDT") || (fromSymbol === "USDT" && toSymbol === "USDC")) {
    return contractAddresses.swapContracts.USDC_USDT;
  } else {
    throw new Error(`Unsupported swap pair: ${fromSymbol} -> ${toSymbol}`);
  }
}

// Helper function to get token decimals
export async function getTokenDecimals(tokenAddress: string): Promise<number> {
  try {
    if (!window.ethereum) {
      throw new Error("No ethereum provider found");
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const decimals = await tokenContract.decimals();
    return decimals;
  } catch (error) {
    console.error("Error getting token decimals:", error);
    // Default fallbacks based on token addresses
    if (tokenAddress.toLowerCase() === contractAddresses.priorToken.toLowerCase()) {
      return 18; // PRIOR decimals
    } else {
      return 6; // USDC/USDT decimals
    }
  }
}

// Helper function to perform token approvals securely
export async function approveTokenForSwap(
  tokenAddress: string,
  tokenSymbol: string,
  swapContractAddress: string,
  amount: string
): Promise<boolean> {
  try {
    console.log(`Approving ${tokenSymbol} tokens for swap contract...`);
    
    // For stablecoins, we need to make sure the approval works
    if (tokenSymbol === "USDC" || tokenSymbol === "USDT") {
      const decimals = await getTokenDecimals(tokenAddress);
      console.log(`Using decimals ${decimals} for ${tokenSymbol}`);
      
      // Parse amount with the correct decimals
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      
      // Add some buffer for approval (approve slightly more)
      const approvalAmount = parsedAmount.mul(120).div(100); // 120% of the amount
      
      if (!window.ethereum) {
        throw new Error("No ethereum provider found");
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      
      console.log(`Approving ${approvalAmount.toString()} tokens (with buffer) for ${swapContractAddress}`);
      
      // Send the actual approval transaction
      const tx = await tokenContract.approve(swapContractAddress, approvalAmount);
      const receipt = await tx.wait();
      
      if (receipt.status === 0) {
        throw new Error("Approval transaction failed");
      }
      
      console.log(`${tokenSymbol} tokens approved successfully!`);
      return true;
    } else {
      // For non-stablecoins like PRIOR, use the existing approveTokens function
      return await approveTokens(tokenAddress, swapContractAddress, amount);
    }
  } catch (error) {
    console.error(`Error approving ${tokenSymbol} tokens:`, error);
    return false;
  }
}

// Execute the actual swap transaction with the correct swap function
export async function executeSwap(
  fromTokenSymbol: string,
  toTokenSymbol: string,
  fromTokenAddress: string,
  amount: string,
  swapContractAddress: string
): Promise<ethers.providers.TransactionReceipt> {
  if (!window.ethereum) {
    throw new Error("No ethereum provider found");
  }
  
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signer = provider.getSigner();
    const swapContract = new ethers.Contract(swapContractAddress, SWAP_ABI, signer);
    
    // Get token decimals
    const decimals = await getTokenDecimals(fromTokenAddress);
    
    // Format amount with correct decimals
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);
    console.log(`Parsed amount for swap: ${parsedAmount.toString()}`);
    
    // Choose the correct swap function based on the token pair
    let tx;
    if (fromTokenSymbol === "PRIOR" && toTokenSymbol === "USDC") {
      console.log("Executing PRIOR to USDC swap");
      tx = await swapContract.swapPriorToUsdc(parsedAmount);
    } else if (fromTokenSymbol === "USDC" && toTokenSymbol === "PRIOR") {
      console.log("Executing USDC to PRIOR swap");
      tx = await swapContract.swapUsdcToPrior(parsedAmount);
    } else if (fromTokenSymbol === "PRIOR" && toTokenSymbol === "USDT") {
      console.log("Executing PRIOR to USDT swap");
      tx = await swapContract.swapPriorToUsdt(parsedAmount);
    } else if (fromTokenSymbol === "USDT" && toTokenSymbol === "PRIOR") {
      console.log("Executing USDT to PRIOR swap");
      tx = await swapContract.swapUsdtToPrior(parsedAmount);
    } else if (fromTokenSymbol === "USDC" && toTokenSymbol === "USDT") {
      console.log("Executing USDC to USDT swap");
      tx = await swapContract.swapUsdcToUsdt(parsedAmount);
    } else if (fromTokenSymbol === "USDT" && toTokenSymbol === "USDC") {
      console.log("Executing USDT to USDC swap");
      tx = await swapContract.swapUsdtToUsdc(parsedAmount);
    } else {
      throw new Error(`Swap pair not supported: ${fromTokenSymbol} to ${toTokenSymbol}`);
    }
    
    console.log("Swap transaction sent! Waiting for confirmation...");
    return await tx.wait();
  } catch (error) {
    console.error("Error executing swap:", error);
    throw error;
  }
}