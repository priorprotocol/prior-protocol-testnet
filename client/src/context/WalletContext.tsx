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

// Interface for the wallet context
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

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Global function reference that can be accessed from anywhere
export let globalSetAddress: ((address: string) => void) | null = null;

export const updateWalletAddressGlobally = (address: string) => {
  if (globalSetAddress) {
    console.log("Updating wallet address globally:", address);
    globalSetAddress(address);
    return true;
  }
  console.log("No wallet update callback available");
  return false;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    console.log("Wallet context not available yet");
    // Return a default context with empty functions instead of throwing an error
    return {
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
      getTokenBalance: (symbol: string) => "0",
      copyToClipboard: (text: string) => {},
      userId: undefined,
      sendSwapTransaction: async () => false,
    } as WalletContextType;
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  // Store the address setter in the global variable for external access
  useEffect(() => {
    globalSetAddress = (newAddress: string) => {
      console.log("Global address setter called with:", newAddress);
      setAddress(newAddress);
    };
    
    return () => {
      globalSetAddress = null;
    };
  }, []);
  
  // Get tokens from the API
  const { data: tokens = [] } = useQuery<TokenInfo[]>({
    queryKey: ['/api/tokens'],
    staleTime: 60 * 1000, // Cache for 1 minute
  });
  
  // Get user data when address is available
  const { data: userData } = useQuery<{id: number, address: string, lastClaim: string | null}>({
    queryKey: [`/api/users/${address}`],
    enabled: !!address,
  });
  
  const userId = userData?.id;
  
  const isConnected = !!address;
  
  // Initialize wallet connection on load - only once
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
          console.log("Auto-connected to account:", accounts[0]);
          setAddress(accounts[0]);
          
          try {
            // Get the chain ID
            const provider = getProvider();
            if (provider) {
              const network = await provider.getNetwork();
              setChainId(network.chainId);
              
              // Check if we're on Base Sepolia
              if (network.chainId !== 84532) {
                toast({
                  title: "Wrong Network",
                  description: "Please switch to Base Sepolia Testnet",
                  variant: "destructive"
                });
              }
            }
          } catch (error) {
            console.error("Error getting network:", error);
          }
        } else {
          console.log("No connected accounts found on init");
        }
      } catch (error) {
        console.error("Error initializing wallet:", error);
      }
    };
    
    initWallet();
    
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array means this runs once
  
  // Setup event listeners for wallet - separate effect to avoid recreating
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.log("No ethereum provider available for event setup");
      return;
    }
    
    const handleAccountsChanged = (accounts: string[]) => {
      console.log("Accounts changed:", accounts);
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
      try {
        const newChainId = parseInt(chainIdHex, 16);
        console.log("Chain changed:", newChainId);
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
      // Remove any existing listeners first to avoid duplicates
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
      
      // Add new listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      console.log("Ethereum event listeners set up");
    } catch (error) {
      console.error("Error setting up ethereum listeners:", error);
    }
    
    return () => {
      if (window.ethereum) {
        try {
          window.ethereum.removeAllListeners('accountsChanged');
          window.ethereum.removeAllListeners('chainChanged');
          console.log("Ethereum event listeners removed");
        } catch (error) {
          console.error("Error removing ethereum listeners:", error);
        }
      }
    };
  }, [toast]); // Only depends on toast since it's used in the handler
  
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
    
    const fetchBalances = async () => {
      if (!address || !tokens || tokens.length === 0) {
        return;
      }
      
      try {
        console.log("Fetching token balances for address:", address);
        const balances: Record<string, string> = {};
        
        for (const token of tokens) {
          try {
            const result = await getTokenBalanceFromContract(token.address, address);
            balances[token.symbol] = formatTokenAmount(result.balance.toString(), result.decimals);
          } catch (error) {
            console.error(`Error fetching balance for ${token.symbol}:`, error);
            balances[token.symbol] = "0.00";
          }
        }
        
        if (isMounted) {
          setTokenBalances(balances);
        }
      } catch (error) {
        console.error("Error fetching token balances:", error);
      }
    };
    
    fetchBalances();
    
    return () => {
      isMounted = false;
    };
  }, [address, tokens]);
  
  // Check for Prior Pioneer NFT ownership
  useEffect(() => {
    let isMounted = true;
    
    const checkForNFT = async () => {
      if (!address || !userId) return;
      
      try {
        const hasNFT = await checkPriorPioneerNFT(address);
        if (!isMounted) return;
        
        if (hasNFT) {
          try {
            // Notify backend that user has the Prior Pioneer NFT
            interface NFTBadgeResponse {
              awarded: boolean;
            }
            
            const response = await apiRequest<NFTBadgeResponse>('POST', `/api/users/${userId}/check-nft-badge`, {});
            
            if (response.ok && response.json && (await response.json()).awarded) {
              toast({
                title: "Pioneer Badge Awarded!",
                description: "You've received the Prior Pioneer badge for being an NFT holder!"
              });
            }
          } catch (error) {
            console.error("Error with NFT badge API:", error);
          }
        }
      } catch (error) {
        console.error("Error checking for Prior Pioneer NFT:", error);
      }
    };
    
    checkForNFT();
    
    return () => {
      isMounted = false;
    };
  }, [address, userId, toast]);
  
  const connectWallet = async () => {
    try {
      console.log("Connecting wallet...");
      
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
      
      console.log("Connected to account:", account);
      setAddress(account);
      
      try {
        await switchToBaseSepoliaNetwork();
        const currentChainId = await getChainId();
        setChainId(currentChainId);
      } catch (error) {
        console.error("Error switching networks:", error);
      }
      
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
  
  const connectWithMetaMask = async () => {
    await connectWallet();
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
      
      await swapTokens(fromTokenAddress, toTokenAddress, parsedAmount, slippage);
      
      const updatedBalances = {...tokenBalances};
      
      if (address) {
        try {
          // Try to refresh balances after swap
          const fromResult = await getTokenBalanceFromContract(fromTokenAddress, address);
          const toResult = await getTokenBalanceFromContract(toTokenAddress, address);
          
          updatedBalances[fromToken.symbol] = formatTokenAmount(fromResult.balance.toString(), fromResult.decimals);
          updatedBalances[toToken.symbol] = formatTokenAmount(toResult.balance.toString(), toResult.decimals);
          
          setTokenBalances(updatedBalances);
          
          // Record the swap on our backend for achievement tracking if user has signed in
          const swapQuestId = 2; // ID for the first swap quest
          if (userId) {
            await apiRequest('POST', `/api/quests/${swapQuestId}/complete`, { userId });
          } else {
            console.log("User not signed in, skipping quest update");
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
  
  const value = {
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
    <WalletContext.Provider value={value}>
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