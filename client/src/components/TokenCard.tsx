import React, { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { TokenInfo } from "@/types";
import { CORRECT_ADDRESSES, clearTokenCache } from "@/lib/forceCorrectAddresses";

interface TokenCardProps {
  token: TokenInfo;
  forceBalance?: string; // Optional prop to force a specific balance value
}

const TokenCard: React.FC<TokenCardProps> = ({ token, forceBalance }) => {
  // State variables
  const [displayBalance, setDisplayBalance] = useState<string>("0.00");
  const [correctedToken, setCorrectedToken] = useState<TokenInfo>({...token});
  
  // Initialize with default values
  let getTokenBalance = (_symbol: string) => "0.00";
  
  // Only use the wallet context if it's available
  try {
    const wallet = useWallet();
    getTokenBalance = wallet.getTokenBalance;
  } catch (error) {
    console.log("Wallet context not available yet in TokenCard component");
  }
  
  // First ensure we're using correct contract addresses
  useEffect(() => {
    let needsUpdate = false;
    const updatedToken = {...token}; // Create a copy to avoid mutating props
    
    // Check if the token address is correct, if not prepare an update
    if (token.symbol === "PRIOR" && token.address.toLowerCase() !== CORRECT_ADDRESSES.PRIOR_TOKEN.toLowerCase()) {
      console.warn(`Using correct PRIOR token address: ${CORRECT_ADDRESSES.PRIOR_TOKEN}`);
      updatedToken.address = CORRECT_ADDRESSES.PRIOR_TOKEN;
      needsUpdate = true;
    } else if (token.symbol === "USDC" && token.address.toLowerCase() !== CORRECT_ADDRESSES.USDC_TOKEN.toLowerCase()) {
      console.warn(`Using correct USDC token address: ${CORRECT_ADDRESSES.USDC_TOKEN}`);
      updatedToken.address = CORRECT_ADDRESSES.USDC_TOKEN;
      needsUpdate = true;
    }
    
    // If we needed to update the address, set the local state and clear cache
    if (needsUpdate) {
      setCorrectedToken(updatedToken);
      clearTokenCache();
    } else {
      setCorrectedToken(token);
    }
  }, [token]);
  
  // Format the balance based on token type and decimals
  const formatBalance = (rawBalance: string): string => {
    // If no balance or invalid, return 0
    if (!rawBalance || isNaN(parseFloat(rawBalance))) {
      return correctedToken.symbol === "PRIOR" ? '0.0000' : '0.00';
    }
    
    // Parse the balance
    const parsedBalance = parseFloat(rawBalance);
    
    // Format based on token type
    if (correctedToken.symbol === "PRIOR") {
      // Standard display for PRIOR values
      if (parsedBalance >= 1) {
        return parsedBalance.toFixed(2).replace(/\.?0+$/, '');
      } else if (parsedBalance >= 0.01) {
        return parsedBalance.toFixed(4).replace(/\.?0+$/, '');
      } else if (parsedBalance > 0) {
        // For very small non-zero values, show something meaningful
        return parsedBalance.toFixed(6).replace(/\.?0+$/, '');
      } else {
        return '0.0000';
      }
    } else {
      // For stablecoins (USDC), always use 2 decimal places
      return parsedBalance.toFixed(2);
    }
  };
  
  // Update balance display
  useEffect(() => {
    // Get the raw balance of the corrected token
    const rawBalance = getTokenBalance(correctedToken.symbol);
    
    // If a force balance is provided, use that instead of the wallet balance
    if (forceBalance !== undefined) {
      console.log(`Using forced balance for ${correctedToken.symbol}: ${forceBalance}`);
      setDisplayBalance(formatBalance(forceBalance));
    } else {
      // Otherwise use the balance from the wallet
      const formattedBalance = formatBalance(rawBalance);
      setDisplayBalance(formattedBalance);
      
      // Debug logging
      console.log(`TokenCard updated ${correctedToken.symbol} balance: ${formattedBalance} (raw: ${rawBalance})`);
      console.log(`Using ${correctedToken.symbol} address: ${correctedToken.address}`);
    }
    
    // Clear any cache that might interfere with balance display
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lastPriorSwap');
      localStorage.removeItem('tokenBalances');
      localStorage.removeItem('cachedBalances');
    }
  }, [correctedToken, forceBalance]);
  
  return (
    <div className="gradient-border bg-[#141D29] p-4 shadow-lg">
      <div className="flex items-center mb-2">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
          style={{ backgroundColor: correctedToken.logoColor }}
        >
          {correctedToken.symbol === "PRIOR" ? (
            <span className="font-bold text-sm">P</span>
          ) : correctedToken.symbol === "WETH" ? (
            <span className="font-bold text-sm">Ξ</span>
          ) : (
            <span className="font-bold text-sm">$</span>
          )}
        </div>
        <span className="font-medium">{correctedToken.symbol}</span>
      </div>
      <div className="text-2xl font-bold mb-1 font-space">{displayBalance}</div>
      <div className="text-xs text-[#A0AEC0]">{correctedToken.name}</div>
    </div>
  );
};

export default TokenCard;
