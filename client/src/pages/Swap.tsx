import React, { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { CONTRACT_ADDRESSES as contractAddresses, SWAP_CONTRACTS } from "@/contracts/addresses";
import {
  FiArrowDown,
  FiSettings,
  FiCopy,
  FiLogOut,
  FiChevronDown,
  FiExternalLink
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { ethers } from "ethers";
import TokenCard from "@/components/TokenCard";
import { getTokenContract, swapTokens, approveTokens, getTokenBalance, 
  getPriorToUSDCRate, calculateSimpleSwapOutput, getTokenContractWithSigner, isTokenApproved } from "@/contracts/services";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";

import { 
  CORRECT_ADDRESSES, 
  getCorrectPriorTokenAddress, 
  getCorrectUsdcTokenAddress,
  getCorrectSwapAddress,
  clearTokenCache
} from '@/lib/forceCorrectAddresses';

// Token definitions with symbol, color, logo, decimals, and address
// Using hard-coded correct addresses to ensure we always use the right contracts
const TOKENS = {
  PRIOR: {
    symbol: "PRIOR",
    color: "#00df9a",
    logo: "P",
    decimals: 18,
    address: CORRECT_ADDRESSES.PRIOR_TOKEN // Force correct address
  },
  USDC: {
    symbol: "USDC",
    color: "#2775ca",
    logo: "U",
    decimals: 6,
    address: CORRECT_ADDRESSES.USDC_TOKEN // Force correct address
  }
};

export default function Swap() {
  // State for token selection and amounts
  const [fromToken, setFromToken] = useState<string>("PRIOR");
  const [toToken, setToToken] = useState<string>("USDC");
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
  const [showToDropdown, setShowToDropdown] = useState<boolean>(false);
  
  // UI states
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [slippage, setSlippage] = useState<number>(0.5); // Default slippage tolerance
  
  // Transaction states
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [hasAllowance, setHasAllowance] = useState<boolean>(false);
  const [swapStatus, setSwapStatus] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  
  // Balances for all tokens
  const [balances, setBalances] = useState<{[key: string]: string}>({});
  const [forcedBalances, setForcedBalances] = useState<{[key: string]: string}>({});
  
  // Exchange rates between tokens
  const [exchangeRates, setExchangeRates] = useState<{[key: string]: number}>({
    PRIOR_USDC: 2, // 1 PRIOR = 2 USDC
    USDC_PRIOR: 0.5, // 1 USDC = 0.5 PRIOR
  });
  
  // Get wallet state from wallet providers (both global context and standalone)
  const { address, isConnected, disconnectWallet, getTokenBalance: contextGetBalance } = useWallet();
  const {
    connect: standaloneConnect,
    disconnect: standaloneDisconnect,
    address: directAddress,
    isConnected: isLocalConnected,
    isConnecting: isLoading
  } = useStandaloneWallet();
  
  // Local wallet provider state
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  
  // Toast notifications
  const { toast } = useToast();

  // Connect to wallet manually
  const manualConnectWallet = async () => {
    try {
      await standaloneConnect();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Initialize provider on page load
  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      setProvider(provider);
      
      try {
        // Check if MetaMask is already connected
        provider.listAccounts().then(accounts => {
          if (accounts.length > 0) {
            console.log("Already connected account found via provider:", accounts[0]);
            // Get a signer instance
            const signer = provider.getSigner();
            setSigner(signer);
            // Load balances for the connected account
            loadBalances(accounts[0]);
          }
        });
      } catch (error) {
        console.error("Error checking connected accounts:", error);
      }
    }
    
    // Load exchange rates on mount
    loadExchangeRates();
  }, []);

  // Update balances when address changes
  useEffect(() => {
    // Try using our direct address first, then fall back to global address
    const currentAddress = directAddress || address;
    
    if (currentAddress) {
      console.log("Address detected in useEffect, loading balances:", currentAddress);
      
      // We no longer set fixed testnet balances - instead use actual balances from the blockchain
      // This ensures we're always showing the correct values from the current contracts
      loadBalances(currentAddress);
      
      // Also ensure we have a signer if we have an address
      if (provider && !signer) {
        try {
          const signerInstance = provider.getSigner();
          setSigner(signerInstance);
        } catch (error) {
          console.error("Error getting signer in address effect:", error);
        }
      }
    } else {
      console.log("No address available in useEffect");
      // Clear balances when no address is available
      setBalances({});
      setForcedBalances({});
    }
  }, [directAddress, address, provider, signer]);

  // Load exchange rates on first render
  useEffect(() => {
    loadExchangeRates();
  }, []);
  
  // Check for token approval status when wallet or tokens change
  useEffect(() => {
    const checkAllowance = async () => {
      // Only check allowance if connected to a wallet
      const currentAddress = directAddress || address;
      if (!currentAddress || !isPairSupported()) {
        return;
      }
      
      try {
        // Get the token address and swap contract address
        const fromTokenAddress = TOKENS[fromToken as keyof typeof TOKENS].address;
        const swapContractAddress = CORRECT_ADDRESSES.PRIOR_USDC_SWAP;
        
        console.log(`Checking allowance for ${fromToken} (${fromTokenAddress}) to swap contract ${swapContractAddress}`);
        
        // Check if the token is already approved using the isTokenApproved function
        const approved = await isTokenApproved(fromTokenAddress, swapContractAddress);
        
        console.log(`${fromToken} approval status:`, approved ? "Already approved" : "Needs approval");
        setHasAllowance(approved);
      } catch (error) {
        console.error("Error checking token allowance:", error);
        setHasAllowance(false);
      }
    };
    
    checkAllowance();
  }, [fromToken, toToken, directAddress, address]);

  // Load token balances for selected tokens from the actual contracts
  const loadBalances = async (walletAddress: string) => {
    try {
      const newBalances: {[key: string]: string} = {};
      const forcedBalancesMap: {[key: string]: string} = {};
      
      // HARD CODE THE EXACT NEW CONTRACT ADDRESSES to ensure we're only using new contracts
      const PRIOR_TOKEN_ADDRESS = "0xeFC91C5a51E8533282486FA2601dFfe0a0b16EDb";
      const USDC_TOKEN_ADDRESS = "0xdB07b0b4E88D9D5A79A08E91fEE20Bb41f9989a2";
      
      console.log("HARD-CODED PRIOR contract address:", PRIOR_TOKEN_ADDRESS);
      console.log("HARD-CODED USDC contract address:", USDC_TOKEN_ADDRESS);
      
      // Fetch PRIOR balance from explicitly set address
      const priorBalance = await getTokenBalance(
        PRIOR_TOKEN_ADDRESS,
        walletAddress
      );
      newBalances["PRIOR"] = priorBalance;
      forcedBalancesMap["PRIOR"] = formatBalance(priorBalance, "PRIOR");
      
      // Fetch USDC balance from explicitly set address
      const usdcBalance = await getTokenBalance(
        USDC_TOKEN_ADDRESS,
        walletAddress
      );
      newBalances["USDC"] = usdcBalance;
      forcedBalancesMap["USDC"] = formatBalance(usdcBalance, "USDC");
      
      console.log("Loaded real token balances:", newBalances);
      
      // Reset any old balances to ensure we're only showing new contract balances
      localStorage.removeItem('tokenBalances');
      localStorage.removeItem('tokenApprovals');
      
      // Now set the balances state
      setBalances(newBalances);
      setForcedBalances(forcedBalancesMap);
    } catch (error) {
      console.error("Error loading token balances:", error);
      // Fallback to empty balances if there's an error
      setBalances({});
      setForcedBalances({});
    }
  };

  // Load exchange rates from contract
  const loadExchangeRates = async () => {
    try {
      // Get the fixed rates from the contract via our service functions
      const priorToUsdcRate = await getPriorToUSDCRate();
      
      console.log("Loaded exchange rates from contract:");
      console.log(`PRIOR to USDC rate: ${priorToUsdcRate}`);

      // Set the exchange rates
      setExchangeRates({
        PRIOR_USDC: 2, // 1 PRIOR = 2 USDC
        USDC_PRIOR: 0.5, // 1 USDC = 0.5 PRIOR
      });
    } catch (error) {
      console.error("Error loading exchange rates:", error);
    }
  };

  // Format balance display based on token decimals
  const formatBalance = (balance: string, tokenSymbol?: string) => {
    const token = tokenSymbol || "PRIOR"; // Default to PRIOR if no token specified
    
    // Parse the balance to a number
    const parsedBalance = parseFloat(balance || "0");
    
    // For normal values, use cleaner display formats based on token type
    if (token === "PRIOR") {
      // PRIOR token balances with different precision based on size
      if (parsedBalance >= 1000) {
        return parsedBalance.toFixed(0); // No decimal places for large amounts
      } else if (parsedBalance >= 1) {
        return parsedBalance.toFixed(2); // 2 decimal places for medium amounts
      } else if (parsedBalance >= 0.001) {
        return parsedBalance.toFixed(4); // 4 decimal places for small amounts
      } else if (parsedBalance > 0) {
        return parsedBalance.toFixed(5); // 5 decimal places for tiny amounts
      } else {
        return "0"; // Just show "0" for zero balance
      }
    } else {
      // For stablecoins (USDC), always use 2 decimal places
      return parsedBalance.toFixed(2);
    }
  };

  // Get available tokens for dropdown
  const getAvailableTokens = (excludeToken: string) => {
    return Object.keys(TOKENS).filter(token => token !== excludeToken);
  };

  // Verify if the pair is supported
  const isPairSupported = () => {
    // PRIOR-USDC pair is the only supported pair
    if ((fromToken === "PRIOR" && toToken === "USDC") || 
        (fromToken === "USDC" && toToken === "PRIOR")) {
      return true;
    }
    
    return false;
  };
  
  // Calculate the output amount based on input, token pair, and fees
  const calculateOutput = () => {
    if (!fromAmount || isNaN(parseFloat(fromAmount)) || parseFloat(fromAmount) <= 0) {
      setToAmount("");
      return;
    }
    
    try {
      const result = calculateSimpleSwapOutput(fromToken, toToken, fromAmount);
      setToAmount(result);
    } catch (error) {
      console.error("Error calculating output:", error);
      setToAmount("");
    }
  };
  
  // Update the output amount when input changes
  useEffect(() => {
    calculateOutput();
  }, [fromToken, toToken, fromAmount]);
  
  // Handle token selection for "from" dropdown
  const handleFromTokenSelect = (token: string) => {
    if (token === toToken) {
      // Swap the tokens if the same token is selected
      setToToken(fromToken);
    }
    setFromToken(token);
    setShowFromDropdown(false);
  };
  
  // Handle token selection for "to" dropdown
  const handleToTokenSelect = (token: string) => {
    if (token === fromToken) {
      // Swap the tokens if the same token is selected
      setFromToken(toToken);
    }
    setToToken(token);
    setShowToDropdown(false);
  };
  
  // Switch the from and to tokens
  const switchTokens = () => {
    if (toAmount && !fromAmount) {
      // If we only have a "to" amount, use it as the new "from" amount
      setFromAmount(toAmount);
      setToAmount("");
    }
    
    // Swap the tokens
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
  };
  
  // Set the maximum available amount
  const setMaxAmount = () => {
    setFromAmount(balances[fromToken] || "0");
  };
  
  // Get the Base Sepolia explorer URL for transaction
  const getExplorerLink = (txHash: string) => {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  };
  
  // Function to handle token approval for swapping
  const handleApproveToken = async () => {
    if (!signer || !provider || !fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please connect your wallet and enter a valid amount",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsApproving(true);
      setSwapStatus("Approving tokens...");
      
      // Get the swap contract address - only PRIOR-USDC pair is supported
      // Using the force-correct address to ensure we use the new contract
      let swapContractAddress = CORRECT_ADDRESSES.PRIOR_USDC_SWAP;
      
      const fromTokenAddress = TOKENS[fromToken as keyof typeof TOKENS].address;
      
      // Get the token decimals
      const decimals = TOKENS[fromToken as keyof typeof TOKENS].decimals;
      
      // Approve tokens using the services function with max approval
      // This allows the swap contract to use the token without requiring approval for every swap
      const result = await approveTokens(
        fromTokenAddress,
        swapContractAddress,
        "max", // Use max approval
        true // useMaxApproval set to true
      );
      
      if (result) {
        setHasAllowance(true);
        setSwapStatus("Approval successful! You can now swap.");
        toast({
          title: "Approval Successful",
          description: `You can now swap ${fromAmount} ${fromToken}`,
        });
      } else {
        setSwapStatus("Approval failed. Please try again.");
        toast({
          title: "Approval Failed",
          description: "Could not approve tokens. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error approving tokens:", error);
      setSwapStatus("Approval failed. Please try again.");
      toast({
        title: "Approval Error",
        description: "An error occurred during token approval.",
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };
  
  // Function to handle the actual token swap
  const handleExecuteSwap = async () => {
    if (!signer || !provider || !fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please connect your wallet and enter a valid amount",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSwapping(true);
      setSwapStatus("Swapping tokens...");
      
      // Get token addresses
      const fromTokenAddress = TOKENS[fromToken as keyof typeof TOKENS].address;
      const toTokenAddress = TOKENS[toToken as keyof typeof TOKENS].address;
      
      // Get the swap contract address - only PRIOR-USDC pair is supported
      // Using the force-correct address to ensure we use the new contract
      let swapContractAddress = CORRECT_ADDRESSES.PRIOR_USDC_SWAP;
      
      // Execute the swap through the service function
      const receipt = await swapTokens(
        fromTokenAddress,
        toTokenAddress,
        fromAmount,
        swapContractAddress
      );
      
      // Store the transaction hash
      setTxHash(receipt.transactionHash);
      
      // Record the swap in the database and update UI
      setSwapStatus("Swap successful!");
      toast({
        title: "Swap Successful",
        description: `You swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`,
      });
      
      // Create a transaction record in the database and update user stats
      try {
        const userId = directAddress || address;
        if (userId) {
          // Import the apiRequest function from queryClient to ensure proper API URL handling
          const { apiRequest } = await import('@/lib/queryClient');
          
          // Create a transaction record through the API
          const transactionResult = await apiRequest('POST', '/api/transactions', {
            userId: userId,
            type: 'swap',
            txHash: receipt.transactionHash,
            fromToken: fromToken,
            toToken: toToken,
            fromAmount: fromAmount,
            toAmount: toAmount,
            status: 'completed',
            blockNumber: receipt.blockNumber
          });
          
          if (!transactionResult) {
            console.error('Failed to record transaction in database');
          } else {
            console.log('Transaction recorded successfully:', transactionResult);
          }
          
          // Increment swap count 
          const swapCountResult = await apiRequest('POST', `/api/users/${userId}/increment-swap-count`);
          console.log('Swap count incremented:', swapCountResult);
          
          // Check daily swap count to see if user has done swaps today
          const dailySwapData = await apiRequest('GET', `/api/users/${userId}/daily-swap-count`);
          console.log('Daily swap count data:', dailySwapData);
          const dailySwapCount = dailySwapData.count || 0;
          
          // Determine points to add based on NEW SIMPLIFIED points system
          // 0.5 points for first 5 swaps per day (max 2.5 points daily)
          const MAX_DAILY_SWAPS_FOR_POINTS = 5;
          const POINTS_PER_SWAP = 0.5;
          
          let pointsToAdd = 0;
          let pointsMessage = "";
          
          if (dailySwapCount <= MAX_DAILY_SWAPS_FOR_POINTS) {
            // Award 0.5 points for each of the first 5 swaps
            pointsToAdd = POINTS_PER_SWAP;
            pointsMessage = `${POINTS_PER_SWAP} points for this swap! (${dailySwapCount}/${MAX_DAILY_SWAPS_FOR_POINTS} daily swaps)`;
          } else {
            pointsMessage = `No points earned. Already completed ${MAX_DAILY_SWAPS_FOR_POINTS} swaps today.`;
          }
          
          // Show toast for points earned
          if (pointsToAdd > 0) {
            toast({
              title: "Points Earned!",
              description: pointsMessage,
              variant: "default",
              className: "bg-green-800 text-white border-green-600",
            });
          }
          
          if (pointsToAdd > 0) {
            // Add the points to the user's account
            const pointsResponse = await fetch(`/api/users/${userId}/add-points`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                points: pointsToAdd
              }),
            });
            
            if (pointsResponse.ok) {
              const pointsResult = await pointsResponse.json();
              console.log(`Successfully awarded ${pointsToAdd} points for swap, new total: ${pointsResult.points}`);
              
              // Show a toast notification about points earned with dynamic styling
              toast({
                title: `Points Earned: ${pointsToAdd}`,
                description: `You earned ${pointsToAdd} points for this swap! (${dailySwapCount}/${MAX_DAILY_SWAPS_FOR_POINTS} daily swaps)`,
                variant: "default",
                className: "bg-gradient-to-r from-emerald-800 to-green-900 border-emerald-600"
              });
            }
          } else {
            // They've reached maximum daily swaps for points - let them know clearly
            toast({
              title: "Daily Points Limit Reached",
              description: `You've already completed ${MAX_DAILY_SWAPS_FOR_POINTS} swaps today. Maximum ${MAX_DAILY_SWAPS_FOR_POINTS * POINTS_PER_SWAP} points per day.`,
              className: "bg-blue-800 border-blue-600"
            });
          }
        }
      } catch (error) {
        console.error('Error recording transaction and updating stats:', error);
      }
      
      // Update balances after swap (still use local balance tracking for immediate feedback)
      const fromCurrentBalance = parseFloat(balances[fromToken] || "0");
      const toCurrentBalance = parseFloat(balances[toToken] || "0");
      const fromAmount_num = parseFloat(fromAmount);
      const toAmount_num = parseFloat(toAmount);
      
      // Calculate new balances
      const newFromBalance = fromCurrentBalance - fromAmount_num;
      const newToBalance = toCurrentBalance + toAmount_num;
      
      // Update balances
      setBalances({
        ...balances,
        [fromToken]: newFromBalance.toString(),
        [toToken]: newToBalance.toString()
      });
      
      // Also update forced balances for TokenCard display
      setForcedBalances({
        ...forcedBalances,
        [fromToken]: formatBalance(newFromBalance.toString(), fromToken),
        [toToken]: formatBalance(newToBalance.toString(), toToken)
      });
      
      // Reset form but maintain token approval
      setFromAmount("");
      setToAmount("");
      // We no longer reset approval status (setHasAllowance) after swaps
      // This maintains the unlimited approval granted previously
    } catch (error) {
      console.error("Error executing swap:", error);
      setSwapStatus("Swap failed. Please try again.");
      toast({
        title: "Swap Failed",
        description: "Could not complete the swap. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">PRIOR Swap</h1>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <FiSettings className="w-5 h-5" />
            </button>
            {directAddress || isLocalConnected || isConnected || address ? (
              <div className="flex items-center bg-gray-800 rounded-full px-3 py-1">
                <span className="text-sm mr-2">
                  {directAddress 
                    ? `${directAddress.substring(0, 6)}...${directAddress.substring(38)}`
                    : address 
                      ? `${address.substring(0, 6)}...${address.substring(38)}` 
                      : "Connected"}
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      if (directAddress) {
                        navigator.clipboard.writeText(directAddress);
                        toast({
                          title: "Address Copied",
                          description: "Wallet address copied to clipboard",
                        });
                      } else if (address) {
                        navigator.clipboard.writeText(address);
                        toast({
                          title: "Address Copied",
                          description: "Wallet address copied to clipboard",
                        });
                      }
                    }}
                    className="text-gray-400 hover:text-white"
                    title="Copy address"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      // Reset balances 
                      setBalances({});
                      
                      // Display toast
                      toast({
                        title: "Wallet Disconnected",
                        description: "Your wallet has been disconnected"
                      });
                      
                      // Disconnect using the standalone wallet hook
                      standaloneDisconnect();
                      
                      // If there's a global disconnect in WalletContext, try to use it
                      if (disconnectWallet) {
                        disconnectWallet();
                      }
                    }}
                    className="text-red-400 hover:text-red-300 ml-1"
                    title="Disconnect wallet"
                  >
                    <FiLogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={manualConnectWallet}
                disabled={isLoading}
                className="bg-gradient-to-r from-[#00df9a] to-blue-500 text-black font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
              >
                {isLoading ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>

        {/* Token Balances Cards */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {Object.keys(TOKENS).map(tokenSymbol => {
            // Create a token object with complete information for TokenCard
            const token = {
              ...TOKENS[tokenSymbol as keyof typeof TOKENS],
              id: 0, // Not used in this context
              name: tokenSymbol === "PRIOR" ? "Prior Protocol Token" : "USD Coin",
              logoColor: TOKENS[tokenSymbol as keyof typeof TOKENS].color
            };
            
            // Use forcedBalances if available, otherwise use the regular balance
            const forceBalance = forcedBalances[tokenSymbol];
            
            return (
              <TokenCard 
                key={tokenSymbol} 
                token={token} 
                forceBalance={forceBalance}
              />
            );
          })}
        </div>
        
        {/* Testnet Notice */}
        <div className="bg-indigo-900/70 border border-indigo-700 rounded-xl p-3 mb-4 text-sm">
          <p className="text-indigo-200 font-medium mb-2">
            <span className="text-indigo-400 font-bold">⚠️ Testnet Notice:</span> This is a testnet environment. Try swapping between 0.1 - 1 PRIOR tokens to test the functionality.
          </p>
          <p className="text-yellow-300 text-xs">
            <span className="font-bold">Supported pairs:</span> PRIOR ↔ USDC only.
          </p>
        </div>

        {/* Swap Card */}
        <div className="bg-gray-800 rounded-2xl p-4 shadow-xl border border-gray-700">
          {/* From Token */}
          <div className="bg-gray-700 rounded-xl p-3 mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">From</span>
              <span className="text-xs text-gray-400 mr-2">
                Balance: {formatBalance(balances[fromToken] || "0", fromToken)}
              </span>
              <div className="flex space-x-1">
                {fromToken === "PRIOR" && toToken === "USDC" && (
                  <>
                    <button 
                      onClick={() => setFromAmount("0.1")}
                      className="text-xs bg-green-700 hover:bg-green-600 px-2 py-0.5 rounded"
                      title="Use recommended test amount for PRIOR→USDC"
                    >
                      Try: 0.1
                    </button>
                    <button 
                      onClick={() => setFromAmount("0.5")}
                      className="text-xs bg-blue-700 hover:bg-blue-600 px-2 py-0.5 rounded"
                      title="Use recommended test amount for PRIOR→USDC"
                    >
                      Try: 0.5
                    </button>
                    <button 
                      onClick={() => setFromAmount("1")}
                      className="text-xs bg-indigo-700 hover:bg-indigo-600 px-2 py-0.5 rounded"
                      title="Use recommended test amount for PRIOR→USDC"
                    >
                      Try: 1
                    </button>
                  </>
                )}
                {(fromToken === "USDC" && toToken === "PRIOR") && (
                  <>
                    <button 
                      onClick={() => setFromAmount("0.2")}
                      className="text-xs bg-green-700 hover:bg-green-600 px-2 py-0.5 rounded"
                      title="Use recommended test amount for USDC→PRIOR"
                    >
                      Try: 0.2
                    </button>
                    <button 
                      onClick={() => setFromAmount("1")}
                      className="text-xs bg-blue-700 hover:bg-blue-600 px-2 py-0.5 rounded"
                      title="Use recommended test amount for USDC→PRIOR"
                    >
                      Try: 1
                    </button>
                    <button 
                      onClick={() => setFromAmount("2")}
                      className="text-xs bg-indigo-700 hover:bg-indigo-600 px-2 py-0.5 rounded"
                      title="Use recommended test amount for USDC→PRIOR"
                    >
                      Try: 2
                    </button>
                  </>
                )}

                <button 
                  onClick={setMaxAmount}
                  className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-0.5 rounded"
                >
                  Max: {formatBalance(balances[fromToken] || "0", fromToken)}
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.0"
                className="bg-transparent text-2xl w-full outline-none"
              />
              <div className="relative">
                <button 
                  onClick={() => setShowFromDropdown(!showFromDropdown)}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded-lg ml-2 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: TOKENS[fromToken as keyof typeof TOKENS].color }}>
                    <span className="text-white text-sm font-bold">{TOKENS[fromToken as keyof typeof TOKENS].logo}</span>
                  </div>
                  <span>{fromToken}</span>
                  <FiChevronDown className="text-gray-300" />
                </button>
                {showFromDropdown && (
                  <div className="absolute right-0 mt-2 w-full bg-gray-800 rounded-xl shadow-lg z-10 border border-gray-700 max-h-60 overflow-auto">
                    {getAvailableTokens(toToken).map(token => (
                      <button
                        key={token}
                        onClick={() => handleFromTokenSelect(token)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 flex items-center gap-3"
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: TOKENS[token as keyof typeof TOKENS].color }}>
                          <span className="text-white text-sm font-bold">{TOKENS[token as keyof typeof TOKENS].logo}</span>
                        </div>
                        <span>{token}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center my-1">
            <button
              onClick={switchTokens}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full -my-3 z-10 border-2 border-gray-800"
            >
              <FiArrowDown className="w-4 h-4" />
            </button>
          </div>

          {/* To Token */}
          <div className="bg-gray-700 rounded-xl p-3 mt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">To</span>
              <span className="text-xs text-gray-400">
                Balance: {formatBalance(balances[toToken] || "0", toToken)}
              </span>
            </div>
            <div className="flex items-center">
              <input
                type="text"
                value={toAmount}
                readOnly
                className="bg-transparent text-2xl w-full outline-none"
              />
              <div className="relative">
                <button 
                  onClick={() => setShowToDropdown(!showToDropdown)}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded-lg ml-2 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: TOKENS[toToken as keyof typeof TOKENS].color }}>
                    <span className="text-white text-sm font-bold">{TOKENS[toToken as keyof typeof TOKENS].logo}</span>
                  </div>
                  <span>{toToken}</span>
                  <FiChevronDown className="text-gray-300" />
                </button>
                {showToDropdown && (
                  <div className="absolute right-0 mt-2 w-full bg-gray-800 rounded-xl shadow-lg z-10 border border-gray-700 max-h-60 overflow-auto">
                    {getAvailableTokens(fromToken).map(token => (
                      <button
                        key={token}
                        onClick={() => handleToTokenSelect(token)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 flex items-center gap-3"
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: TOKENS[token as keyof typeof TOKENS].color }}>
                          <span className="text-white text-sm font-bold">{TOKENS[token as keyof typeof TOKENS].logo}</span>
                        </div>
                        <span>{token}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rate Display */}
          <div className="mt-3 mb-4 text-sm text-gray-400 flex justify-between">
            <span>Rate:</span>
            <span>
              {fromToken === "PRIOR" && toToken === "USDC" ? (
                `1 PRIOR = ${exchangeRates.PRIOR_USDC} USDC`
              ) : (toToken === "PRIOR" && fromToken === "USDC") ? (
                `1 USDC = ${exchangeRates.USDC_PRIOR} PRIOR`
              ) : (
                `1 ${fromToken} = 1 ${toToken}`
              )}
            </span>
          </div>

          {/* Connect wallet button or Swap button */}
          {!(directAddress || isLocalConnected || isConnected || address) ? (
            <Button 
              className="w-full bg-gradient-to-r from-[#00df9a] to-blue-500 text-black hover:opacity-90"
              onClick={manualConnectWallet}
            >
              Connect Wallet
            </Button>
          ) : (
            <div className="space-y-2">
              {/* Transaction Status */}
              {swapStatus && (
                <div className="bg-gray-700 rounded-lg p-2 text-sm">
                  <p className="font-medium">{swapStatus}</p>
                  {txHash && (
                    <div className="flex items-center mt-1 text-xs text-blue-400">
                      <a 
                        href={getExplorerLink(txHash)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center hover:underline"
                      >
                        View on Base Sepolia Explorer <FiExternalLink className="ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              )}
              
              {/* Two-step process: First approve, then swap */}
              {!hasAllowance ? (
                <Button 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={handleApproveToken}
                  disabled={isApproving || !fromAmount || parseFloat(fromAmount) <= 0 || !isPairSupported()}
                >
                  {isApproving ? "Approving..." : "Approve"}
                </Button>
              ) : (
                <Button 
                  className="w-full bg-gradient-to-r from-[#00df9a] to-blue-500 text-black hover:opacity-90"
                  onClick={handleExecuteSwap}
                  disabled={isSwapping || !fromAmount || parseFloat(fromAmount) <= 0 || !isPairSupported()}
                >
                  {isSwapping ? "Swapping..." : "Swap Now"}
                </Button>
              )}
            </div>
          )}
          
          {/* Exchange rate explanation */}
          <div className="mt-4 bg-gray-700/50 rounded-xl p-3 text-xs text-gray-300">
            <p className="mb-2">
              <span className="font-semibold">Testnet Exchange Rates:</span> 
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>1 PRIOR = 2 USDC</li>
              <li>1 USDC = 0.5 PRIOR</li>
            </ul>
            <p className="mt-2 text-gray-400">
              <span className="font-semibold">Fee:</span> 0.5% for PRIOR-USDC swap pair
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}