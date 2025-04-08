import { ethers } from "ethers";
import { getProvider, getSigner } from "./web3";

// Define token contract ABI - this is a minimal ERC20 ABI
const tokenAbi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// Define swap contract ABI - this would be the actual PriorSwap contract ABI
const swapAbi = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)",
  "function getAmountsIn(uint amountOut, address[] calldata path) view returns (uint[] memory amounts)"
];

// Dummy contract addresses (replace with actual contract addresses)
export const contractAddresses = {
  // Replace these with actual contract addresses when available
  priorToken: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
  priorSwap: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b",
  mockTokens: {
    USDC: "0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
    USDT: "0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    DAI: "0x4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
    WETH: "0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b"
  }
};

// Function to get token contract instance
export const getTokenContract = async (tokenAddress: string) => {
  const provider = getProvider();
  return new ethers.Contract(tokenAddress, tokenAbi, provider);
};

// Function to get token contract with signer
export const getTokenContractWithSigner = async (tokenAddress: string) => {
  const signer = await getSigner();
  return new ethers.Contract(tokenAddress, tokenAbi, signer);
};

// Function to get swap contract instance
export const getSwapContract = async () => {
  const provider = getProvider();
  return new ethers.Contract(contractAddresses.priorSwap, swapAbi, provider);
};

// Function to get swap contract with signer
export const getSwapContractWithSigner = async () => {
  const signer = await getSigner();
  return new ethers.Contract(contractAddresses.priorSwap, swapAbi, signer);
};

// Function to get token balance
export const getTokenBalance = async (tokenAddress: string, address: string) => {
  try {
    const tokenContract = await getTokenContract(tokenAddress);
    const balance = await tokenContract.balanceOf(address);
    const decimals = await tokenContract.decimals();
    return { balance, decimals };
  } catch (error) {
    console.error("Error getting token balance:", error);
    return { balance: ethers.parseUnits("0", 18), decimals: 18 };
  }
};

// Function to approve tokens for swap
export const approveTokens = async (tokenAddress: string, amount: string) => {
  try {
    const tokenContract = await getTokenContractWithSigner(tokenAddress);
    const tx = await tokenContract.approve(contractAddresses.priorSwap, amount);
    return await tx.wait();
  } catch (error) {
    console.error("Error approving tokens:", error);
    throw error;
  }
};

// Function to perform token swap
export const swapTokens = async (
  fromTokenAddress: string,
  toTokenAddress: string,
  amountIn: string,
  slippageTolerance: string
) => {
  try {
    // First approve the tokens
    await approveTokens(fromTokenAddress, amountIn);
    
    // Then perform the swap
    const swapContract = await getSwapContractWithSigner();
    const path = [fromTokenAddress, toTokenAddress];
    
    // Get the amounts out
    const amountsOut = await swapContract.getAmountsOut(amountIn, path);
    
    // Calculate minimum amount out with slippage
    const slippagePercent = parseFloat(slippageTolerance) / 100;
    const minAmountOut = amountsOut[1].mul(
      ethers.parseUnits((1 - slippagePercent).toString(), 18)
    ).div(ethers.parseUnits("1", 18));
    
    // Deadline 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    // Execute the swap
    const signer = await getSigner();
    const address = await signer.getAddress();
    
    const tx = await swapContract.swapExactTokensForTokens(
      amountIn,
      minAmountOut,
      path,
      address,
      deadline
    );
    
    return await tx.wait();
  } catch (error) {
    console.error("Error swapping tokens:", error);
    throw error;
  }
};
