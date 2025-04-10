import { ethers } from 'ethers';
import { swapAbi } from './swapAbi';

// Define ERC20 contract ABI
const erc20Abi = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{ "name": "", "type": "string" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{ "name": "", "type": "string" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            { "name": "_to", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            { "name": "_spender", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            { "name": "_owner", "type": "address" },
            { "name": "_spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];

// The NFT ABI - simplified version for checking balance only
const nftAbi = [
    {
        "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// Define Faucet contract ABI
const faucetAbi = [
    {
        "inputs": [],
        "name": "claim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "checkClaim",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// Updated Prior Pioneer NFT contract address
export const PRIOR_PIONEER_NFT_ADDRESS = "0x2a45dfDbdCfcF72CBE835435eD54f4beE7d06D59";

export const contractAddresses = {
  // Real token addresses on Base Sepolia testnet
  priorToken: "0x15b5Cca71598A1e2f5C8050ef3431dCA49F8EcbD", // PRIOR token
  priorSwap: "0x4e659af0932de50379391794d4dad10f21b9235b", // PriorSwap - UPDATED
  mockTokens: {
    // Mock token addresses on Base Sepolia
    USDC: "0xb950C186B2f15D0D85416AC19A16D6F23fD586b7", // mUSDC with 6 decimals
    USDT: "0xeED9C99a850399F0C408616dc8F9dDCb948aeaA2", // mUSDT with 6 decimals
    DAI: "0x72f30eb1cE25523Ea2Fa63eDe9797481634E496B",  // mDAI with 6 decimals
    WETH: "0xc413B81c5fb4798b8e4c6053AADd383C4Dc3703B"  // mWETH with 18 decimals
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
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return new ethers.Contract(tokenAddress, erc20Abi, provider);
};

// Function to get token contract with signer (for transactions)
export const getTokenContractWithSigner = async (tokenAddress: string) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(tokenAddress, erc20Abi, signer);
};

// Function to get Swap contract instance
export const getSwapContract = async () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return new ethers.Contract(contractAddresses.priorSwap, swapAbi, provider);
};

// Function to get Swap contract instance with signer (for transactions)
export const getSwapContractWithSigner = async () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(contractAddresses.priorSwap, swapAbi, signer);
};

// Get token symbol from address
export const getTokenSymbol = (tokenAddress: string): string => {
  const lowerCaseAddress = tokenAddress.toLowerCase();
  if (lowerCaseAddress === contractAddresses.priorToken.toLowerCase()) {
    return "PRIOR";
  }
  
  for (const [symbol, address] of Object.entries(contractAddresses.mockTokens)) {
    if (lowerCaseAddress === address.toLowerCase()) {
      return symbol;
    }
  }
  
  return "Unknown";
};

// Get token decimals from address
export const getTokenDecimalsFromAddress = (tokenAddress: string): number => {
  const symbol = getTokenSymbol(tokenAddress);
  return tokenDecimals[symbol as keyof typeof tokenDecimals] || 18; // Default to 18 if not found
};

// Function to get token balance
export const getTokenBalance = async (tokenAddress: string, address: string) => {
  try {
    console.log(`Fetching token balance for address: ${address} and token: ${tokenAddress}`);
    const contract = await getTokenContract(tokenAddress);
    const symbol = getTokenSymbol(tokenAddress);
    console.log(`Token symbol: ${symbol}`);
    
    const balance = await contract.balanceOf(address);
    console.log(`Raw balance result for ${symbol}: ${balance.toString()}`);
    
    const decimals = tokenDecimals[symbol as keyof typeof tokenDecimals] || 18;
    console.log(`Using decimals: ${decimals} for ${symbol}`);
    
    return ethers.utils.formatUnits(balance, decimals);
  } catch (error) {
    console.error("Error getting token balance:", error);
    return "0.0";
  }
};

// Function to approve tokens for swap
export const approveTokens = async (tokenAddress: string, amount: string) => {
  try {
    const contract = await getTokenContractWithSigner(tokenAddress);
    const decimals = getTokenDecimalsFromAddress(tokenAddress);
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);
    
    // Approve the swap contract to spend the tokens
    const tx = await contract.approve(contractAddresses.priorSwap, parsedAmount);
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
) => {
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
    
    await tx.wait();
    return true;
  } catch (error) {
    console.error("Error swapping tokens:", error);
    return false;
  }
};

// Function to claim tokens from faucet
export const claimFromFaucet = async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const faucetAddress = "0x4ec7095749ecc40c9d33c28fA2FafaD1A4FadF3c"; // Replace with actual faucet address
    const faucetContract = new ethers.Contract(faucetAddress, faucetAbi, signer);
    
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
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const faucetAddress = "0x4ec7095749ecc40c9d33c28fA2FafaD1A4FadF3c"; // Replace with actual faucet address
    const faucetContract = new ethers.Contract(faucetAddress, faucetAbi, provider);
    
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
export const getPriorToUSDCRate = async () => {
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
export const getPriorToUSDTRate = async () => {
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
export const getPriorToDAIRate = async () => {
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
export const getPriorToWETHRate = async () => {
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
export const getSwapFee = async () => {
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
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const nftContract = new ethers.Contract(PRIOR_PIONEER_NFT_ADDRESS, nftAbi, provider);
    
    const balance = await nftContract.balanceOf(address);
    return balance.gt(0);
  } catch (error) {
    console.error("Error checking Pioneer NFT:", error);
    return false;
  }
};

// Function to calculate the expected output amount for a swap
export const calculateSwapOutput = async (fromTokenAddress: string, toTokenAddress: string, amountIn: string) => {
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