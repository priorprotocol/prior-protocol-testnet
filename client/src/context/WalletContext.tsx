import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TokenInfo } from "@/types";
import { 
  getProvider, 
  switchToBaseSepoliaNetwork, 
  requestAccounts, 
  getAccount, 
  getChainId,
  formatTokenAmount,
  parseTokenAmount
} from "@/lib/web3";
import { 
  getTokenBalance as getTokenBalanceFromContract, 
  swapTokens, 
  contractAddresses,
  checkPriorPioneerNFT
} from "@/lib/contracts";

// Global wallet update function for compatibility with older code
// Create a custom event for wallet connection
export function notifyWalletChange(address: string | null) {
  try {
    const event = new CustomEvent('walletChanged', { 
      detail: { address } 
    });
    window.dispatchEvent(event);
    return true;
  } catch (error) {
    console.error("Error dispatching wallet event:", error);
    return false;
  }
}

// Legacy function maintained for backward compatibility
export function updateWalletAddressGlobally(address: string): boolean {
  try {
    // Also dispatch the custom event
    notifyWalletChange(address);
    
    // @ts-ignore - Access global debug function to update wallet address
    if (window.__setWalletAddress) {
      // @ts-ignore
      return window.__setWalletAddress(address);
    }
    return true;
  } catch (error) {
    console.error("Error updating wallet address globally:", error);
    return false;
  }
}

// Define the shape of our context
interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isWalletModalOpen: boolean;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  connectWithMetaMask: () => Promise<void>;
  connectWithCoinbaseWallet: () => Promise<void>;
  connectWithWalletConnect: () => Promise<void>;
  disconnectWallet: () => void;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  tokens: TokenInfo[];
  getTokenBalance: (symbol: string) => string;
  copyToClipboard: (text: string) => void;
  userId: number | undefined;
  sendSwapTransaction: (fromTokenAddress: string, toTokenAddress: string, fromAmount: string, toAmount: string, slippage: string) => Promise<boolean>;
}

// Create the context with a default value
const defaultContextValue: WalletContextType = {
  address: null,
  isConnected: false,
  isWalletModalOpen: false,
  chainId: null,
  connectWallet: async () => {},
  connectWithMetaMask: async () => {},
  connectWithCoinbaseWallet: async () => {},
  connectWithWalletConnect: async () => {},
  disconnectWallet: () => {},
  openWalletModal: () => {},
  closeWalletModal: () => {},
  tokens: [],
  getTokenBalance: () => "0.00",
  copyToClipboard: () => {},
  userId: undefined,
  sendSwapTransaction: async () => false,
};

// Create the context
const WalletContext = createContext<WalletContextType>(defaultContextValue);

// Hook to use the wallet context
export const useWallet = () => useContext(WalletContext);

// Props interface for the provider
interface WalletProviderProps {
  children: ReactNode;
}

// The actual provider component
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [address, setAddressInternal] = useState<string | null>(null);
  
  // Custom setter for address that also notifies other components
  const setAddress = (newAddress: string | null) => {
    setAddressInternal(newAddress);
    notifyWalletChange(newAddress);
  };
  const [chainId, setChainId] = useState<number | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  // Get tokens from the API
  const { data: tokens = [] } = useQuery<TokenInfo[]>({
    queryKey: ['/api/tokens'],
  });
  
  // Get user data when address is available
  const { data: userData } = useQuery<{id: number, address: string, lastClaim: string | null}>({
    queryKey: [`/api/users/${address}`],
    enabled: !!address,
  });
  
  const userId = userData?.id;
  
  const isConnected = !!address;
  
  // Initialize wallet connection on load
  useEffect(() => {
    let mounted = true;
    
    const initWallet = async () => {
      if (!mounted) return;
      
      // Clear any existing wallet state to prevent auto-connection
      localStorage.removeItem('walletState');
      
      // Setup event listeners only - no automatic connection on page load
      console.log("Wallet auto-connection disabled. User must manually connect.");
      
      // Check if window.ethereum exists safely, but don't automatically connect
      if (typeof window === 'undefined' || !window.ethereum) {
        console.log("No ethereum provider detected");
        return;
      }
      
      // No automatic connection on page load or refresh - user must explicitly connect
    };
    
    // Setup event listeners for wallet
    const setupListeners = () => {
      // Check if ethereum provider is available
      if (typeof window === 'undefined' || !window.ethereum) return;
      
      const handleAccountsChanged = (accounts: string[]) => {
        if (!mounted) return;
        
        if (accounts.length === 0) {
          setAddress(null);
          setChainId(null);
          setTokenBalances({});
          queryClient.clear();
        } else {
          setAddress(accounts[0]);
        }
      };
      
      const handleChainChanged = (chainIdHex: string) => {
        if (!mounted) return;
        
        try {
          const newChainId = parseInt(chainIdHex, 16);
          setChainId(newChainId);
          
          if (newChainId !== 84532) {
            toast({
              title: "Wrong Network",
              description: "Please switch to Base Sepolia Testnet",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Error handling chain change:", error);
        }
      };
      
      try {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      } catch (error) {
        console.error("Error setting up ethereum listeners:", error);
      }
      
      return () => {
        if (window.ethereum) {
          try {
            window.ethereum.removeAllListeners('accountsChanged');
            window.ethereum.removeAllListeners('chainChanged');
          } catch (error) {
            console.error("Error removing ethereum listeners:", error);
          }
        }
      };
    };
    
    // Initialize wallet state
    setTimeout(() => {
      initWallet();
      const cleanup = setupListeners();
      
      return () => {
        mounted = false;
        if (cleanup) cleanup();
      };
    }, 100); // Small delay to ensure DOM is ready
    
    return () => {
      mounted = false;
    };
  }, [toast]);
  
  // Create user when address changes
  useEffect(() => {
    const createUserIfNeeded = async () => {
      if (address) {
        try {
          await apiRequest('POST', '/api/users', { address });
        } catch (error) {
          console.error("Error creating user:", error);
        }
      }
    };
    
    createUserIfNeeded();
  }, [address]);
  
  // Allow direct access to set address for debugging
  useEffect(() => {
    // @ts-ignore
    window.__setWalletAddress = (addr: string) => {
      console.log("Setting wallet address manually:", addr);
      setAddress(addr);
      return true;
    };
    
    // Add event listener to automatically disconnect wallet on page refresh/close
    const handleUnload = () => {
      console.log("Page closing/refreshing - clearing wallet state");
      localStorage.removeItem('walletState');
      sessionStorage.removeItem('walletState');
    };
    
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      // @ts-ignore
      delete window.__setWalletAddress;
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);
  
  // Update token balances when address or tokens change
  useEffect(() => {
    let isMounted = true;
    
    // Memoize the token addresses to prevent re-runs if objects are recreated
    // but values are the same
    const tokenAddresses = tokens.map(t => t.address).join(',');
    
    const fetchBalances = async () => {
      if (!isMounted) return;
      
      if (!address || !tokens || tokens.length === 0) {
        if (isMounted) {
          setTokenBalances({}); // Clear balances when disconnected
        }
        return;
      }
      
      try {
        console.log("Fetching token balances for address:", address);
        // Create a copy of the balances to avoid direct state mutations
        const newBalances: Record<string, string> = {...tokenBalances};
        let hasChanges = false;
        
        for (const token of tokens) {
          if (!isMounted) return;
          
          try {
            const result = await getTokenBalanceFromContract(token.address, address);
            const formattedBalance = formatTokenAmount(result.balance.toString(), result.decimals);
            
            // Only update if the balance has actually changed to avoid re-renders
            if (newBalances[token.symbol] !== formattedBalance) {
              newBalances[token.symbol] = formattedBalance;
              hasChanges = true;
              console.log(`${token.symbol} balance updated: ${formattedBalance}`);
            }
          } catch (error) {
            console.error(`Error fetching balance for ${token.symbol}:`, error);
            if (newBalances[token.symbol] !== "0.00") {
              newBalances[token.symbol] = "0.00";
              hasChanges = true;
            }
          }
        }
        
        // Only update state if balances actually changed
        if (isMounted && hasChanges) {
          setTokenBalances({...newBalances});
        }
      } catch (error) {
        console.error("Error fetching token balances:", error);
      }
    };
    
    // Only run the effect if we have an address and tokens
    if (address && tokens.length > 0) {
      // Run once immediately
      fetchBalances();
      
      // Setup interval to update balances periodically
      const intervalId = window.setInterval(fetchBalances, 30000);
      
      return () => {
        isMounted = false;
        window.clearInterval(intervalId);
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [address, tokens, tokenBalances]);
  
  // Check for Prior Pioneer NFT ownership
  useEffect(() => {
    let isMounted = true;
    
    const checkForNFT = async () => {
      if (!address || !userId) return;
      
      try {
        const hasNFT = await checkPriorPioneerNFT(address);
        
        if (!isMounted) return;
        
        try {
          // Define a proper response type
          interface NFTBadgeResponse {
            awarded: boolean;
          }
          
          const response = await apiRequest<NFTBadgeResponse>(
            'POST', 
            `/api/users/${userId}/check-nft-badge`, 
            { hasNFT }
          );
          
          if (!isMounted) return;
          
          if (hasNFT && response?.awarded) {
            toast({
              title: "🎉 Prior Pioneer NFT Badge Unlocked!",
              description: "Congratulations! You've been awarded the Prior Pioneer badge for owning the NFT.",
              duration: 6000
            });
          }
        } catch (error) {
          console.error("Error with NFT badge API:", error);
        }
      } catch (error) {
        console.error("Error checking for Prior Pioneer NFT:", error);
      }
    };
    
    if (address && userId) {
      checkForNFT();
    }
    
    return () => {
      isMounted = false;
    };
  }, [address, userId, toast]);
  
  const connectWallet = async () => {
    try {
      // Just call connectWithMetaMask directly for now
      // This ensures the wallet connection works even if the modal has issues
      await connectWithMetaMask();
    } catch (error) {
      console.error("Error in connectWallet:", error);
      // Fallback to opening the modal if direct connection fails
      setIsWalletModalOpen(true);
    }
  };
  
  const connectWithMetaMask = async () => {
    try {
      if (!window.ethereum) {
        window.open('https://metamask.io/download.html', '_blank');
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask to connect your wallet",
          variant: "destructive"
        });
        return;
      }

      console.log("Attempting direct MetaMask connection...");
      
      // Request accounts directly from the provider
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }
      
      const account = accounts[0];
      console.log("Account connected:", account);
      
      // Set the connected account
      setAddress(account);
      
      // Save wallet state to localStorage
      localStorage.setItem('walletState', JSON.stringify({
        address: account,
        timestamp: Date.now()
      }));
      
      // Switch to Base Sepolia network
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${(84532).toString(16)}` }],
        });
      } catch (switchError: any) {
        // Handle adding the network if not already present
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${(84532).toString(16)}`,
                  chainName: "Base Sepolia",
                  nativeCurrency: {
                    name: "Sepolia Ether",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: ["https://sepolia.base.org"],
                  blockExplorerUrls: ["https://sepolia.basescan.org"],
                },
              ],
            });
          } catch (addError) {
            console.error("Error adding Base Sepolia network:", addError);
          }
        } else {
          console.error("Error switching network:", switchError);
        }
      }
      
      // Get the current chain ID
      try {
        const provider = getProvider();
        if (provider) {
          const network = await provider.getNetwork();
          setChainId(network.chainId);
        }
      } catch (chainError) {
        console.error("Error getting chain ID:", chainError);
      }
      
      closeWalletModal();
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${account.substring(0, 6)}...${account.substring(account.length - 4)}`,
      });
      
      return account;
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      });
      
      return null;
    }
  };
  
  const connectWithCoinbaseWallet = async () => {
    toast({
      title: "Coming Soon",
      description: "Coinbase Wallet integration will be available in the next update",
    });
  };
  
  const connectWithWalletConnect = async () => {
    toast({
      title: "Coming Soon",
      description: "WalletConnect integration will be available in the next update",
    });
  };
  
  const disconnectWallet = () => {
    // Clear React state
    setAddress(null);
    setChainId(null);
    setTokenBalances({});
    queryClient.clear();
    
    // Thoroughly clean up any stored wallet state
    localStorage.removeItem('walletState');
    sessionStorage.removeItem('walletState');
    
    // Ensure MetaMask doesn't reconnect on reload 
    // by notifying any listeners of the disconnect
    notifyWalletChange(null);
    
    console.log("Wallet completely disconnected");
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };
  
  const openWalletModal = () => {
    setIsWalletModalOpen(true);
  };
  
  const closeWalletModal = () => {
    setIsWalletModalOpen(false);
  };
  
  const getTokenBalance = (symbol: string) => {
    // If we don't have a balance for this token, return 0
    if (!tokenBalances[symbol]) return "0.00";
    
    // Special handling for PRIOR to properly format very small PRIOR amounts
    if (symbol === "PRIOR" && tokenBalances[symbol]) {
      // The PRIOR raw balance might be a very small number (e.g., 298619984 wei)
      // which is actually 0.000000000298619984 PRIOR in decimal form
      
      // Check if this looks like a small wei amount (small number of digits)
      const rawBalance = tokenBalances[symbol];
      if (rawBalance && rawBalance.length < 15 && parseFloat(rawBalance) > 0) {
        try {
          // This likely represents a small amount in wei
          const weiBalance = BigInt(rawBalance);
          // Convert from wei to PRIOR (divide by 10^18)
          const priorBalance = Number(weiBalance) / 1e18;
          
          // For tiny amounts, show more precision
          if (priorBalance < 0.0001) {
            return priorBalance.toFixed(10);
          }
          
          // For small but not tiny amounts, standard formatting
          if (priorBalance < 1) {
            return priorBalance.toFixed(4);
          }
          
          // For larger amounts, less precision
          return priorBalance.toFixed(2);
        } catch (error) {
          console.error("Error formatting small PRIOR balance:", error);
          // Fall back to regular formatting
        }
      }
    }
    
    // For other tokens or if the special handling didn't apply, return as is
    return tokenBalances[symbol];
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied to clipboard",
          description: "The address has been copied to your clipboard",
        });
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast({
          title: "Failed to copy",
          description: "Could not copy the address to clipboard",
          variant: "destructive"
        });
      }
    );
  };
  
  const sendSwapTransaction = async (
    fromTokenAddress: string,
    toTokenAddress: string,
    fromAmount: string,
    toAmount: string,
    slippage: string
  ): Promise<boolean> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }
    
    if (chainId !== 84532) {
      throw new Error("Please switch to Base Sepolia network");
    }
    
    try {
      const fromToken = tokens.find(t => t.address.toLowerCase() === fromTokenAddress.toLowerCase());
      const toToken = tokens.find(t => t.address.toLowerCase() === toTokenAddress.toLowerCase());
      
      if (!fromToken || !toToken) {
        throw new Error("Invalid token selection");
      }
      
      const fromDecimals = fromToken.address.toLowerCase() === contractAddresses.priorToken.toLowerCase() 
        ? 18 : fromToken.decimals;
        
      const parsedAmount = parseTokenAmount(fromAmount, fromDecimals);
      
      toast({
        title: "Processing Swap",
        description: `Swapping ${fromAmount} ${fromToken.symbol} to ${toToken.symbol}...`,
      });
      
      const txReceipt = await swapTokens(fromTokenAddress, toTokenAddress, parsedAmount, slippage);
      const txHash = txReceipt.transactionHash || txReceipt.hash;
      const blockNumber = txReceipt.blockNumber;
      
      const updatedBalances = {...tokenBalances};
      
      if (address) {
        try {
          const fromTokenContract = await getTokenBalanceFromContract(fromTokenAddress, address);
          const toTokenContract = await getTokenBalanceFromContract(toTokenAddress, address);
          
          updatedBalances[fromToken.symbol] = formatTokenAmount(
            fromTokenContract.balance.toString(), 
            fromTokenContract.decimals
          );
          
          updatedBalances[toToken.symbol] = formatTokenAmount(
            toTokenContract.balance.toString(), 
            toTokenContract.decimals
          );
          
          setTokenBalances(updatedBalances);
        } catch (error) {
          console.error("Error refreshing balances:", error);
        }
      }
      
      if (address) {
        try {
          // Record the swap in the user's history
          if (userId) {
            // Record the swap in the user's activity history
            await apiRequest('POST', `/api/users/${userId}/swaps`, { 
              txHash,
              fromToken: fromToken.symbol,
              toToken: toToken.symbol,
              fromAmount,
              toAmount,
              blockNumber
            });
          }
          
          // Record the swap in the transaction history
          await apiRequest('POST', '/api/transactions/swap', {
            address,
            txHash,
            fromToken: fromToken.symbol,
            toToken: toToken.symbol,
            fromAmount,
            toAmount,
            blockNumber
          });
          
          // Try to complete the swap quest if applicable
          if (userId) {
            try {
              const swapQuestId = 1;
              await apiRequest('POST', `/api/quests/${swapQuestId}/complete`, { address });
            } catch (questError) {
              console.error("Error completing swap quest:", questError);
            }
          }
        } catch (error) {
          console.error("Error recording swap:", error);
        }
      }
      
      toast({
        title: "Swap Successful",
        description: `Successfully swapped ${fromAmount} ${fromToken.symbol} to ${toToken.symbol}`,
      });
      
      return true;
    } catch (error: any) {
      console.error("Error swapping tokens:", error);
      
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to swap tokens",
        variant: "destructive"
      });
      
      return false; // Return false instead of throwing the error so Promise<boolean> is satisfied
    }
  };
  
  const contextValue: WalletContextType = {
    address,
    isConnected,
    isWalletModalOpen,
    chainId,
    connectWallet,
    connectWithMetaMask,
    connectWithCoinbaseWallet,
    connectWithWalletConnect,
    disconnectWallet,
    openWalletModal,
    closeWalletModal,
    tokens,
    getTokenBalance,
    copyToClipboard,
    userId,
    sendSwapTransaction
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Define window.ethereum for TypeScript
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (event: string) => void;
    };
  }
}