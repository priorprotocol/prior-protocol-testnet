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
    const initWallet = async () => {
      try {
        const savedAddress = await getAccount();
        if (savedAddress) {
          setAddress(savedAddress);
          
          try {
            const currentChainId = await getChainId();
            setChainId(currentChainId);
            
            if (currentChainId !== 84532) {
              toast({
                title: "Wrong Network",
                description: "Please switch to Base Sepolia Testnet",
                variant: "destructive"
              });
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
      if (!window.ethereum) return;
      
      const handleAccountsChanged = (accounts: string[]) => {
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
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        
        if (newChainId !== 84532) {
          toast({
            title: "Wrong Network",
            description: "Please switch to Base Sepolia Testnet",
            variant: "destructive"
          });
        }
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        if (window.ethereum) {
          window.ethereum.removeAllListeners('accountsChanged');
          window.ethereum.removeAllListeners('chainChanged');
        }
      };
    };
    
    initWallet();
    const cleanup = setupListeners();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, []);
  
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
  
  // Update token balances when address or tokens change
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address || !tokens || tokens.length === 0) {
        return;
      }
      
      try {
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
        
        setTokenBalances(balances);
      } catch (error) {
        console.error("Error fetching token balances:", error);
      }
    };
    
    fetchBalances();
  }, [address, tokens]);
  
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
  }, [address, userId]);
  
  const connectWallet = async () => {
    setIsWalletModalOpen(true);
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
      
      await swapTokens(fromTokenAddress, toTokenAddress, parsedAmount, slippage);
      
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
      
      if (userId) {
        try {
          await apiRequest('POST', `/api/users/${userId}/swap`, { address });
          
          const swapQuestId = 1;
          await apiRequest('POST', `/api/quests/${swapQuestId}/complete`, { userId });
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