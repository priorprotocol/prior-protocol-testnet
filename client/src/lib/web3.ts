import { ethers } from "ethers";

// Define Base Sepolia network info
export const baseSepolia = {
  chainId: 84532,
  chainName: "Base Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

// Function to setup web3 provider
export const getProvider = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log("Not in browser environment");
      return null;
    }
    
    // Check if window.ethereum is available
    if (window.ethereum) {
      try {
        return new ethers.providers.Web3Provider(window.ethereum);
      } catch (error) {
        console.error("Error creating Web3Provider:", error);
      }
    }
    
    // Fallback to RPC provider
    try {
      return new ethers.providers.JsonRpcProvider(baseSepolia.rpcUrls[0]);
    } catch (error) {
      console.error("Error creating JsonRpcProvider:", error);
    }
    
    return null;
  } catch (error) {
    console.error("Error in getProvider:", error);
    return null;
  }
};

// Function to get signer
export const getSigner = async () => {
  const provider = getProvider();
  if (!provider) {
    console.error("Provider not available");
    return null;
  }
  try {
    return provider.getSigner();
  } catch (error) {
    console.error("Error getting signer:", error);
    return null;
  }
};

// Function to switch to Base Sepolia network
export const switchToBaseSepoliaNetwork = async () => {
  if (!window.ethereum) throw new Error("No crypto wallet found");
  
  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${baseSepolia.chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${baseSepolia.chainId.toString(16)}`,
              chainName: baseSepolia.chainName,
              nativeCurrency: baseSepolia.nativeCurrency,
              rpcUrls: baseSepolia.rpcUrls,
              blockExplorerUrls: baseSepolia.blockExplorerUrls,
            },
          ],
        });
      } catch (addError) {
        throw addError;
      }
    } else {
      throw switchError;
    }
  }
};

// Function to format token amount with proper decimals
export const formatTokenAmount = (amount: string, decimals: number): string => {
  try {
    console.log(`Formatting raw amount: ${amount} with ${decimals} decimals`);
    
    // Special handling for USDC and USDT (decimals = 6)
    if (decimals === 6) {
      // Critical fix for USDC/USDT: Detect if the amount is actually using 18 decimals
      // instead of 6 (caused by contract interaction issues)
      const value = ethers.BigNumber.from(amount);
      
      // Check if the value is abnormally large (likely using 18 decimals instead of 6)
      // For USDC/USDT, values over 1 trillion (10^12) are suspicious
      if (value.gt(ethers.BigNumber.from(10).pow(12).mul(1000))) {
        console.log(`Detected improperly scaled USDC/USDT amount: ${amount}`);
        
        // Adjust by dividing by 10^12 (difference between 18 and 6 decimals)
        const adjustedValue = value.div(ethers.BigNumber.from(10).pow(12));
        console.log(`Adjusted to: ${adjustedValue.toString()}`);
        
        // Now apply standard 6 decimal formatting to the corrected value
        const divisor = ethers.BigNumber.from(10).pow(6);
        const integerPart = adjustedValue.div(divisor);
        const fractionalPart = adjustedValue.mod(divisor);
        
        if (fractionalPart.isZero()) {
          console.log(`Final formatted amount: ${integerPart.toString()}`);
          return integerPart.toString();
        }
        
        const fractionalStr = fractionalPart.toString().padStart(6, '0');
        const result = `${integerPart}.${fractionalStr.replace(/0+$/, '')}`;
        console.log(`Final formatted amount: ${result}`);
        return result;
      }
      
      // Standard 6 decimal token formatting
      const divisor = ethers.BigNumber.from(10).pow(6);
      const integerPart = value.div(divisor);
      const fractionalPart = value.mod(divisor);
      
      if (fractionalPart.isZero()) {
        console.log(`Standard formatted amount: ${integerPart.toString()}`);
        return integerPart.toString();
      }
      
      const fractionalStr = fractionalPart.toString().padStart(6, '0');
      const result = `${integerPart}.${fractionalStr.replace(/0+$/, '')}`;
      console.log(`Standard formatted amount: ${result}`);
      return result;
    } else {
      // For PRIOR (18 decimals) and other tokens
      const formatted = ethers.utils.formatUnits(amount, decimals);
      const parsed = parseFloat(formatted);
      
      let result;
      if (Number.isInteger(parsed)) {
        result = parsed.toString();
      } else {
        result = parsed.toFixed(4);
      }
      
      console.log(`Formatted ${decimals}-decimal token: ${result}`);
      return result;
    }
  } catch (error) {
    console.error("Error formatting token amount:", error, "with amount:", amount);
    return "0.00";
  }
};

// Function to parse token amount to wei
export const parseTokenAmount = (amount: string, decimals: number): ethers.BigNumber => {
  try {
    console.log(`Parsing amount ${amount} with ${decimals} decimals`);
    
    // Clean the input amount, ensuring it has a valid format
    let cleanAmount = amount.trim();
    
    // Handle common format issues
    if (cleanAmount === '') {
      cleanAmount = '0';
    }
    
    // Make sure we have a valid decimal format for ethers (no trailing decimal point)
    if (cleanAmount.endsWith('.')) {
      cleanAmount = cleanAmount + '0';
    }
    
    // Ensure we have the right number of decimal places
    const parts = cleanAmount.split('.');
    if (parts.length > 1 && parts[1].length > decimals) {
      // Truncate to the number of decimals supported
      cleanAmount = parts[0] + '.' + parts[1].substring(0, decimals);
    }
    
    console.log(`Cleaned amount: ${cleanAmount}`);
    
    // Convert to ethers BigNumber
    const parsedAmount = ethers.utils.parseUnits(cleanAmount, decimals);
    console.log(`Parsed to BigNumber: ${parsedAmount.toString()}`);
    
    return parsedAmount;
  } catch (error) {
    console.error("Error parsing token amount:", error, "for amount:", amount, "with decimals:", decimals);
    
    // If we can't parse the input amount, generate a minimum amount
    try {
      // Use the smallest valid amount for this decimal precision
      const minAmount = '0.' + '0'.repeat(decimals - 1) + '1';
      console.log(`Using minimum valid amount: ${minAmount}`);
      return ethers.utils.parseUnits(minAmount, decimals);
    } catch (fallbackError) {
      console.error("Even minimum amount parsing failed:", fallbackError);
      // Absolute last resort: return 1 in the smallest unit
      return ethers.BigNumber.from('1');
    }
  }
};

// Function to get chain ID
export const getChainId = async (): Promise<number> => {
  try {
    const provider = getProvider();
    if (!provider) {
      console.error("Provider not available");
      return 0;
    }
    const network = await provider.getNetwork();
    return network.chainId;
  } catch (error) {
    console.error("Error getting chain ID:", error);
    return 0;
  }
};

// Function to get account
export const getAccount = async (): Promise<string | null> => {
  if (!window.ethereum) return null;
  
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    return accounts[0] || null;
  } catch (error) {
    console.error("Error getting accounts:", error);
    return null;
  }
};

// Function to request accounts
export const requestAccounts = async (): Promise<string | null> => {
  if (!window.ethereum) throw new Error("No crypto wallet found");
  
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    return accounts[0] || null;
  } catch (error) {
    console.error("Error requesting accounts:", error);
    throw error;
  }
};
