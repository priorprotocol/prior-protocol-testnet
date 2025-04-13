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
    
    // Parse the balance
    const parsedBalance = parseFloat(rawBalance);
    
    // Format based on token type
    if (token.symbol === "PRIOR") {
      // For PRIOR, display with cleaner formatting (no scientific notation)
      if (parsedBalance >= 1) {
        return parsedBalance.toFixed(2).replace(/\.?0+$/, '');
      } else {
        return parsedBalance.toFixed(4).replace(/\.?0+$/, '');
      }
    } else {
      // For stablecoins (USDC, USDT), handle large values specially
      // Check if this is a testnet with very large values (more than 1 million)
      if (parsedBalance > 1000000) {
        // For extremely large testnet values, show a more reasonable representation
        // Divide by 10^8 to convert from testnet large value to a reasonable display value
        const displayValue = parsedBalance / 100000000;
        return displayValue.toFixed(2).replace(/\.?0+$/, '');
      } else {
        // Normal case for reasonable stablecoin values, display with 2 decimal places
        return parsedBalance.toFixed(2).replace(/\.?0+$/, '');
      }
    }
  };
  
  // Get the token balance from the wallet context
  const rawBalance = getTokenBalance(token.symbol);
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
