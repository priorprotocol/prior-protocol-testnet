import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { FiCopy, FiChevronDown, FiArrowDown, FiRefreshCw, FiSettings, FiExternalLink } from "react-icons/fi";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/context/WalletContext";

// Import contract addresses and functions from contracts.ts
import { 
  contractAddresses, 
  swapTokens, 
  approveTokens,
  getPriorToUSDCRate,
  getPriorToUSDTRate,
  getPriorToDAIRate,
  getPriorToWETHRate
} from "@/lib/contracts";

import { 
  getProvider, 
  getSigner,
  formatTokenAmount,
  parseTokenAmount
} from "@/lib/web3";

// Define token info
const TOKENS = {
  PRIOR: {
    address: contractAddresses.priorToken,
    symbol: "PRIOR",
    decimals: 18,
    logo: "P",
    color: "#00df9a"
  },
  USDC: {
    address: contractAddresses.mockTokens.USDC,
    symbol: "USDC",
    decimals: 6,
    logo: "U",
    color: "#2775CA"
  },
  USDT: {
    address: contractAddresses.mockTokens.USDT,
    symbol: "USDT",
    decimals: 6,
    logo: "U",
    color: "#26A17B"
  },
  DAI: {
    address: contractAddresses.mockTokens.DAI,
    symbol: "DAI",
    decimals: 6,
    logo: "D",
    color: "#F5AC37"
  },
  WETH: {
    address: contractAddresses.mockTokens.WETH,
    symbol: "WETH",
    decimals: 18,
    logo: "W",
    color: "#627EEA"
  }
};

const MAX_UINT256 = ethers.constants.MaxUint256.toString();

export default function Swap() {
  const { toast } = useToast();
  const { 
    address, 
    isConnected, 
    connectWallet, 
    getTokenBalance,
  } = useWallet();

  // State variables
  const [fromToken, setFromToken] = useState<string>("PRIOR");
  const [toToken, setToToken] = useState<string>("USDC");
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("0");
  const [balances, setBalances] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [hasAllowance, setHasAllowance] = useState<boolean>(false);
  const [slippage, setSlippage] = useState<number>(0.5); // 0.5% default slippage
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>("");
  const [exchangeRates, setExchangeRates] = useState<{[key: string]: number}>({});
  const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
  const [showToDropdown, setShowToDropdown] = useState<boolean>(false);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  
  // State to store our own wallet address (separate from WalletContext)
  const [directAddress, setDirectAddress] = useState<string | null>(null);

  // Initialize provider and attempt to get the connected account directly
  useEffect(() => {
    // Safely check if ethereum is available
    const ethereum = typeof window !== 'undefined' && window.ethereum;
    
    if (ethereum) {
      try {
        const web3Provider = new ethers.providers.Web3Provider(ethereum);
        setProvider(web3Provider);

        // Setup listeners
        ethereum.on('accountsChanged', (accounts: string[]) => {
          console.log("Accounts changed directly:", accounts);
          if (accounts && accounts.length > 0) {
            // Store the address in our component state
            setDirectAddress(accounts[0]);
            handleAccountsChanged(accounts);
          } else {
            setDirectAddress(null);
          }
        });

        ethereum.on('chainChanged', handleChainChanged);
        
        // Try to get accounts to see if already connected
        web3Provider.listAccounts()
          .then(accounts => {
            if (accounts && accounts.length > 0) {
              console.log("Already connected account found:", accounts[0]);
              
              // Store in our own state
              setDirectAddress(accounts[0]);
              
              // Also pass to handler for balance loading
              handleAccountsChanged(accounts);
              
              // Try to get a signer
              try {
                const signerInstance = web3Provider.getSigner();
                setSigner(signerInstance);
              } catch (signerError) {
                console.error("Error getting signer during initialization:", signerError);
              }
            }
          })
          .catch(error => {
            console.error("Error checking accounts:", error);
          });
        
        // Check directly with ethereum object
        ethereum.request({ method: "eth_accounts" })
          .then((accounts: any) => {
            if (accounts && accounts.length > 0) {
              console.log("Ethereum accounts:", accounts[0]);
              setDirectAddress(accounts[0]);
            }
          })
          .catch((error: any) => {
            console.error("Error checking ethereum accounts:", error);
          });
        
        // Clean up event listeners
        return () => {
          ethereum.removeAllListeners('accountsChanged');
          ethereum.removeAllListeners('chainChanged');
        };
      } catch (error) {
        console.error("Error initializing provider:", error);
      }
    } else {
      console.log("No ethereum object found in window. MetaMask may not be installed.");
    }
  }, []);

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // Wallet disconnected
      setBalances({});
    } else {
      await loadBalances(accounts[0]);
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  // Connect wallet manually - improved to ensure proper connection with WalletContext
  const manualConnectWallet = async () => {
    try {
      setIsLoading(true);
      
      // First use the global wallet context's connect method
      await connectWallet();
      
      // Force a direct request to ensure MetaMask popup appears
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("Connected accounts:", accounts);
        
        if (accounts && accounts.length > 0) {
          // Manually set the address in our component state
          const connectedAddress = accounts[0];
          
          // Force wallet chain check
          try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const desiredChainId = '0x14a34'; // Base Sepolia chain ID
            
            if (chainId !== desiredChainId) {
              // Try to switch to Base Sepolia
              try {
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: desiredChainId }],
                });
              } catch (switchError: any) {
                // Chain doesn't exist, let's add it
                if (switchError.code === 4902) {
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                      chainId: desiredChainId,
                      chainName: 'Base Sepolia',
                      nativeCurrency: {
                        name: 'ETH',
                        symbol: 'ETH',
                        decimals: 18
                      },
                      rpcUrls: ['https://sepolia.base.org'],
                      blockExplorerUrls: ['https://sepolia-explorer.base.org']
                    }]
                  });
                }
              }
            }
          } catch (chainError) {
            console.error("Error checking chain:", chainError);
          }
          
          // Then try to get a signer if we have a provider
          if (provider) {
            try {
              const signerInstance = provider.getSigner();
              setSigner(signerInstance);
              
              // Force update our component state with the newly connected address
              await loadBalances(connectedAddress);
              await loadExchangeRates();
              
              // Show a success toast
              toast({
                title: "Wallet Connected",
                description: `Connected to ${connectedAddress.substring(0, 6)}...${connectedAddress.substring(connectedAddress.length - 4)}`,
              });
              
              // Try to force a refresh of the WalletContext
              try {
                const { updateWalletAddressGlobally } = await import('@/context/WalletContext');
                if (updateWalletAddressGlobally) {
                  updateWalletAddressGlobally(connectedAddress);
                }
              } catch (error) {
                console.error("Error updating global wallet state:", error);
              }
            } catch (error) {
              console.error("Error getting signer:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load token balances for selected tokens
  const loadBalances = async (walletAddress: string) => {
    const newBalances: {[key: string]: string} = {};
    
    try {
      for (const symbol of Object.keys(TOKENS)) {
        const balance = getTokenBalance(symbol);
        newBalances[symbol] = balance;
      }
      
      setBalances(newBalances);
    } catch (error) {
      console.error("Error loading balances:", error);
    }
  };

  // Load exchange rates from contract
  const loadExchangeRates = async () => {
    try {
      const [
        priorToUsdcRate, 
        priorToUsdtRate, 
        priorToDaiRate, 
        priorToWethRate
      ] = await Promise.all([
        getPriorToUSDCRate(),
        getPriorToUSDTRate(),
        getPriorToDAIRate(),
        getPriorToWETHRate()
      ]);

      // Convert to proper number formats
      const priorUsdcValue = ethers.utils.formatUnits(priorToUsdcRate, 6);
      const priorUsdtValue = ethers.utils.formatUnits(priorToUsdtRate, 6);
      const priorDaiValue = ethers.utils.formatUnits(priorToDaiRate, 18);
      const priorWethValue = ethers.utils.formatUnits(priorToWethRate, 18);

      // Calculate inverse rates (approximation)
      const usdcPriorValue = (1 / parseFloat(priorUsdcValue)).toString();
      const usdtPriorValue = (1 / parseFloat(priorUsdtValue)).toString();
      const daiPriorValue = (1 / parseFloat(priorDaiValue)).toString();
      const wethPriorValue = (1 / parseFloat(priorWethValue)).toString();

      setExchangeRates({
        PRIOR_USDC: parseFloat(priorUsdcValue),
        PRIOR_USDT: parseFloat(priorUsdtValue),
        PRIOR_DAI: parseFloat(priorDaiValue),
        PRIOR_WETH: parseFloat(priorWethValue),
        USDC_PRIOR: parseFloat(usdcPriorValue),
        USDT_PRIOR: parseFloat(usdtPriorValue),
        DAI_PRIOR: parseFloat(daiPriorValue),
        WETH_PRIOR: parseFloat(wethPriorValue)
      });
    } catch (error) {
      console.error("Error loading exchange rates:", error);
      // Set fallback rates in case of error
      setExchangeRates({
        PRIOR_USDC: 0.999,
        PRIOR_USDT: 0.999,
        PRIOR_DAI: 0.999,
        PRIOR_WETH: 0.0005,
        USDC_PRIOR: 1.001,
        USDT_PRIOR: 1.001,
        DAI_PRIOR: 1.001,
        WETH_PRIOR: 2000
      });
    }
  };

  // Check if the current account has given allowance to the swap contract
  const checkAllowance = async () => {
    const walletAddress = directAddress || address;
    if (!walletAddress || !fromAmount || !provider) return;
    
    try {
      const tokenAddress = TOKENS[fromToken as keyof typeof TOKENS].address;
      const tokenDecimals = TOKENS[fromToken as keyof typeof TOKENS].decimals;
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function allowance(address owner, address spender) view returns (uint256)",
        ],
        provider
      );
      
      const allowance = await tokenContract.allowance(walletAddress, contractAddresses.priorSwap);
      const amountWei = ethers.utils.parseUnits(fromAmount, tokenDecimals);
      
      setHasAllowance(allowance.gte(amountWei));
    } catch (error) {
      console.error("Error checking allowance:", error);
      setHasAllowance(false);
    }
  };

  // Approve token spending
  const approveToken = async () => {
    if (!signer || !fromAmount) return;
    
    setIsApproving(true);
    try {
      const tokenAddress = TOKENS[fromToken as keyof typeof TOKENS].address;
      await approveTokens(tokenAddress, MAX_UINT256);
      
      setHasAllowance(true);
      toast({
        title: "Approval Successful",
        description: `Successfully approved ${fromToken} for trading.`,
      });
    } catch (error: any) {
      console.error("Error approving token:", error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve token for trading.",
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };

  // Execute swap
  const executeSwap = async () => {
    if (!signer || !fromAmount || !hasAllowance) return;
    
    setIsSwapping(true);
    try {
      const fromTokenInfo = TOKENS[fromToken as keyof typeof TOKENS];
      const toTokenInfo = TOKENS[toToken as keyof typeof TOKENS];
      
      const amountIn = parseTokenAmount(fromAmount, fromTokenInfo.decimals);
      
      // Calculate slippage for minimum amount out (not currently used but good practice)
      const slippageFactor = 1 - (slippage / 100);
      const minAmountOut = parseFloat(toAmount) * slippageFactor;
      
      // Perform swap
      const txReceipt = await swapTokens(
        fromTokenInfo.address,
        toTokenInfo.address,
        amountIn,
        slippage.toString()
      );
      
      if (txReceipt) {
        setTxHash(txReceipt.transactionHash);
        toast({
          title: "Swap Successful",
          description: `Successfully swapped ${fromAmount} ${fromToken} for approximately ${parseFloat(toAmount).toFixed(6)} ${toToken}`,
        });
        
        // Refresh balances after successful swap
        if (address) {
          await loadBalances(address);
        }
        
        // Clear inputs after successful swap
        setFromAmount("");
        setToAmount("0");
      }
    } catch (error: any) {
      console.error("Error executing swap:", error);
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to execute swap. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSwapping(false);
    }
  };

  // Calculate expected output amount when input amount changes
  useEffect(() => {
    if (!fromAmount || isNaN(parseFloat(fromAmount))) {
      setToAmount("0");
      return;
    }

    try {
      const amount = parseFloat(fromAmount);
      const rateKey = `${fromToken}_${toToken}`;
      const rate = exchangeRates[rateKey] || 0;
      
      if (rate <= 0) {
        setToAmount("0");
        return;
      }

      // Apply slippage in the preview (this doesn't affect actual transaction)
      const slippageMultiplier = 1;
      const result = amount * rate * slippageMultiplier;
      
      // Format based on token decimals
      const targetDecimals = TOKENS[toToken as keyof typeof TOKENS].decimals;
      const formattedResult = result.toFixed(targetDecimals > 6 ? 6 : targetDecimals);
      setToAmount(formattedResult);
    } catch (error) {
      console.error("Calculation error:", error);
      setToAmount("0");
    }
  }, [fromAmount, fromToken, toToken, exchangeRates, slippage]);

  // Check allowance when inputs change
  useEffect(() => {
    checkAllowance();
  }, [directAddress, address, fromToken, fromAmount]);

  // Update balances when address changes
  useEffect(() => {
    // Try using our direct address first, then fall back to global address
    const currentAddress = directAddress || address;
    
    if (currentAddress) {
      console.log("Address detected in useEffect, loading balances:", currentAddress);
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
    }
  }, [directAddress, address, provider, signer]);

  // Load exchange rates on first render
  useEffect(() => {
    loadExchangeRates();
  }, []);

  // Handle token selection
  const handleFromTokenSelect = (token: string) => {
    if (token === toToken) {
      setToToken(fromToken);
    }
    setFromToken(token);
    setShowFromDropdown(false);
  };

  const handleToTokenSelect = (token: string) => {
    if (token === fromToken) {
      setFromToken(toToken);
    }
    setToToken(token);
    setShowToDropdown(false);
  };

  // Switch tokens
  const switchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    // Also switch amounts if possible
    if (toAmount && toAmount !== "0") {
      setFromAmount(toAmount);
    }
  };

  // Set max amount
  const setMaxAmount = () => {
    setFromAmount(balances[fromToken] || "0");
  };

  // Format balance display
  const formatBalance = (balance: string) => {
    return parseFloat(balance || "0").toFixed(4);
  };

  // Get available tokens for dropdown
  const getAvailableTokens = (excludeToken: string) => {
    return Object.keys(TOKENS).filter(token => token !== excludeToken);
  };

  // Verify if at least one token is PRIOR
  const isPriorInPair = () => {
    return fromToken === "PRIOR" || toToken === "PRIOR";
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
            {directAddress || isConnected || address ? (
              <div className="flex items-center bg-gray-800 rounded-full px-3 py-1">
                <span className="text-sm mr-2">
                  {directAddress 
                    ? `${directAddress.substring(0, 6)}...${directAddress.substring(38)}`
                    : address 
                      ? `${address.substring(0, 6)}...${address.substring(38)}` 
                      : "Connected"}
                </span>
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
                >
                  <FiCopy className="w-4 h-4" />
                </button>
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

        {/* Swap Card */}
        <div className="bg-gray-800 rounded-2xl p-4 shadow-xl border border-gray-700">
          {/* Settings Panel */}
          {showSettings && (
            <div className="bg-gray-700 rounded-xl p-4 mb-4">
              <h3 className="font-medium mb-3">Transaction Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Slippage Tolerance</label>
                  <div className="flex space-x-2">
                    {[0.1, 0.5, 1].map((value) => (
                      <button
                        key={value}
                        onClick={() => setSlippage(value)}
                        className={`px-3 py-1 rounded-lg text-sm ${slippage === value ? 'bg-[#00df9a] text-black' : 'bg-gray-600 hover:bg-gray-500'}`}
                      >
                        {value}%
                      </button>
                    ))}
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={slippage}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setSlippage(Math.max(0, Math.min(100, value)));
                        }}
                        className="w-full bg-gray-600 rounded-lg px-3 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-[#00df9a]"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-300">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* From Token */}
          <div className="bg-gray-700 rounded-xl p-3 mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">From</span>
              <button 
                onClick={setMaxAmount}
                className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-0.5 rounded"
              >
                Max: {formatBalance(balances[fromToken] || "0")}
              </button>
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
                Balance: {formatBalance(balances[toToken] || "0")}
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

          {/* Rate Info */}
          <div className="text-sm text-gray-400 mt-3 px-1">
            <div className="flex justify-between">
              <span>Rate</span>
              <span>
                1 {fromToken} = {exchangeRates[`${fromToken}_${toToken}`]?.toFixed(6) || '0'} {toToken}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Slippage</span>
              <span>{slippage}%</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-4">
            {!directAddress && !isConnected && !address ? (
              <button
                onClick={manualConnectWallet}
                className="w-full bg-gradient-to-r from-[#00df9a] to-blue-500 text-black font-medium py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                Connect Wallet
              </button>
            ) : !isPriorInPair() ? (
              <button 
                disabled
                className="w-full bg-gray-700 text-gray-400 font-medium py-3 rounded-xl"
              >
                Pair must include PRIOR
              </button>
            ) : parseFloat(fromAmount) > parseFloat(balances[fromToken] || "0") ? (
              <button 
                disabled
                className="w-full bg-gray-700 text-gray-400 font-medium py-3 rounded-xl"
              >
                Insufficient {fromToken} balance
              </button>
            ) : !hasAllowance ? (
              <button 
                onClick={approveToken}
                disabled={isApproving || !fromAmount || parseFloat(fromAmount) <= 0}
                className={`w-full ${isApproving ? 'bg-gray-600' : 'bg-gradient-to-r from-blue-600 to-blue-500'} text-white font-medium py-3 rounded-xl transition-colors`}
              >
                {isApproving ? (
                  <span className="flex items-center justify-center">
                    <FiRefreshCw className="animate-spin mr-2" />
                    Approving...
                  </span>
                ) : `Approve ${fromToken}`}
              </button>
            ) : (
              <button
                onClick={executeSwap}
                disabled={isSwapping || !fromAmount || parseFloat(fromAmount) <= 0}
                className={`w-full ${isSwapping ? 'bg-gray-600' : 'bg-gradient-to-r from-[#00df9a] to-blue-500'} text-black font-medium py-3 rounded-xl transition-colors`}
              >
                {isSwapping ? (
                  <span className="flex items-center justify-center">
                    <FiRefreshCw className="animate-spin mr-2" />
                    Swapping...
                  </span>
                ) : `Swap to ${toToken}`}
              </button>
            )}
          </div>
        </div>

        {/* Transaction Link */}
        {txHash && (
          <div className="mt-4 text-center">
            <a
              href={`https://sepolia-explorer.base.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00df9a] inline-flex items-center text-sm"
            >
              View transaction on explorer <FiExternalLink className="ml-1" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}