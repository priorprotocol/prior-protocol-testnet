import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { TokenInfo } from "@/types";
import { ethers } from "ethers";
import { formatTokenAmount } from "@/lib/web3";

/**
 * A completely rebuilt, simplified Swap component with fixed dependency tracking 
 * and optimized state management to avoid recursive update issues
 */
export default function Swap() {
  const { 
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
  
  // Get token balances
  const fromBalance = fromToken ? getTokenBalance(fromToken.symbol) : "0.00";
  const toBalance = toToken ? getTokenBalance(toToken.symbol) : "0.00";
  
  // Mock exchange rates - using a stable reference with useCallback to prevent recreation
  const getMockRate = useCallback((from: string, to: string): string => {
    const mockRates: Record<string, Record<string, string>> = {
      "PRIOR": {
        "USDC": "0.05",
        "USDT": "0.05",
        "DAI": "0.05",
        "WETH": "0.00003"
      },
      "USDC": {
        "PRIOR": "20",
        "USDT": "1",
        "DAI": "1",
        "WETH": "0.0006"
      },
      "USDT": {
        "PRIOR": "20",
        "USDC": "1",
        "DAI": "1",
        "WETH": "0.0006"
      },
      "DAI": {
        "PRIOR": "20",
        "USDC": "1",
        "USDT": "1", 
        "WETH": "0.0006"
      },
      "WETH": {
        "PRIOR": "33333",
        "USDC": "1667",
        "USDT": "1667",
        "DAI": "1667"
      }
    };
    
    return mockRates[from]?.[to] || "0";
  }, []);
  
  // Initialize token selection when tokens are loaded
  useEffect(() => {
    if (tokens.length > 0) {
      const priorToken = tokens.find(t => t.symbol === "PRIOR");
      const usdcToken = tokens.find(t => t.symbol === "USDC");
      
      if (priorToken && !fromToken) {
        setFromToken(priorToken);
      }
      
      if (usdcToken && !toToken) {
        setToToken(usdcToken);
      } else if (!toToken && tokens.length > 1) {
        // If no USDC, select the second token by default
        setToToken(tokens[1]);
      }
    }
  }, [tokens, fromToken, toToken]);
  
  // Get exchange rate - using useCallback to make it a stable reference
  const getExchangeRate = useCallback(async () => {
    if (!fromToken || !toToken) return "0";
    
    setIsLoadingRate(true);
    
    try {
      // Use mock rates for simplicity and to avoid contract errors
      const rate = getMockRate(fromToken.symbol, toToken.symbol);
      
      // For PRIOR token pairs, we'll optionally try to get the rate from the contract
      if ((fromToken.symbol === "PRIOR" || toToken.symbol === "PRIOR") && false) { // disabled for now
        try {
          const { calculateSwapOutput } = await import('@/lib/contracts');
          
          if (fromToken.symbol === "PRIOR") {
            const result = await calculateSwapOutput(
              fromToken.address,
              toToken.address,
              "1"
            );
            
            if (result && result.amountOut) {
              const formattedAmount = ethers.utils.formatUnits(result.amountOut, result.toDecimals);
              setExchangeRate(formattedAmount);
              setIsLoadingRate(false);
              return formattedAmount;
            }
          } else if (toToken.symbol === "PRIOR") {
            const result = await calculateSwapOutput(
              toToken.address, 
              fromToken.address,
              "1"
            );
            
            if (result && result.amountOut) {
              const formattedAmount = ethers.utils.formatUnits(result.amountOut, result.toDecimals);
              const inverseRate = parseFloat(formattedAmount);
              if (inverseRate > 0) {
                const inverseRateStr = (1 / inverseRate).toString();
                setExchangeRate(inverseRateStr);
                setIsLoadingRate(false);
                return inverseRateStr;
              }
            }
          }
        } catch (error) {
          console.error("Contract rate calculation error:", error);
          // Fall back to mock rates on error
        }
      }
      
      setExchangeRate(rate);
      setIsLoadingRate(false);
      return rate;
    } catch (error) {
      console.error("Error getting exchange rate:", error);
      setIsLoadingRate(false);
      setExchangeRate("0");
      return "0";
    }
  }, [fromToken, toToken, getMockRate]);
  
  // Update rate when tokens change
  useEffect(() => {
    if (fromToken && toToken) {
      getExchangeRate();
    }
  }, [fromToken, toToken, getExchangeRate]);
  
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
  
  // Handle setting max amount
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
  
  // Update to amount when from amount changes
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
  
  // Update from amount when to amount changes
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
  
  // Switch the from and to tokens
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
  
  // Select from token handler
  const selectFromToken = useCallback((token: TokenInfo) => {
    // Don't allow selecting the same token for both sides
    if (toToken && token.symbol === toToken.symbol) {
      setToToken(fromToken);
    }
    
    setFromToken(token);
    setIsFromDropdownOpen(false);
  }, [toToken, fromToken]);
  
  // Select to token handler
  const selectToToken = useCallback((token: TokenInfo) => {
    if (fromToken && token.symbol === fromToken.symbol) {
      setFromToken(toToken);
    }
    
    setToToken(token);
    setIsToDropdownOpen(false);
  }, [fromToken, toToken]);
  
  // Handle swap
  // Direct connect function similar to what we have in Faucet.tsx
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
      
      console.log("Requesting accounts directly from Swap component...");
      const { requestAccounts } = await import('@/lib/web3');
      const account = await requestAccounts();
      
      if (!account) {
        toast({
          title: "No Account Found",
          description: "Please connect an account in your MetaMask wallet.",
          variant: "destructive"
        });
        return null;
      }
      
      console.log("Account connected:", account);
      
      // Try to update the wallet address via global debug methods
      try {
        // @ts-ignore
        if (window.__setWalletAddress) {
          // @ts-ignore
          const debugUpdate = window.__setWalletAddress(account);
          console.log("Global wallet update result:", debugUpdate);
        }
      } catch (error) {
        console.error("Error updating wallet address globally:", error);
      }
      
      // Also try the standard connectWallet method
      try {
        await connectWallet();
      } catch (error) {
        console.error("Error with standard wallet connection:", error);
      }
      
      // Switch to Base Sepolia
      try {
        const { switchToBaseSepoliaNetwork } = await import('@/lib/web3');
        await switchToBaseSepoliaNetwork();
      } catch (error) {
        console.error("Failed to switch network:", error);
      }
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${account.substring(0, 6)}...${account.substring(account.length - 4)}`,
      });
      
      return account;
    } catch (error) {
      console.error("Error in direct connect:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to MetaMask. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [connectWallet, toast]);

  const handleSwap = useCallback(async () => {
    if (!isConnected) {
      try {
        console.log("Trying direct wallet connection from Swap...");
        const account = await directConnectWallet();
        if (!account) {
          return;
        }
        return;
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
        description: "In this testnet, only PRIOR token is supported as a source token. UI displays exchange rates for all pairs, but transactions can only be executed from PRIOR to other tokens.",
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
        toast({
          title: "Swap successful!",
          description: `Successfully swapped ${formatDisplayNumber(fromAmount)} ${fromToken.symbol} for ${formatDisplayNumber(toAmount)} ${toToken.symbol}`,
        });
        
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
    fromAmount, toAmount, fromBalance, slippage,
    sendSwapTransaction, toast
  ]);
  
  return (
    <section id="swap" className="py-16 bg-[#0B1118] bg-opacity-40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-space font-bold mb-4">Token Swap</h2>
          <p className="text-[#A0AEC0] max-w-2xl mx-auto">
            Swap between testnet tokens with PriorSwap to test decentralized exchange functionality.
          </p>
        </div>
        
        <div className="max-w-lg mx-auto gradient-border gradient-border-orange bg-[#141D29] p-6 md:p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-space font-semibold">Swap Tokens</h3>
            <div className="text-sm text-gray-400">
              Base Sepolia Testnet
            </div>
          </div>
          
          {/* From Token */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-[#A0AEC0] mb-2">
              <label>From</label>
              <div className="flex items-center">
                Balance: <span className="mx-1">{fromBalance}</span>
                <button 
                  onClick={handleMaxAmount}
                  className="ml-1 px-2 py-0.5 text-xs bg-[#FF6B00] bg-opacity-20 text-[#FF6B00] rounded hover:bg-opacity-30 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>
            <div className="flex items-center bg-[#0B1118] border border-[#2D3748] rounded-lg p-3">
              <input 
                type="text" 
                placeholder="0.0" 
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                disabled={isSwapping}
                className="w-full bg-transparent text-white text-lg focus:outline-none"
              />
              <div className="relative">
                <button 
                  onClick={() => setIsFromDropdownOpen(!isFromDropdownOpen)}
                  className="flex items-center bg-[#111827] rounded-lg px-3 py-2 ml-2 hover:bg-opacity-80 transition-colors"
                >
                  {fromToken ? (
                    <>
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                        style={{ backgroundColor: fromToken.logoColor }}
                      >
                        {fromToken.symbol === "PRIOR" ? (
                          <span className="font-bold text-xs">P</span>
                        ) : fromToken.symbol === "WETH" ? (
                          <span className="font-bold text-xs">Ξ</span>
                        ) : (
                          <span className="font-bold text-xs">$</span>
                        )}
                      </div>
                      <span>{fromToken.symbol}</span>
                    </>
                  ) : (
                    <span>Select</span>
                  )}
                  <i className="fas fa-chevron-down ml-2 text-[#A0AEC0]"></i>
                </button>
                
                {isFromDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#1A202C] border border-[#2D3748] rounded-lg shadow-lg z-10">
                    <ul>
                      {tokens.map(token => (
                        <li key={token.symbol}>
                          <button
                            className={`w-full text-left px-4 py-2 hover:bg-[#2D3748] flex items-center transition-colors ${token.symbol === fromToken?.symbol ? 'bg-[#2D3748] bg-opacity-50' : ''}`}
                            onClick={() => selectFromToken(token)}
                          >
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                              style={{ backgroundColor: token.logoColor }}
                            >
                              {token.symbol === "PRIOR" ? (
                                <span className="font-bold text-xs">P</span>
                              ) : token.symbol === "WETH" ? (
                                <span className="font-bold text-xs">Ξ</span>
                              ) : (
                                <span className="font-bold text-xs">$</span>
                              )}
                            </div>
                            <span>{token.symbol}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Swap Button */}
          <div className="flex justify-center my-2">
            <button 
              className="w-8 h-8 rounded-full bg-[#1A202C] flex items-center justify-center hover:bg-[#2D3748] transition-colors"
              onClick={switchTokens}
            >
              <i className="fas fa-arrow-down transform rotate-0 text-[#A0AEC0]"></i>
            </button>
          </div>
          
          {/* To Token */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-[#A0AEC0] mb-2">
              <label>To</label>
              <div>Balance: {toBalance}</div>
            </div>
            <div className="flex items-center bg-[#0B1118] border border-[#2D3748] rounded-lg p-3">
              <input 
                type="text" 
                placeholder="0.0" 
                value={toAmount}
                onChange={(e) => handleToAmountChange(e.target.value)}
                disabled={isSwapping}
                className="w-full bg-transparent text-white text-lg focus:outline-none"
              />
              <div className="relative">
                <button 
                  onClick={() => setIsToDropdownOpen(!isToDropdownOpen)}
                  className="flex items-center bg-[#111827] rounded-lg px-3 py-2 ml-2 hover:bg-opacity-80 transition-colors"
                >
                  {toToken ? (
                    <>
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                        style={{ backgroundColor: toToken.logoColor }}
                      >
                        {toToken.symbol === "PRIOR" ? (
                          <span className="font-bold text-xs">P</span>
                        ) : toToken.symbol === "WETH" ? (
                          <span className="font-bold text-xs">Ξ</span>
                        ) : (
                          <span className="font-bold text-xs">$</span>
                        )}
                      </div>
                      <span>{toToken.symbol}</span>
                    </>
                  ) : (
                    <span>Select</span>
                  )}
                  <i className="fas fa-chevron-down ml-2 text-[#A0AEC0]"></i>
                </button>
                
                {isToDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#1A202C] border border-[#2D3748] rounded-lg shadow-lg z-10">
                    <ul>
                      {tokens.map(token => (
                        <li key={token.symbol}>
                          <button
                            className={`w-full text-left px-4 py-2 hover:bg-[#2D3748] flex items-center transition-colors ${token.symbol === toToken?.symbol ? 'bg-[#2D3748] bg-opacity-50' : ''}`}
                            onClick={() => selectToToken(token)}
                          >
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                              style={{ backgroundColor: token.logoColor }}
                            >
                              {token.symbol === "PRIOR" ? (
                                <span className="font-bold text-xs">P</span>
                              ) : token.symbol === "WETH" ? (
                                <span className="font-bold text-xs">Ξ</span>
                              ) : (
                                <span className="font-bold text-xs">$</span>
                              )}
                            </div>
                            <span>{token.symbol}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Exchange Rate */}
          <div className="mb-4 text-sm text-[#A0AEC0]">
            <div className="flex justify-between items-center">
              <div>Exchange Rate:</div>
              <div>
                {isLoadingRate ? (
                  <span>Loading...</span>
                ) : fromToken && toToken ? (
                  <span>1 {fromToken.symbol} ≈ {formatDisplayNumber(exchangeRate)} {toToken.symbol}</span>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={isSwapping}
            className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center transition-colors ${
              isConnected 
                ? "bg-gradient-to-r from-[#FF6B00] to-[#FF9900] hover:from-[#FF5500] hover:to-[#FF8800] text-white" 
                : "bg-[#FF6B00] hover:bg-[#FF5500] text-white"
            } ${isSwapping ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isSwapping ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Swapping...
              </>
            ) : !isConnected ? (
              "Connect Wallet"
            ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
              "Enter an amount"
            ) : parseFloat(fromAmount) > parseFloat(fromBalance) ? (
              "Insufficient balance"
            ) : (
              "Swap"
            )}
          </button>
          
          {/* Testnet Note */}
          <div className="mt-4 text-xs text-center text-gray-400">
            <p>This is a testnet implementation. Only PRIOR can be used as the source token for actual swaps.</p>
          </div>
        </div>
      </div>
    </section>
  );
}