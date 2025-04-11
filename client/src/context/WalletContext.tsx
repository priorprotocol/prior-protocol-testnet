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
export function updateWalletAddressGlobally(address: string): boolean {
  try {
    // @ts-ignore - Access global debug function to update wallet address
    if (window.__setWalletAddress) {
      // @ts-ignore
      return window.__setWalletAddress(address);
    }
    return false;
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
  const [address, setAddress] = useState<string | null>(null);
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
      
      // Check if window.ethereum exists safely
      if (typeof window === 'undefined' || !window.ethereum) {
        console.log("No ethereum provider detected");
        return;
      }
      
      try {
        // Get already connected accounts
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        
        if (!mounted) return;
        
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          
          try {
            // Get the chain ID
            const provider = getProvider();
            if (provider) {
              const network = await provider.getNetwork();
              const chainId = network.chainId;
              
              if (!mounted) return;
              
              setChainId(chainId);
              
              if (chainId !== 84532) {
                toast({
                  title: "Wrong Network",
                  description: "Please switch to Base Sepolia Testnet",
                  variant: "destructive"
                });
              }
            }
          } catch (error) {
            console.error("Error getting chain ID:", error);
          }
        }
      } catch (error) {
        console.error("Error initializing wallet:", error);
      }
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
    
    return () => {
      // @ts-ignore
      delete window.__setWalletAddress;
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
      
      const account = await requestAccounts();
      if (!account) throw new Error("No account found");
      
      setAddress(account);
      
      await switchToBaseSepoliaNetwork();
      
      const currentChainId = await getChainId();
      setChainId(currentChainId);
      
      closeWalletModal();
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${account.substring(0, 6)}...${account.substring(account.length - 4)}`,
      });
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      });
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
    setAddress(null);
    setChainId(null);
    setTokenBalances({});
    queryClient.clear();
    
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
    return tokenBalances[symbol] || "0.00";
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