import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TokenInfo, UserState } from "@/types";
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
  getTokenBalance, 
  swapTokens, 
  contractAddresses 
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
  sendSwapTransaction: (fromTokenAddress: string, toTokenAddress: string, fromAmount: string, toAmount: string, slippage: string) => Promise<boolean | void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
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
  const { data: tokens = [] as TokenInfo[] } = useQuery<TokenInfo[]>({
    queryKey: ['/api/tokens'],
  });
  
  // Get user data
  const { data: userData } = useQuery<{id?: number, address: string, lastClaim: string | null}>({
    queryKey: [`/api/users/${address}`],
    enabled: !!address,
  });
  
  const userId = userData?.id;
  
  const isConnected = !!address;
  
  // Initialize wallet connection on load
  useEffect(() => {
    const initWallet = async () => {
      try {
        // Check if already connected
        const savedAddress = await getAccount();
        if (savedAddress) {
          setAddress(savedAddress);
          
          // Get chain ID
          const currentChainId = await getChainId();
          setChainId(currentChainId);
          
          // Create user if doesn't exist
          if (savedAddress) {
            try {
              await apiRequest('POST', '/api/users', { address: savedAddress });
            } catch (error) {
              console.error("Error creating user:", error);
            }
          }
          
          // Check if on Base Sepolia network
          if (currentChainId !== 84532) {
            toast({
              title: "Wrong Network",
              description: "Please switch to Base Sepolia Testnet",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error("Error initializing wallet:", error);
      }
    };
    
    initWallet();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          disconnectWallet();
        } else {
          // Account changed
          setAddress(accounts[0]);
        }
      });
      
      window.ethereum.on('chainChanged', (chainIdHex: string) => {
        // Chain changed
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        
        if (newChainId !== 84532) {
          toast({
            title: "Wrong Network",
            description: "Please switch to Base Sepolia Testnet",
            variant: "destructive"
          });
        }
      });
    }
    
    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);
  
  // Update token balances when address changes
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) {
        setTokenBalances({});
        return;
      }
      
      // If there are no tokens yet, skip this operation
      if (!tokens || tokens.length === 0) {
        return;
      }
      
      try {
        const balances: Record<string, string> = {};
        
        for (const token of tokens) {
          try {
            // In a real app, we'd fetch actual balances from the blockchain
            // For demo purposes, we'll generate mock balances
            // const result = await getTokenBalance(token.address, address);
            // balances[token.symbol] = formatTokenAmount(result.balance.toString(), result.decimals);
            
            // Instead, for the testnet demo, we'll use mock balances
            // This avoids needing real contract integrations for the demo
            let balance = "0.00";
            if (token.symbol === "PRIOR") {
              balance = "100.00";
            } else if (token.symbol === "USDC" || token.symbol === "USDT" || token.symbol === "DAI") {
              balance = "1000.00";
            } else if (token.symbol === "WETH") {
              balance = "5.00";
            }
            
            balances[token.symbol] = balance;
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
      
      // Request accounts
      const account = await requestAccounts();
      if (!account) throw new Error("No account found");
      
      setAddress(account);
      
      // Switch to Base Sepolia network
      await switchToBaseSepoliaNetwork();
      
      // Get chain ID
      const currentChainId = await getChainId();
      setChainId(currentChainId);
      
      // Create user if doesn't exist
      try {
        await apiRequest('POST', '/api/users', { address: account });
      } catch (error) {
        console.error("Error creating user:", error);
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
  ) => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }
    
    if (chainId !== 84532) {
      throw new Error("Please switch to Base Sepolia network");
    }
    
    try {
      // In a real app, we'd call the actual swap function on the blockchain
      // For demo purposes, we'll simulate a successful swap
      // await swapTokens(fromTokenAddress, toTokenAddress, parseTokenAmount(fromAmount, 18), slippage);
      
      // Instead, let's simulate a waiting period to mimic a blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update balances after "successful" swap
      const updatedBalances = {...tokenBalances};
      
      // Find the token symbols from addresses
      const fromToken = tokens.find(t => t.address === fromTokenAddress);
      const toToken = tokens.find(t => t.address === toTokenAddress);
      
      if (fromToken && toToken) {
        // Deduct the from token amount
        const currentFromBalance = parseFloat(updatedBalances[fromToken.symbol] || "0");
        updatedBalances[fromToken.symbol] = (currentFromBalance - parseFloat(fromAmount)).toFixed(2);
        if (parseFloat(updatedBalances[fromToken.symbol]) < 0) updatedBalances[fromToken.symbol] = "0.00";
        
        // Add the to token amount
        const currentToBalance = parseFloat(updatedBalances[toToken.symbol] || "0");
        updatedBalances[toToken.symbol] = (currentToBalance + parseFloat(toAmount)).toFixed(2);
      }
      
      setTokenBalances(updatedBalances);
      
      // Try to trigger a quest completion
      if (userId) {
        try {
          // The first quest is a swap quest
          const swapQuestId = 1;
          await apiRequest('POST', `/api/quests/${swapQuestId}/complete`, { address });
        } catch (error) {
          // Ignore errors here, it might just mean they haven't started the quest
          // or already completed it
        }
      }
      
      return true;
    } catch (error: any) {
      console.error("Error swapping tokens:", error);
      throw error;
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
    <WalletContext.Provider value={value as WalletContextType}>
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
