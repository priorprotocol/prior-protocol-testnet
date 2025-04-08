import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { TokenInfo } from "@/types";

const Swap = () => {
  // Initialize with default values
  let isConnected = false;
  let connectWallet = async () => {};
  let tokens: TokenInfo[] = [];
  let getTokenBalance = (_symbol: string) => "0.00";
  let sendSwapTransaction = async () => false;
  
  // Only use the wallet context if it's available
  try {
    const wallet = useWallet();
    isConnected = wallet.isConnected;
    connectWallet = wallet.connectWallet;
    tokens = wallet.tokens;
    getTokenBalance = wallet.getTokenBalance;
    sendSwapTransaction = wallet.sendSwapTransaction;
  } catch (error) {
    console.log("Wallet context not available yet");
  }
  
  const { toast } = useToast();
  
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fromToken, setFromToken] = useState<TokenInfo | null>(tokens.find(t => t.symbol === "PRIOR") || null);
  const [toToken, setToToken] = useState<TokenInfo | null>(tokens.find(t => t.symbol === "USDC") || null);
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const [slippage, setSlippage] = useState("0.5");
  
  const fromBalance = fromToken ? getTokenBalance(fromToken.symbol) : "0.00";
  const toBalance = toToken ? getTokenBalance(toToken.symbol) : "0.00";
  
  // Mock exchange rate - in production this would come from the contract or an oracle
  const getExchangeRate = () => {
    if (!fromToken || !toToken) return "0";
    
    // Simple mock rates
    const rates: Record<string, Record<string, string>> = {
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
        "WETH": "0.0005"
      },
      "USDT": {
        "PRIOR": "20",
        "USDC": "1",
        "DAI": "1",
        "WETH": "0.0005"
      },
      "DAI": {
        "PRIOR": "20",
        "USDC": "1",
        "USDT": "1",
        "WETH": "0.0005"
      },
      "WETH": {
        "PRIOR": "30000",
        "USDC": "2000",
        "USDT": "2000",
        "DAI": "2000"
      }
    };
    
    return rates[fromToken.symbol]?.[toToken.symbol] || "1";
  };
  
  // Update to amount when from amount changes
  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      const rate = getExchangeRate();
      const calculatedAmount = (parseFloat(value) * parseFloat(rate)).toString();
      setToAmount(calculatedAmount);
    } else {
      setToAmount("");
    }
  };
  
  // Update from amount when to amount changes
  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      const rate = getExchangeRate();
      const calculatedAmount = (parseFloat(value) / parseFloat(rate)).toString();
      setFromAmount(calculatedAmount);
    } else {
      setFromAmount("");
    }
  };
  
  const switchTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };
  
  const selectFromToken = (token: TokenInfo) => {
    if (token.symbol === toToken?.symbol) {
      setToToken(fromToken);
    }
    setFromToken(token);
    setIsFromDropdownOpen(false);
    handleFromAmountChange(fromAmount);
  };
  
  const selectToToken = (token: TokenInfo) => {
    if (token.symbol === fromToken?.symbol) {
      setFromToken(toToken);
    }
    setToToken(token);
    setIsToDropdownOpen(false);
    handleFromAmountChange(fromAmount);
  };
  
  const handleSwap = async () => {
    if (!isConnected) {
      connectWallet();
      return;
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
    
    try {
      await sendSwapTransaction(
        fromToken.address,
        toToken.address,
        fromAmount,
        toAmount,
        slippage
      );
      
      toast({
        title: "Swap successful!",
        description: `Successfully swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`,
      });
      
      // Reset form
      setFromAmount("");
      setToAmount("");
    } catch (error: any) {
      toast({
        title: "Swap failed",
        description: error.message || "An error occurred during the swap",
        variant: "destructive"
      });
    }
  };
  
  return (
    <section id="swap" className="py-16 bg-[#0B1118] bg-opacity-40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-space font-bold mb-4">Token Swap</h2>
          <p className="text-[#A0AEC0] max-w-2xl mx-auto">
            Swap between testnet tokens with PriorSwap to test the decentralized exchange functionality.
          </p>
        </div>
        
        <div className="max-w-lg mx-auto gradient-border gradient-border-orange bg-[#141D29] p-6 md:p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-space font-semibold">Swap Tokens</h3>
            <button className="text-[#A0AEC0] hover:text-white transition-colors" title="Settings">
              <i className="fas fa-cog"></i>
            </button>
          </div>
          
          {/* From Token */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-[#A0AEC0] mb-2">
              <label>From</label>
              <div>Balance: <span>{fromBalance}</span></div>
            </div>
            <div className="flex items-center bg-[#0B1118] border border-[#2D3748] rounded-lg p-3">
              <input 
                type="text" 
                placeholder="0.0" 
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
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
                  <div className="absolute right-0 mt-2 w-full min-w-[150px] bg-[#111827] border border-[#2D3748] rounded-lg shadow-lg z-10">
                    {tokens.map(token => (
                      <button
                        key={token.symbol}
                        onClick={() => selectFromToken(token)}
                        className="w-full flex items-center p-3 hover:bg-[#1A5CFF] hover:bg-opacity-10 transition-colors"
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Swap Direction Button */}
          <div className="flex justify-center -my-2 relative z-0">
            <button 
              onClick={switchTokens}
              className="w-10 h-10 rounded-full bg-[#111827] border border-[#2D3748] flex items-center justify-center hover:bg-[#0B1118] transition-colors"
            >
              <i className="fas fa-arrow-down text-[#FF6B00]"></i>
            </button>
          </div>
          
          {/* To Token */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-[#A0AEC0] mb-2">
              <label>To</label>
              <div>Balance: <span>{toBalance}</span></div>
            </div>
            <div className="flex items-center bg-[#0B1118] border border-[#2D3748] rounded-lg p-3">
              <input 
                type="text" 
                placeholder="0.0" 
                value={toAmount}
                onChange={(e) => handleToAmountChange(e.target.value)}
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
                  <div className="absolute right-0 mt-2 w-full min-w-[150px] bg-[#111827] border border-[#2D3748] rounded-lg shadow-lg z-10">
                    {tokens.map(token => (
                      <button
                        key={token.symbol}
                        onClick={() => selectToToken(token)}
                        className="w-full flex items-center p-3 hover:bg-[#1A5CFF] hover:bg-opacity-10 transition-colors"
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-[#FF6B00] bg-opacity-10 rounded-lg border border-[#FF6B00] border-opacity-30 mb-6 text-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#A0AEC0]">Rate</span>
              <span className="font-medium">
                1 {fromToken?.symbol || "-"} = {getExchangeRate()} {toToken?.symbol || "-"}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#A0AEC0]">Slippage Tolerance</span>
              <div className="flex items-center">
                <select 
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="bg-[#111827] text-white border border-[#2D3748] rounded px-2 py-1 text-xs"
                >
                  <option value="0.1">0.1%</option>
                  <option value="0.5">0.5%</option>
                  <option value="1.0">1.0%</option>
                  <option value="2.0">2.0%</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#A0AEC0]">Estimated Gas</span>
              <span className="font-medium">0.0003 ETH</span>
            </div>
          </div>
          
          <button 
            onClick={handleSwap}
            className="w-full rounded-lg bg-[#FF6B00] hover:bg-opacity-90 transition-all font-bold text-sm px-8 py-4 uppercase tracking-wide"
          >
            {!isConnected 
              ? "Connect Wallet" 
              : "Swap Tokens"}
          </button>
          
          <div className="mt-4 text-xs text-[#A0AEC0] text-center">
            <p>Note: This is a testnet swap. Tokens have no real value.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Swap;
