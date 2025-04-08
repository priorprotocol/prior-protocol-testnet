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
    const formatted = ethers.utils.formatUnits(amount, decimals);
    // Display up to 4 decimal places max
    return parseFloat(formatted).toLocaleString(undefined, {
      maximumFractionDigits: 4,
    });
  } catch (error) {
    console.error("Error formatting token amount:", error);
    return "0.00";
  }
};

// Function to parse token amount to wei
export const parseTokenAmount = (amount: string, decimals: number): string => {
  try {
    return ethers.utils.parseUnits(amount, decimals).toString();
  } catch (error) {
    console.error("Error parsing token amount:", error);
    return "0";
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
