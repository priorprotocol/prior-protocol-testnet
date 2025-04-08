import { ethers } from "ethers";
import { getProvider, getSigner } from "./web3";

// Define token contract ABI - full PRIOR token ABI
const priorTokenAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimFromFaucet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getFaucetInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "lastClaim",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalClaimed",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Define standard ERC20 token ABI for other tokens
const tokenAbi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// Define PriorSwap contract ABI - full ABI for the actual PriorSwap contract
const swapAbi = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "priorAmount",
        "type": "uint256"
      }
    ],
    "name": "swapPriorForUSDC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "priorAmount",
        "type": "uint256"
      }
    ],
    "name": "swapPriorForUSDT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "priorAmount",
        "type": "uint256"
      }
    ],
    "name": "swapPriorForDAI",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "priorAmount",
        "type": "uint256"
      }
    ],
    "name": "swapPriorForWETH",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PRIOR_TO_USDC_RATE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PRIOR_TO_USDT_RATE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PRIOR_TO_DAI_RATE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PRIOR_TO_WETH_RATE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "FEE_BASIS_POINTS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Base Sepolia testnet contract addresses
// Prior Pioneer NFT contract address
export const PRIOR_PIONEER_NFT_ADDRESS = "0x2a45dfDbdCfcF72CBE835435eD54f4beE7d06D59";

export const contractAddresses = {
  // Prior Protocol token and swap contract addresses
  priorToken: "0x15b5Cca71598A1e2f5C8050ef3431dCA49F8EcbD", // Prior Token
  priorSwap: "0x1e09f076824fFD47eC47E94C0dB8F5702Fd5ef9e", // Prior Swap router
  mockTokens: {
    // Actual mock token addresses on Base Sepolia testnet
    USDC: "0x0C6BAA4B8092B29F6B370e06BdfE67434680E062", // mUSDC on Base Sepolia
    USDT: "0xdaDcC45A00fe893df95488622fA2B64BfFc5E0bf", // mUSDT on Base Sepolia
    DAI: "0x72f30eb1cE25523Ea2Fa63eDe9797481634E496B",  // mDAI on Base Sepolia
    WETH: "0xc413B81c5fb4798b8e4c6053AADd383C4Dc3703B"  // mWETH on Base Sepolia
  }
};

// Token decimals
export const tokenDecimals = {
  PRIOR: 18,
  USDC: 6,
  USDT: 6,
  DAI: 6,
  WETH: 18
};

// Token symbols as they appear on-chain
export const tokenSymbols = {
  USDC: "mUSDC",
  USDT: "mUSDT",
  DAI: "mDAI",
  WETH: "mWETH"
};

// Function to get token contract instance
export const getTokenContract = async (tokenAddress: string) => {
  const provider = getProvider();
  // Use the PRIOR token ABI for the PRIOR token, otherwise use the standard ERC20 ABI
  const abi = tokenAddress.toLowerCase() === contractAddresses.priorToken.toLowerCase() ? priorTokenAbi : tokenAbi;
  return new ethers.Contract(tokenAddress, abi, provider);
};

// Function to get token contract with signer
export const getTokenContractWithSigner = async (tokenAddress: string) => {
  const signer = await getSigner();
  // Use the PRIOR token ABI for the PRIOR token, otherwise use the standard ERC20 ABI
  const abi = tokenAddress.toLowerCase() === contractAddresses.priorToken.toLowerCase() ? priorTokenAbi : tokenAbi;
  return new ethers.Contract(tokenAddress, abi, signer);
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

// Helper function to get token symbol
export const getTokenSymbol = (tokenAddress: string): string => {
  if (tokenAddress.toLowerCase() === contractAddresses.priorToken.toLowerCase()) {
    return "PRIOR";
  } else if (tokenAddress.toLowerCase() === contractAddresses.mockTokens.USDC.toLowerCase()) {
    return tokenSymbols.USDC;
  } else if (tokenAddress.toLowerCase() === contractAddresses.mockTokens.USDT.toLowerCase()) {
    return tokenSymbols.USDT;
  } else if (tokenAddress.toLowerCase() === contractAddresses.mockTokens.DAI.toLowerCase()) {
    return tokenSymbols.DAI;
  } else if (tokenAddress.toLowerCase() === contractAddresses.mockTokens.WETH.toLowerCase()) {
    return tokenSymbols.WETH;
  }
  return "UNKNOWN";
};

// Helper function to get token decimals
export const getTokenDecimalsFromAddress = (tokenAddress: string): number => {
  if (tokenAddress.toLowerCase() === contractAddresses.priorToken.toLowerCase()) {
    return tokenDecimals.PRIOR;
  } else if (tokenAddress.toLowerCase() === contractAddresses.mockTokens.USDC.toLowerCase()) {
    return tokenDecimals.USDC;
  } else if (tokenAddress.toLowerCase() === contractAddresses.mockTokens.USDT.toLowerCase()) {
    return tokenDecimals.USDT;
  } else if (tokenAddress.toLowerCase() === contractAddresses.mockTokens.DAI.toLowerCase()) {
    return tokenDecimals.DAI;
  } else if (tokenAddress.toLowerCase() === contractAddresses.mockTokens.WETH.toLowerCase()) {
    return tokenDecimals.WETH;
  }
  return 18; // Default for unknown tokens
};

// Function to get token balance
export const getTokenBalance = async (tokenAddress: string, address: string) => {
  try {
    const tokenContract = await getTokenContract(tokenAddress);
    const balance = await tokenContract.balanceOf(address);
    
    // Get token decimals using the helper function
    let decimals = getTokenDecimalsFromAddress(tokenAddress);
    
    // If it's an unknown token, try to get decimals from the contract
    if (decimals === 18 && getTokenSymbol(tokenAddress) === "UNKNOWN") {
      try {
        decimals = await tokenContract.decimals();
      } catch (error) {
        console.error("Error getting token decimals:", error);
      }
    }
    
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
    // Only PRIOR token can be swapped in this contract
    if (fromTokenAddress.toLowerCase() !== contractAddresses.priorToken.toLowerCase()) {
      throw new Error("Only PRIOR token can be swapped in this contract");
    }
    
    // First approve the tokens
    await approveTokens(fromTokenAddress, amountIn);
    
    // Get swap contract with signer
    const swapContract = await getSwapContractWithSigner();
    
    // Determine which swap function to call based on the destination token
    let tx;
    
    if (toTokenAddress.toLowerCase() === contractAddresses.mockTokens.USDC.toLowerCase()) {
      tx = await swapContract.swapPriorForUSDC(amountIn);
    } else if (toTokenAddress.toLowerCase() === contractAddresses.mockTokens.USDT.toLowerCase()) {
      tx = await swapContract.swapPriorForUSDT(amountIn);
    } else if (toTokenAddress.toLowerCase() === contractAddresses.mockTokens.DAI.toLowerCase()) {
      tx = await swapContract.swapPriorForDAI(amountIn);
    } else if (toTokenAddress.toLowerCase() === contractAddresses.mockTokens.WETH.toLowerCase()) {
      tx = await swapContract.swapPriorForWETH(amountIn);
    } else {
      throw new Error("Unsupported token pair for swap");
    }
    
    return await tx.wait();
  } catch (error) {
    console.error("Error swapping tokens:", error);
    throw error;
  }
};

// Function to claim tokens from the faucet
export const claimFromFaucet = async () => {
  try {
    const tokenContract = await getTokenContractWithSigner(contractAddresses.priorToken);
    const tx = await tokenContract.claimFromFaucet();
    return await tx.wait();
  } catch (error) {
    console.error("Error claiming from faucet:", error);
    throw error;
  }
};

// Function to get faucet info for a user
export const getFaucetInfo = async (address: string) => {
  try {
    const tokenContract = await getTokenContract(contractAddresses.priorToken);
    const [lastClaim, totalClaimed] = await tokenContract.getFaucetInfo(address);
    return { lastClaim, totalClaimed };
  } catch (error) {
    console.error("Error getting faucet info:", error);
    throw error;
  }
};

// Function to get swap rate for PRIOR to USDC
export const getPriorToUSDCRate = async () => {
  try {
    const swapContract = await getSwapContract();
    const rate = await swapContract.PRIOR_TO_USDC_RATE();
    return rate;
  } catch (error) {
    console.error("Error getting PRIOR to USDC rate:", error);
    throw error;
  }
};

// Function to get swap rate for PRIOR to USDT
export const getPriorToUSDTRate = async () => {
  try {
    const swapContract = await getSwapContract();
    const rate = await swapContract.PRIOR_TO_USDT_RATE();
    return rate;
  } catch (error) {
    console.error("Error getting PRIOR to USDT rate:", error);
    throw error;
  }
};

// Function to get swap rate for PRIOR to DAI
export const getPriorToDAIRate = async () => {
  try {
    const swapContract = await getSwapContract();
    const rate = await swapContract.PRIOR_TO_DAI_RATE();
    return rate;
  } catch (error) {
    console.error("Error getting PRIOR to DAI rate:", error);
    throw error;
  }
};

// Function to get swap rate for PRIOR to WETH
export const getPriorToWETHRate = async () => {
  try {
    const swapContract = await getSwapContract();
    const rate = await swapContract.PRIOR_TO_WETH_RATE();
    return rate;
  } catch (error) {
    console.error("Error getting PRIOR to WETH rate:", error);
    throw error;
  }
};

// Function to get swap fee
export const getSwapFee = async () => {
  try {
    const swapContract = await getSwapContract();
    const feeBasisPoints = await swapContract.FEE_BASIS_POINTS();
    return feeBasisPoints;
  } catch (error) {
    console.error("Error getting swap fee:", error);
    throw error;
  }
};

// Helper function to calculate output amounts for swap
// Function to check if a wallet address owns a Prior Pioneer NFT
export const checkPriorPioneerNFT = async (address: string): Promise<boolean> => {
  try {
    const nftAbi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
    ];
    
    const provider = getProvider();
    const nftContract = new ethers.Contract(PRIOR_PIONEER_NFT_ADDRESS, nftAbi, provider);
    
    // Check NFT balance
    const balance = await nftContract.balanceOf(address);
    return balance > 0;
  } catch (error) {
    console.error("Error checking Prior Pioneer NFT ownership:", error);
    return false;
  }
};

export const calculateSwapOutput = async (fromTokenAddress: string, toTokenAddress: string, amountIn: string) => {
  try {
    if (fromTokenAddress.toLowerCase() !== contractAddresses.priorToken.toLowerCase()) {
      throw new Error("Only PRIOR token can be swapped in this contract");
    }
    
    let rate;
    if (toTokenAddress.toLowerCase() === contractAddresses.mockTokens.USDC.toLowerCase()) {
      rate = await getPriorToUSDCRate();
    } else if (toTokenAddress.toLowerCase() === contractAddresses.mockTokens.USDT.toLowerCase()) {
      rate = await getPriorToUSDTRate();
    } else if (toTokenAddress.toLowerCase() === contractAddresses.mockTokens.DAI.toLowerCase()) {
      rate = await getPriorToDAIRate();
    } else if (toTokenAddress.toLowerCase() === contractAddresses.mockTokens.WETH.toLowerCase()) {
      rate = await getPriorToWETHRate();
    } else {
      throw new Error("Unsupported token pair for swap");
    }
    
    const feeBasisPoints = await getSwapFee();
    
    // Determine the destination token decimals
    let toTokenDecimals = 18;
    if (toTokenAddress.toLowerCase() === contractAddresses.mockTokens.USDC.toLowerCase()) {
      toTokenDecimals = tokenDecimals.USDC;
    } else if (toTokenAddress.toLowerCase() === contractAddresses.mockTokens.USDT.toLowerCase()) {
      toTokenDecimals = tokenDecimals.USDT;
    } else if (toTokenAddress.toLowerCase() === contractAddresses.mockTokens.DAI.toLowerCase()) {
      toTokenDecimals = tokenDecimals.DAI;
    } else if (toTokenAddress.toLowerCase() === contractAddresses.mockTokens.WETH.toLowerCase()) {
      toTokenDecimals = tokenDecimals.WETH;
    }
    
    // Convert amount to BigInt for calculations using PRIOR token decimals (18)
    const amountBigNumber = ethers.parseUnits(amountIn, tokenDecimals.PRIOR);
    
    // Calculate raw amount (PRIOR / rate)
    // With ethers v6, we need to handle BigInt operations
    const rawAmount = amountBigNumber * BigInt(1000000) / rate;
    
    // Apply fee (amount - (amount * fee / 10000))
    const feeAmount = (rawAmount * BigInt(feeBasisPoints)) / BigInt(10000);
    const amountOut = rawAmount - feeAmount;
    
    return {
      amountIn: amountBigNumber,
      amountOut,
      rate,
      fee: feeBasisPoints,
      fromDecimals: tokenDecimals.PRIOR,
      toDecimals: toTokenDecimals
    };
  } catch (error) {
    console.error("Error calculating swap output:", error);
    throw error;
  }
};
