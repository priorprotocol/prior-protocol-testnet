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

// Base Sepolia testnet contract addresses
export const contractAddresses = {
  // Prior Protocol token and swap contract addresses
  priorToken: "0xD4d41fd29d1557566B1e3729d63559DC9DA32C79", // Prior Token
  priorSwap: "0x7B1F06B1a10ec2CA699D69FC488b5CD2A45F4f43", // Prior Swap router
  mockTokens: {
    // Using actual Base Sepolia testnet token addresses
    USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
    USDT: "0x708374D87A11B3740610Dd1eCB1e6Ce38DeA0a98", // USDT on Base Sepolia
    DAI: "0x6Bb6F022104caF36F3a84900Cd46D32A1D6D2DF1", // DAI on Base Sepolia
    WETH: "0x4200000000000000000000000000000000000006"  // WETH on Base Sepolia
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
