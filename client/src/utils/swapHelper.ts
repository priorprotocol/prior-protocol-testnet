import { ethers } from 'ethers';
import { contractAddresses } from '@/lib/contracts';
import { approveTokens } from '@/contracts/services';

// Standard ERC20 ABI for approval, allowance and balanceOf functions
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// Swap contract ABI fragments for the different swap functions
const SWAP_ABI = [
  // Prior-USDC contract
  "function swapPriorToUsdc(uint256 priorAmount) external returns (uint256)",
  "function swapUsdcToPrior(uint256 usdcAmount) external returns (uint256)",
  "function calculatePriorToUsdc(uint256 priorAmount) external view returns (uint256)",
  "function calculateUsdcToPrior(uint256 usdcAmount) external view returns (uint256)",
  
  // Prior-USDT contract
  "function swapPriorToUsdt(uint256 priorAmount) external returns (uint256)",
  "function swapUsdtToPrior(uint256 usdtAmount) external returns (uint256)",
  "function calculatePriorToUsdt(uint256 priorAmount) external view returns (uint256)",
  "function calculateUsdtToPrior(uint256 usdtAmount) external view returns (uint256)",
  
  // USDC-USDT contract
  "function swapUsdcToUsdt(uint256 usdcAmount) external returns (uint256)",
  "function swapUsdtToUsdc(uint256 usdtAmount) external returns (uint256)",
  "function calculateUsdcToUsdt(uint256 usdcAmount) external pure returns (uint256)",
  "function calculateUsdtToUsdc(uint256 usdtAmount) external pure returns (uint256)"
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
    
    // Use a direct approval approach for all tokens to ensure consistency
    const decimals = await getTokenDecimals(tokenAddress);
    console.log(`Using decimals ${decimals} for ${tokenSymbol}`);
    
    // Parse amount with the correct decimals
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);
    
    // Add some buffer for approval (approve 200% of the amount to be safe)
    const approvalAmount = parsedAmount.mul(200).div(100);
    
    if (!window.ethereum) {
      throw new Error("No ethereum provider found");
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signer = provider.getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    
    // Check current allowance first
    const userAddress = await signer.getAddress();
    const currentAllowance = await tokenContract.allowance(userAddress, swapContractAddress);
    
    console.log(`Current allowance for ${tokenSymbol}: ${currentAllowance.toString()}`);
    console.log(`Requested amount: ${parsedAmount.toString()}`);
    
    // Only approve if the current allowance is less than what we need
    if (currentAllowance.lt(parsedAmount)) {
      console.log(`Approving ${approvalAmount.toString()} tokens for ${swapContractAddress}`);
      
      // For max safety, first reset allowance to 0 for some tokens that require it
      if (tokenSymbol === "USDC" || tokenSymbol === "USDT") {
        try {
          console.log(`Resetting ${tokenSymbol} allowance to 0 first...`);
          const resetTx = await tokenContract.approve(swapContractAddress, 0);
          await resetTx.wait();
          console.log("Allowance reset completed.");
        } catch (resetError) {
          console.error("Error resetting allowance:", resetError);
          // Continue anyway as some tokens don't require this step
        }
      }
      
      // Send the actual approval transaction
      const tx = await tokenContract.approve(swapContractAddress, approvalAmount);
      console.log("Approval transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      
      if (receipt.status === 0) {
        throw new Error("Approval transaction failed");
      }
      
      // Add a delay to ensure the blockchain state updates
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify the allowance increased
      const newAllowance = await tokenContract.allowance(userAddress, swapContractAddress);
      console.log(`New allowance: ${newAllowance.toString()}`);
      
      if (newAllowance.lt(parsedAmount)) {
        throw new Error(`Allowance verification failed for ${tokenSymbol}`);
      }
      
      console.log(`${tokenSymbol} tokens approved successfully!`);
    } else {
      console.log(`${tokenSymbol} already has sufficient allowance. Skipping approval.`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error approving ${tokenSymbol} tokens:`, error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
    }
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
    
    // Get token decimals - used for correctly parsing the input amount
    const decimals = await getTokenDecimals(fromTokenAddress);
    
    // Format amount with correct decimals
    // Important: We always need to parse the amount using its own token's decimals
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);
    
    console.log(`Executing swap: ${fromTokenSymbol} to ${toTokenSymbol}`);
    console.log(`Amount: ${amount} ${fromTokenSymbol} (parsed: ${parsedAmount.toString()})`);
    console.log(`Contract: ${swapContractAddress}`);
    
    // Choose the correct swap function based on the token pair
    let tx;
    if (fromTokenSymbol === "PRIOR" && toTokenSymbol === "USDC") {
      console.log("Calling swapPriorToUsdc with amount:", parsedAmount.toString());
      tx = await swapContract.swapPriorToUsdc(parsedAmount);
    } else if (fromTokenSymbol === "USDC" && toTokenSymbol === "PRIOR") {
      console.log("Calling swapUsdcToPrior with amount:", parsedAmount.toString());
      tx = await swapContract.swapUsdcToPrior(parsedAmount);
    } else if (fromTokenSymbol === "PRIOR" && toTokenSymbol === "USDT") {
      console.log("Calling swapPriorToUsdt with amount:", parsedAmount.toString());
      tx = await swapContract.swapPriorToUsdt(parsedAmount);
    } else if (fromTokenSymbol === "USDT" && toTokenSymbol === "PRIOR") {
      console.log("Calling swapUsdtToPrior with amount:", parsedAmount.toString());
      tx = await swapContract.swapUsdtToPrior(parsedAmount);
    } else if (fromTokenSymbol === "USDC" && toTokenSymbol === "USDT") {
      // For stable-to-stable swaps, get the USDC-USDT contract ABI
      console.log("Calling swapUsdcToUsdt with amount:", parsedAmount.toString());
      tx = await swapContract.swapUsdcToUsdt(parsedAmount);
    } else if (fromTokenSymbol === "USDT" && toTokenSymbol === "USDC") {
      console.log("Calling swapUsdtToUsdc with amount:", parsedAmount.toString());
      tx = await swapContract.swapUsdtToUsdc(parsedAmount);
    } else {
      throw new Error(`Swap pair not supported: ${fromTokenSymbol} to ${toTokenSymbol}`);
    }
    
    console.log("Swap transaction sent! Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Swap transaction confirmed:", receipt.transactionHash);
    return receipt;
  } catch (error: any) {
    console.error("Error executing swap:", error);
    // Log additional details for debugging
    if (error.reason) console.error("Error reason:", error.reason);
    if (error.code) console.error("Error code:", error.code);
    if (error.data) console.error("Error data:", error.data);
    if (error.message) console.error("Error message:", error.message);
    
    throw error;
  }
}