import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { TokenInfo } from "@/types";
import { ethers } from "ethers";
import {
  FiSettings,
  FiArrowDown,
  FiChevronDown,
  FiExternalLink,
  FiInfo,
  FiX,
  FiRefreshCw,
  FiCheckCircle
} from "react-icons/fi";
import { formatTokenAmount } from "@/lib/web3";
import { cn } from "@/lib/utils";

// Token addresses - needed for swap contract integration
const PRIOR_TOKEN_ADDRESS = "0x15b5Cca71598A1e2f5C8050ef3431dCA49F8EcbD";
const PRIOR_SWAP_ADDRESS = "0x1e09f076824fFD47eC47E94C0dB8F5702Fd5ef9e";
const USDC_TOKEN_ADDRESS = "0x0C6BAA4B8092B29F6B370e06BdfE67434680E062";
const USDT_TOKEN_ADDRESS = "0xdaDcC45A00fe893df95488622fA2B64BfFc5E0bf";
const DAI_TOKEN_ADDRESS = "0x72f30eb1cE25523Ea2Fa63eDe9797481634E496B";
const WETH_TOKEN_ADDRESS = "0xc413B81c5fb4798b8e4c6053AADd383C4Dc3703B";

export default function Swap() {
  const {
    address,
    isConnected,
    connectWallet,
    tokens,
    getTokenBalance,
    sendSwapTransaction
  } = useWallet();

  const { toast } = useToast();

  // Basic state for the swap form
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [toToken, setToToken] = useState<TokenInfo | null>(null);

  // UI state
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const [slippage, setSlippage] = useState("0.5");
  const [isSwapping, setIsSwapping] = useState(false);
  const [isCalculatingOutput, setIsCalculatingOutput] = useState(false);
  const [exchangeRate, setExchangeRate] = useState("0");
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCongratulationsOpen, setIsCongratulationsOpen] = useState(false);

  // Get token balances
  const fromBalance = fromToken ? getTokenBalance(fromToken.symbol) : "0.00";
  const toBalance = toToken ? getTokenBalance(toToken.symbol) : "0.00";

  // Exchange rates for tokens (fixed rates for testnet)
  const getExchangeRate = useCallback(async () => {
    if (!fromToken || !toToken) return "0";
    
    setIsLoadingRate(true);
    
    try {
      // Fixed exchange rates for testnet purposes
      const rates: Record<string, Record<string, string>> = {
        "PRIOR": {
          "USDC": "0.2",
          "USDT": "0.2",
          "DAI": "0.2",
          "WETH": "0.0001"
        },
        "USDC": {
          "PRIOR": "5",
          "USDT": "1",
          "DAI": "1",
          "WETH": "0.0005"
        },
        "USDT": {
          "PRIOR": "5",
          "USDC": "1",
          "DAI": "1",
          "WETH": "0.0005"
        },
        "DAI": {
          "PRIOR": "5",
          "USDC": "1",
          "USDT": "1",
          "WETH": "0.0005"
        },
        "WETH": {
          "PRIOR": "10000",
          "USDC": "2000",
          "USDT": "2000",
          "DAI": "2000"
        }
      };
      
      const rate = rates[fromToken.symbol]?.[toToken.symbol] || "0";
      setExchangeRate(rate);
      setIsLoadingRate(false);
      return rate;
    } catch (error) {
      console.error("Error getting exchange rate:", error);
      setIsLoadingRate(false);
      setExchangeRate("0");
      return "0";
    }
  }, [fromToken, toToken]);

  // Update tokens when wallet is connected
  useEffect(() => {
    if (tokens.length > 0) {
      const priorToken = tokens.find(t => t.symbol === "PRIOR");
      const usdcToken = tokens.find(t => t.symbol === "USDC");
      
      if (priorToken && (!fromToken || !tokens.includes(fromToken))) {
        setFromToken(priorToken);
      }
      
      if (usdcToken && (!toToken || !tokens.includes(toToken))) {
        setToToken(usdcToken);
      } else if (!toToken && tokens.length > 1) {
        // Select first token that's not PRIOR if USDC not available
        const nonPriorToken = tokens.find(t => t.symbol !== "PRIOR") || tokens[1];
        setToToken(nonPriorToken);
      }
    }
  }, [tokens, fromToken, toToken]);

  // Update rate when tokens change
  useEffect(() => {
    if (fromToken && toToken) {
      getExchangeRate();
    }
  }, [fromToken, toToken, getExchangeRate]);

  // Calculate to amount when from amount changes
  const handleFromAmountChange = useCallback((value: string) => {
    // Accept only numbers and decimals
    if (value && !/^[0-9.]*$/.test(value)) return;
    
    setFromAmount(value);
    
    if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      if (exchangeRate !== "0") {
        const calculatedAmount = (parseFloat(value) * parseFloat(exchangeRate)).toString();
        setToAmount(calculatedAmount);
      } else {
        setToAmount("0");
      }
    } else {
      setToAmount("");
    }
  }, [exchangeRate]);

  // Calculate from amount when to amount changes
  const handleToAmountChange = useCallback((value: string) => {
    // Accept only numbers and decimals
    if (value && !/^[0-9.]*$/.test(value)) return;
    
    setToAmount(value);
    
    if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      if (exchangeRate !== "0" && parseFloat(exchangeRate) > 0) {
        const calculatedAmount = (parseFloat(value) / parseFloat(exchangeRate)).toString();
        setFromAmount(calculatedAmount);
      } else {
        setFromAmount("0");
      }
    } else {
      setFromAmount("");
    }
  }, [exchangeRate]);

  // Handle max amount
  const handleMaxAmount = useCallback(() => {
    if (fromToken && fromBalance) {
      // Leave a small buffer for gas if it's the network token
      const maxAmount = fromToken.symbol === "WETH" 
        ? Math.max(0, parseFloat(fromBalance) - 0.001).toString()
        : fromBalance;
      
      setFromAmount(maxAmount);
      
      // Calculate the to amount
      if (exchangeRate !== "0") {
        const calculatedToAmount = (parseFloat(maxAmount) * parseFloat(exchangeRate)).toString();
        setToAmount(calculatedToAmount);
      }
    }
  }, [fromToken, fromBalance, exchangeRate]);

  // Format numbers for display
  const formatDisplayNumber = (value: string): string => {
    if (!value || isNaN(parseFloat(value))) return "0";
    
    // Format to 6 decimal places maximum
    const formatted = parseFloat(parseFloat(value).toFixed(6)).toString();
    
    // If it's a whole number, display without decimal places
    if (formatted.indexOf('.') === -1) return formatted;
    
    // Otherwise, display with decimal places
    return formatted;
  };

  // Switch tokens
  const switchTokens = useCallback(() => {
    if (!fromToken || !toToken) {
      return;
    }
    
    if (fromToken.symbol === toToken.symbol) {
      toast({
        title: "Invalid Swap",
        description: "Cannot swap a token for itself",
        variant: "destructive"
      });
      return;
    }
    
    // Switch tokens and amounts
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  }, [fromToken, toToken, fromAmount, toAmount, toast]);

  // Select token handlers
  const selectFromToken = useCallback((token: TokenInfo) => {
    // Don't allow selecting the same token for both sides
    if (toToken && token.symbol === toToken.symbol) {
      setToToken(fromToken);
    }
    
    setFromToken(token);
    setIsFromDropdownOpen(false);
  }, [toToken, fromToken]);

  const selectToToken = useCallback((token: TokenInfo) => {
    if (fromToken && token.symbol === fromToken.symbol) {
      setFromToken(toToken);
    }
    
    setToToken(token);
    setIsToDropdownOpen(false);
  }, [fromToken, toToken]);

  // Direct wallet connection
  const directConnectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask to connect your wallet.",
          variant: "destructive"
        });
        window.open('https://metamask.io/download.html', '_blank');
        return null;
      }
      
      console.log("Requesting accounts directly...");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const account = accounts[0];
      
      if (!account) {
        toast({
          title: "No Account Found",
          description: "Please connect an account in your MetaMask wallet.",
          variant: "destructive"
        });
        return null;
      }
      
      console.log("Account connected:", account);
      
      // Force network switch
      try {
        const { switchToBaseSepoliaNetwork } = await import('@/lib/web3');
        await switchToBaseSepoliaNetwork();
      } catch (error) {
        console.error("Network switch error:", error);
        toast({
          title: "Network Error",
          description: "Please switch to Base Sepolia network manually",
          variant: "destructive"
        });
      }
      
      // Force state update in multiple ways
      try {
        // Update through standard connect
        await connectWallet();
        
        // Additional direct update if needed
        const { updateWalletAddressGlobally } = await import('@/context/WalletContext');
        updateWalletAddressGlobally(account);
      } catch (error) {
        console.error("State update error:", error);
      }
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${account.substring(0, 6)}...${account.substring(account.length - 4)}`,
      });
      
      return account;
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive"
      });
      return null;
    }
  }, [connectWallet, toast]);

  // Handle swap transaction
  const handleSwap = useCallback(async () => {
    if (!isConnected) {
      try {
        console.log("Trying direct wallet connection from Swap...");
        const account = await directConnectWallet();
        if (!account) {
          return;
        }
      } catch (error) {
        console.error("Failed direct wallet connection:", error);
        
        // Fallback to standard connect
        connectWallet();
        return;
      }
    }
    
    if (!fromToken || !toToken) {
      toast({
        title: "Error",
        description: "Please select tokens to swap",
        variant: "destructive"
      });
      return;
    }
    
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount to swap",
        variant: "destructive"
      });
      return;
    }
    
    if (parseFloat(fromAmount) > parseFloat(fromBalance)) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${fromToken.symbol} tokens`,
        variant: "destructive"
      });
      return;
    }
    
    // In this testnet, only PRIOR can be the source token
    if (fromToken.symbol !== "PRIOR") {
      toast({
        title: "Testnet Mode",
        description: "In this testnet, only PRIOR token is supported as a source token.",
      });
      return;
    }
    
    setIsSwapping(true);
    
    try {
      const success = await sendSwapTransaction(
        fromToken.address,
        toToken.address,
        fromAmount,
        toAmount,
        slippage
      );
      
      if (success) {
        // Show congratulations modal
        setIsCongratulationsOpen(true);
        
        // Reset form
        setFromAmount("");
        setToAmount("");
      }
    } catch (error: any) {
      toast({
        title: "Swap failed",
        description: error.message || "An error occurred during the swap",
        variant: "destructive"
      });
    } finally {
      setIsSwapping(false);
    }
  }, [
    isConnected, connectWallet, directConnectWallet, fromToken, toToken, 
    fromAmount, toAmount, fromBalance, slippage, sendSwapTransaction, toast
  ]);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF6B00] to-[#FF9900]">
            PriorSwap
          </h1>
          <p className="text-gray-400 mt-2">Fast, simple token swaps on Base Sepolia testnet</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main Swap Card */}
          <div className="flex-1 bg-[#141D29] rounded-2xl shadow-xl border border-[#2D3748]/50 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Swap</h2>
              <button 
                onClick={() => setIsSettingsOpen(true)} 
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1A202C] transition-colors"
              >
                <FiSettings className="w-5 h-5" />
              </button>
            </div>
            
            {/* From Token Input */}
            <div className="bg-[#1A202C] rounded-xl p-4 mb-2">
              <div className="flex justify-between mb-2">
                <div className="text-sm text-gray-400">From</div>
                <div className="text-sm text-gray-400">
                  Balance: {formatDisplayNumber(fromBalance)}
                  <button 
                    onClick={handleMaxAmount}
                    className="ml-1 px-2 py-0.5 text-xs bg-[#FF6B00]/20 text-[#FF6B00] rounded hover:bg-[#FF6B00]/30 transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>
              
              <div className="flex items-center mt-1">
                <input
                  type="text"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-white text-2xl font-medium focus:outline-none"
                />
                
                <div className="relative">
                  <button
                    onClick={() => setIsFromDropdownOpen(!isFromDropdownOpen)}
                    className="flex items-center space-x-2 bg-[#0B1118] hover:bg-[#141D29] px-3 py-2 rounded-xl transition-colors"
                  >
                    {fromToken && (
                      <>
                        <div className="w-6 h-6 rounded-full bg-white p-0.5">
                          <img 
                            src={`https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/${fromToken.address.toLowerCase()}/logo.png`}
                            alt={fromToken.symbol}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://placehold.co/200x200/FF6B00/FFF?text=${fromToken.symbol}`;
                            }}
                          />
                        </div>
                        <span className="font-medium text-white">{fromToken.symbol}</span>
                        <FiChevronDown className="text-gray-400" />
                      </>
                    )}
                  </button>
                  
                  {/* Token Dropdown */}
                  {isFromDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1A202C] shadow-lg border border-[#2D3748] z-10">
                      <div className="p-2 border-b border-[#2D3748]">
                        <div className="text-sm font-medium text-white">Select a token</div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {tokens.map((token) => (
                          <button
                            key={token.symbol}
                            onClick={() => selectFromToken(token)}
                            className={cn(
                              "flex items-center w-full px-4 py-3 hover:bg-[#0B1118] transition-colors",
                              token.symbol === fromToken?.symbol && "bg-[#0B1118]"
                            )}
                          >
                            <div className="w-6 h-6 rounded-full bg-white p-0.5 mr-3">
                              <img 
                                src={`https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/${token.address.toLowerCase()}/logo.png`}
                                alt={token.symbol}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://placehold.co/200x200/FF6B00/FFF?text=${token.symbol}`;
                                }}
                              />
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="font-medium text-white">{token.symbol}</span>
                              <span className="text-xs text-gray-400">{token.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Switch Button */}
            <div className="flex justify-center -my-3 relative z-10">
              <button 
                onClick={switchTokens}
                className="bg-[#0B1118] border border-[#2D3748] p-2 rounded-lg text-[#FF6B00] hover:text-[#FF9900] transition-colors"
              >
                <FiArrowDown className="w-5 h-5" />
              </button>
            </div>
            
            {/* To Token Input */}
            <div className="bg-[#1A202C] rounded-xl p-4 mb-4">
              <div className="flex justify-between mb-2">
                <div className="text-sm text-gray-400">To</div>
                <div className="text-sm text-gray-400">
                  Balance: {formatDisplayNumber(toBalance)}
                </div>
              </div>
              
              <div className="flex items-center mt-1">
                <input
                  type="text"
                  value={toAmount}
                  onChange={(e) => handleToAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-white text-2xl font-medium focus:outline-none"
                />
                
                <div className="relative">
                  <button
                    onClick={() => setIsToDropdownOpen(!isToDropdownOpen)}
                    className="flex items-center space-x-2 bg-[#0B1118] hover:bg-[#141D29] px-3 py-2 rounded-xl transition-colors"
                  >
                    {toToken && (
                      <>
                        <div className="w-6 h-6 rounded-full bg-white p-0.5">
                          <img 
                            src={`https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/${toToken.address.toLowerCase()}/logo.png`}
                            alt={toToken.symbol}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://placehold.co/200x200/FF6B00/FFF?text=${toToken.symbol}`;
                            }}
                          />
                        </div>
                        <span className="font-medium text-white">{toToken.symbol}</span>
                        <FiChevronDown className="text-gray-400" />
                      </>
                    )}
                  </button>
                  
                  {/* Token Dropdown */}
                  {isToDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1A202C] shadow-lg border border-[#2D3748] z-10">
                      <div className="p-2 border-b border-[#2D3748]">
                        <div className="text-sm font-medium text-white">Select a token</div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {tokens.map((token) => (
                          <button
                            key={token.symbol}
                            onClick={() => selectToToken(token)}
                            className={cn(
                              "flex items-center w-full px-4 py-3 hover:bg-[#0B1118] transition-colors",
                              token.symbol === toToken?.symbol && "bg-[#0B1118]"
                            )}
                          >
                            <div className="w-6 h-6 rounded-full bg-white p-0.5 mr-3">
                              <img 
                                src={`https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/${token.address.toLowerCase()}/logo.png`}
                                alt={token.symbol}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://placehold.co/200x200/FF6B00/FFF?text=${token.symbol}`;
                                }}
                              />
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="font-medium text-white">{token.symbol}</span>
                              <span className="text-xs text-gray-400">{token.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Exchange Rate and Info */}
            {fromToken && toToken && !isLoadingRate && (
              <div className="flex justify-between items-center text-sm mb-4 px-2">
                <div className="flex items-center text-gray-400">
                  <span>Rate: 1 {fromToken.symbol} = {exchangeRate} {toToken.symbol}</span>
                  <button className="ml-1 text-gray-500 hover:text-gray-300 transition-colors">
                    <FiRefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-gray-400">
                  <span>Slippage {slippage}%</span>
                </div>
              </div>
            )}
            
            {/* Swap Button */}
            {!isConnected ? (
              <button
                onClick={directConnectWallet}
                className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FF9900] hover:from-[#FF5A00] hover:to-[#FF8800] text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.01]"
              >
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={handleSwap}
                disabled={isSwapping || !fromAmount || parseFloat(fromAmount) <= 0 || fromToken?.symbol !== "PRIOR"}
                className={cn(
                  "w-full font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.01]",
                  isSwapping ? "bg-[#2D3748] text-gray-400" : 
                  fromToken?.symbol !== "PRIOR" ? "bg-[#2D3748] text-gray-400" :
                  "bg-gradient-to-r from-[#FF6B00] to-[#FF9900] hover:from-[#FF5A00] hover:to-[#FF8800] text-white"
                )}
              >
                {isSwapping ? "Swapping..." : 
                 fromToken?.symbol !== "PRIOR" ? "Only PRIOR as source supported" :
                 "Swap"}
              </button>
            )}
            
            {/* Testnet Notice */}
            <div className="mt-4 text-center text-xs text-gray-400">
              <p>Base Sepolia Testnet | Testing environment only</p>
            </div>
          </div>
          
          {/* Info Card */}
          <div className="md:w-80 bg-[#141D29] rounded-2xl shadow-xl border border-[#2D3748]/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Prior Protocol</h3>
            
            <div className="space-y-4">
              {/* Token Info */}
              <div className="bg-[#1A202C] rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Testnet Tokens</h4>
                <div className="space-y-2">
                  {tokens.map((token) => (
                    <div key={token.symbol} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-white p-0.5 mr-2">
                          <img 
                            src={`https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/${token.address.toLowerCase()}/logo.png`}
                            alt={token.symbol}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://placehold.co/200x200/FF6B00/FFF?text=${token.symbol}`;
                            }}
                          />
                        </div>
                        <span className="text-sm text-white">{token.symbol}</span>
                      </div>
                      <span className="text-sm text-gray-400">{getTokenBalance(token.symbol)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Contract Info */}
              <div className="bg-[#1A202C] rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Swap Contract</h4>
                <div className="mb-2">
                  <div className="flex items-center mb-1">
                    <span className="text-xs text-gray-400">PriorSwap</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-white truncate">{PRIOR_SWAP_ADDRESS.substring(0, 8)}...{PRIOR_SWAP_ADDRESS.substring(PRIOR_SWAP_ADDRESS.length - 6)}</span>
                    <a 
                      href={`https://sepolia-explorer.base.org/address/${PRIOR_SWAP_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-[#FF6B00] hover:text-[#FF9900] transition-colors"
                    >
                      <FiExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <span className="text-xs text-gray-400">PRIOR Token</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-white truncate">{PRIOR_TOKEN_ADDRESS.substring(0, 8)}...{PRIOR_TOKEN_ADDRESS.substring(PRIOR_TOKEN_ADDRESS.length - 6)}</span>
                    <a 
                      href={`https://sepolia-explorer.base.org/address/${PRIOR_TOKEN_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-[#FF6B00] hover:text-[#FF9900] transition-colors"
                    >
                      <FiExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#141D29] rounded-2xl border border-[#2D3748] shadow-xl w-full max-w-md p-5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-semibold text-white">Settings</h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Slippage Tolerance
              </label>
              <div className="flex items-center space-x-2">
                {["0.1", "0.5", "1.0"].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-sm font-medium",
                      slippage === value
                        ? "bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30"
                        : "bg-[#1A202C] text-gray-300 border border-[#2D3748] hover:bg-[#0B1118]"
                    )}
                  >
                    {value}%
                  </button>
                ))}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={slippage}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value || /^[0-9.]+$/.test(value)) {
                        setSlippage(value);
                      }
                    }}
                    className="w-full bg-[#1A202C] border border-[#2D3748] rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FF6B00]/50"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    %
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-400 bg-[#1A202C] p-3 rounded-xl flex items-start space-x-2 mb-5">
              <FiInfo className="w-5 h-5 text-blue-400 mt-0.5" />
              <p>Your transaction will revert if the price changes unfavorably by more than this percentage.</p>
            </div>
            
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FF9900] text-white font-medium py-2.5 rounded-xl hover:from-[#FF5A00] hover:to-[#FF8800] transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
      
      {/* Congratulations Modal */}
      {isCongratulationsOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#141D29] rounded-2xl border border-[#2D3748] shadow-xl w-full max-w-md p-5 text-center">
            <div className="flex justify-end">
              <button 
                onClick={() => setIsCongratulationsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="my-4 flex justify-center">
              <div className="w-16 h-16 bg-[#FF6B00]/20 rounded-full flex items-center justify-center text-[#FF9900]">
                <FiCheckCircle className="w-10 h-10" />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2">Swap Successful!</h3>
            
            <p className="text-gray-400 mb-4">
              You have successfully swapped {formatDisplayNumber(fromAmount)} {fromToken?.symbol} for {formatDisplayNumber(toAmount)} {toToken?.symbol}
            </p>
            
            <div className="bg-[#1A202C] rounded-xl p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Transaction Hash</span>
                <a 
                  href={`https://sepolia-explorer.base.org/tx/placeholder`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF6B00] hover:text-[#FF9900] transition-colors text-sm flex items-center"
                >
                  View <FiExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
              <div className="text-sm text-white truncate">
                0x123...456
              </div>
            </div>
            
            <button
              onClick={() => setIsCongratulationsOpen(false)}
              className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FF9900] text-white font-medium py-2.5 rounded-xl hover:from-[#FF5A00] hover:to-[#FF8800] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}