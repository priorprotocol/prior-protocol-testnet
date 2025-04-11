import React from "react";
import { useWallet } from "@/context/WalletContext";
import { TokenInfo } from "@/types";

interface TokenCardProps {
  token: TokenInfo;
}

const TokenCard: React.FC<TokenCardProps> = ({ token }) => {
  // Initialize with default values
  let getTokenBalance = (_symbol: string) => "0.00";
  
  // Only use the wallet context if it's available
  try {
    const wallet = useWallet();
    getTokenBalance = wallet.getTokenBalance;
  } catch (error) {
    console.log("Wallet context not available yet in TokenCard component");
  }
  
  // Format the balance based on token type and decimals
  const formatBalance = (rawBalance: string): string => {
    // If no balance or invalid, return 0
    if (!rawBalance || isNaN(parseFloat(rawBalance))) {
      return '0.00';
    }
    
    // For USDC and USDT which should display with less decimals
    if (token.symbol === 'USDC' || token.symbol === 'USDT') {
      // Parse the balance and format 
      const value = parseFloat(rawBalance);
      // If the value is extremely large, it's likely a decimal formatting issue
      if (value > 10000) {
        // Assume we need to divide by 10^12 for proper display (from e18 to e6)
        return (value / 1000000000000).toFixed(2);
      }
      return value.toFixed(2);
    }
    
    // For PRIOR and other tokens, use regular formatting
    const value = parseFloat(rawBalance);
    return value.toFixed(4);
  };
  
  // Use the token's balance if provided, otherwise get it from the wallet context
  const rawBalance = token.balance || getTokenBalance(token.symbol);
  const balance = formatBalance(rawBalance);

  return (
    <div className="gradient-border bg-[#141D29] p-4 shadow-lg">
      <div className="flex items-center mb-2">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
          style={{ backgroundColor: token.logoColor }}
        >
          {token.symbol === "PRIOR" ? (
            <span className="font-bold text-sm">P</span>
          ) : token.symbol === "WETH" ? (
            <span className="font-bold text-sm">Ξ</span>
          ) : (
            <span className="font-bold text-sm">$</span>
          )}
        </div>
        <span className="font-medium">{token.symbol}</span>
      </div>
      <div className="text-2xl font-bold mb-1 font-space">{balance}</div>
      <div className="text-xs text-[#A0AEC0]">{token.name}</div>
    </div>
  );
};

export default TokenCard;
