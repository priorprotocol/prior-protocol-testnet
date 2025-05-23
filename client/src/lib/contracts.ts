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
  priorToken: "0xeFC91C5a51E8533282486FA2601dFfe0a0b16EDb", // PRIOR token
  
  // Single swapContracts object to store all token pair swap contracts
  swapContracts: {
    PRIOR_USDC: "0x8957e1988905311EE249e679a29fc9deCEd4D910",
    PRIOR_USDT: "", // Not used in new deployment
    USDC_USDT: ""   // Not used in new deployment
  },
  
  // Individual token addresses
  tokens: {
    USDC: "0xdB07b0b4E88D9D5A79A08E91fEE20Bb41f9989a2", // USDC with 6 decimals
    USDT: ""  // Not used in new deployment
  },
  
  // Faucet contract address
  priorFaucet: "0xa206dC56F1A56a03aEa0fCBB7c7A62b5bE1Fe419",
  
  // NFT contract address
  priorPioneerNFT: PRIOR_PIONEER_NFT_ADDRESS
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

// Function to get Swap contract instance for specific token pair
export const getSwapContract = async (fromToken: string = 'PRIOR', toToken: string = 'USDC') => {
  if (!window.ethereum) {
    throw new Error("Ethereum provider not found");
  }
  
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  
  // Determine which swap contract to use based on token pair
  let swapContractAddress: string;
  
  if ((fromToken === 'PRIOR' && toToken === 'USDC') || (fromToken === 'USDC' && toToken === 'PRIOR')) {
    swapContractAddress = contractAddresses.swapContracts.PRIOR_USDC;
  } else if ((fromToken === 'PRIOR' && toToken === 'USDT') || (fromToken === 'USDT' && toToken === 'PRIOR')) {
    swapContractAddress = contractAddresses.swapContracts.PRIOR_USDT;
  } else if ((fromToken === 'USDC' && toToken === 'USDT') || (fromToken === 'USDT' && toToken === 'USDC')) {
    swapContractAddress = contractAddresses.swapContracts.USDC_USDT;
  } else {
    throw new Error(`Unsupported token pair: ${fromToken}-${toToken}`);
  }
  
  return new ethers.Contract(swapContractAddress, swapAbi, provider);
};

// Function to get Swap contract instance with signer for specific token pair (for transactions)
export const getSwapContractWithSigner = async (fromToken: string = 'PRIOR', toToken: string = 'USDC') => {
  if (!window.ethereum) {
    throw new Error("Ethereum provider not found");
  }
  
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();
  
  // Determine which swap contract to use based on token pair
  let swapContractAddress: string;
  
  if ((fromToken === 'PRIOR' && toToken === 'USDC') || (fromToken === 'USDC' && toToken === 'PRIOR')) {
    swapContractAddress = contractAddresses.swapContracts.PRIOR_USDC;
  } else if ((fromToken === 'PRIOR' && toToken === 'USDT') || (fromToken === 'USDT' && toToken === 'PRIOR')) {
    swapContractAddress = contractAddresses.swapContracts.PRIOR_USDT;
  } else if ((fromToken === 'USDC' && toToken === 'USDT') || (fromToken === 'USDT' && toToken === 'USDC')) {
    swapContractAddress = contractAddresses.swapContracts.USDC_USDT;
  } else {
    throw new Error(`Unsupported token pair: ${fromToken}-${toToken}`);
  }
  
  return new ethers.Contract(swapContractAddress, swapAbi, signer);
};

// Get token symbol from address
export const getTokenSymbol = (tokenAddress: string): string => {
  const lowerCaseAddress = tokenAddress.toLowerCase();
  
  // Check if it's the PRIOR token
  if (lowerCaseAddress === contractAddresses.priorToken.toLowerCase()) {
    return "PRIOR";
  }
  
  // Check if it's one of the other tokens (USDC, USDT)
  for (const [symbol, address] of Object.entries(contractAddresses.tokens)) {
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
export const approveTokens = async (tokenAddress: string, amount: string, targetToken: string = 'USDC') => {
  try {
    // Get the token contract with signer
    const contract = await getTokenContractWithSigner(tokenAddress);
    const decimals = getTokenDecimalsFromAddress(tokenAddress);
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);
    
    // Determine the appropriate swap contract address based on token pair
    let spenderAddress: string;
    const fromSymbol = getTokenSymbol(tokenAddress);
    
    if ((fromSymbol === 'PRIOR' && targetToken === 'USDC') || (fromSymbol === 'USDC' && targetToken === 'PRIOR')) {
      spenderAddress = contractAddresses.swapContracts.PRIOR_USDC;
    } else if ((fromSymbol === 'PRIOR' && targetToken === 'USDT') || (fromSymbol === 'USDT' && targetToken === 'PRIOR')) {
      spenderAddress = contractAddresses.swapContracts.PRIOR_USDT;
    } else if ((fromSymbol === 'USDC' && targetToken === 'USDT') || (fromSymbol === 'USDT' && targetToken === 'USDC')) {
      spenderAddress = contractAddresses.swapContracts.USDC_USDT;
    } else {
      throw new Error(`Unsupported token pair for approval: ${fromSymbol}-${targetToken}`);
    }
    
    console.log(`Approving ${amount} ${fromSymbol} tokens for spender: ${spenderAddress}`);
    
    // Approve the appropriate swap contract to spend the tokens
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
) => {
  try {
    const fromSymbol = getTokenSymbol(fromTokenAddress);
    const toSymbol = getTokenSymbol(toTokenAddress);
    const decimals = getTokenDecimalsFromAddress(fromTokenAddress);
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);
    
    console.log(`Swapping ${amount} ${fromSymbol} to ${toSymbol}`);
    console.log(`Using parsed amount: ${parsedAmount.toString()} (${decimals} decimals)`);
    
    // Get the specific swap contract for this token pair
    const swapContract = await getSwapContractWithSigner(fromSymbol, toSymbol);
    
    let tx;
    
    // Handle each specific swap pair
    if (fromSymbol === "PRIOR" && toSymbol === "USDC") {
      console.log("Executing PRIOR -> USDC swap");
      tx = await swapContract.swapPriorForToken(parsedAmount);
    } 
    else if (fromSymbol === "USDC" && toSymbol === "PRIOR") {
      console.log("Executing USDC -> PRIOR swap");
      tx = await swapContract.swapTokenForPrior(parsedAmount);
    }
    else if (fromSymbol === "PRIOR" && toSymbol === "USDT") {
      console.log("Executing PRIOR -> USDT swap");
      tx = await swapContract.swapPriorForToken(parsedAmount);
    }
    else if (fromSymbol === "USDT" && toSymbol === "PRIOR") {
      console.log("Executing USDT -> PRIOR swap");
      tx = await swapContract.swapTokenForPrior(parsedAmount);
    }
    else if ((fromSymbol === "USDC" && toSymbol === "USDT") || (fromSymbol === "USDT" && toSymbol === "USDC")) {
      // For USDC/USDT swaps, the contract has specific functions
      if (fromSymbol === "USDC") {
        console.log("Executing USDC -> USDT swap");
        tx = await swapContract.swapUSDCForUSDT(parsedAmount);
      } else {
        console.log("Executing USDT -> USDC swap");
        tx = await swapContract.swapUSDTForUSDC(parsedAmount);
      }
    } 
    else {
      throw new Error(`Unsupported swap pair: ${fromSymbol}-${toSymbol}`);
    }
    
    console.log("Waiting for transaction confirmation...");
    await tx.wait();
    console.log("Swap transaction confirmed!");
    return true;
  } catch (error) {
    console.error("Error swapping tokens:", error);
    return false;
  }
};

// Function to claim tokens from faucet
export const claimFromFaucet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("Ethereum provider not found");
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signer = provider.getSigner();
    
    // Use the correct faucet address from our contractAddresses
    const faucetAddress = contractAddresses.priorFaucet;
    console.log(`Using faucet contract at: ${faucetAddress}`);
    
    const faucetContract = new ethers.Contract(faucetAddress, faucetAbi, signer);
    
    console.log("Sending claim transaction to faucet...");
    const tx = await faucetContract.claim();
    console.log("Waiting for faucet claim transaction to confirm...");
    await tx.wait();
    console.log("Faucet claim successful!");
    return true;
  } catch (error) {
    console.error("Error claiming from faucet:", error);
    return false;
  }
};

// Function to check if user can claim from faucet
export const getFaucetInfo = async (address: string) => {
  try {
    if (!window.ethereum) {
      throw new Error("Ethereum provider not found");
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    
    // Use the correct faucet address from our contractAddresses
    const faucetAddress = contractAddresses.priorFaucet;
    console.log(`Checking claim eligibility at faucet: ${faucetAddress}`);
    
    const faucetContract = new ethers.Contract(faucetAddress, faucetAbi, provider);
    
    // The checkClaim function returns the last claim timestamp
    const lastClaimTime = await faucetContract.checkClaim(address);
    console.log(`Last claim time for ${address}: ${lastClaimTime.toString()}`);
    
    const nextClaimTime = Number(lastClaimTime.toString()) + 24 * 60 * 60; // 24 hours in seconds
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    
    console.log(`Current time: ${currentTime}, Next claim time: ${nextClaimTime}`);
    const canClaim = currentTime > nextClaimTime;
    
    return {
      canClaim: canClaim,
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

// Get the exchange rate between PRIOR and USDC (1 PRIOR = 2 USDC)
export const getPriorToUSDCRate = async () => {
  try {
    const swapContract = await getSwapContract('PRIOR', 'USDC');
    
    // Since we're using fixed rates for the testnet: 1 PRIOR = 2 USDC
    // This assumes PRIOR has 18 decimals and USDC has 6 decimals
    // Convert to proper format for calculations - return the decimal multiplier
    
    // 1 PRIOR = 2 USDC, so multiply by 2
    return "2"; 
  } catch (error) {
    console.error("Error getting PRIOR to USDC rate:", error);
    // Default rate: 1 PRIOR = 2 USDC
    return "2"; 
  }
};

// Get the exchange rate between PRIOR and USDT (1 PRIOR = 2 USDT)
export const getPriorToUSDTRate = async () => {
  try {
    const swapContract = await getSwapContract('PRIOR', 'USDT');
    
    // Since we're using fixed rates for the testnet: 1 PRIOR = 2 USDT
    // This assumes PRIOR has 18 decimals and USDT has 6 decimals
    // Convert to proper format for calculations
    
    // 1 PRIOR = 2 USDT, so multiply by 2
    return "2";
  } catch (error) {
    console.error("Error getting PRIOR to USDT rate:", error);
    // Default rate: 1 PRIOR = 2 USDT
    return "2";
  }
};

// Get the exchange rate between USDC and USDT (1:1 ratio)
export const getUSDCToUSDTRate = async () => {
  try {
    const swapContract = await getSwapContract('USDC', 'USDT');
    
    // USDC and USDT have a 1:1 exchange rate
    return "1";
  } catch (error) {
    console.error("Error getting USDC to USDT rate:", error);
    return "1"; // Default 1:1 ratio
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
    
    console.log(`Calculating swap: ${amountIn} ${fromSymbol} to ${toSymbol}`);
    console.log(`From decimals: ${fromDecimals}, To decimals: ${toDecimals}`);
    
    // Get the appropriate rate based on the token pair
    let rate = "0";
    
    if (fromSymbol === "PRIOR" && toSymbol === "USDC") {
      // 1 PRIOR = 2 USDC
      rate = await getPriorToUSDCRate();
      console.log(`Using PRIOR to USDC rate: ${rate}`);
    } 
    else if (fromSymbol === "PRIOR" && toSymbol === "USDT") {
      // 1 PRIOR = 2 USDT
      rate = await getPriorToUSDTRate();
      console.log(`Using PRIOR to USDT rate: ${rate}`);
    } 
    else if (fromSymbol === "USDC" && toSymbol === "PRIOR") {
      // 2 USDC = 1 PRIOR (0.5 PRIOR per USDC)
      rate = (1 / parseFloat(await getPriorToUSDCRate())).toString();
      console.log(`Using USDC to PRIOR rate: ${rate}`);
    } 
    else if (fromSymbol === "USDT" && toSymbol === "PRIOR") {
      // 2 USDT = 1 PRIOR (0.5 PRIOR per USDT)
      rate = (1 / parseFloat(await getPriorToUSDTRate())).toString();
      console.log(`Using USDT to PRIOR rate: ${rate}`);
    }
    else if ((fromSymbol === "USDC" && toSymbol === "USDT") || (fromSymbol === "USDT" && toSymbol === "USDC")) {
      // USDC and USDT are 1:1
      rate = "1";
      console.log(`Using stablecoin 1:1 rate`);
    }
    else {
      throw new Error(`Unsupported token pair: ${fromSymbol}-${toSymbol}`);
    }
    
    // Get the swap fee (default 0.5% if not available from contract)
    const feePercentage = await getSwapFee();
    console.log(`Using fee percentage: ${feePercentage}%`);
    
    // Calculate the output amount
    const amountOut = parseFloat(amountIn) * parseFloat(rate);
    console.log(`Raw output amount: ${amountOut}`);
    
    // Apply the fee
    const amountOutAfterFee = amountOut * (1 - feePercentage / 100);
    console.log(`Output after fee: ${amountOutAfterFee}`);
    
    // Return with appropriate decimal precision
    return amountOutAfterFee.toString();
  } catch (error) {
    console.error("Error calculating swap output:", error);
    return "0";
  }
};