import React, { useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import { TransactionHistory } from "@/components/TransactionHistory";
import StandaloneWalletButton from "@/components/StandaloneWalletButton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FaHistory } from "react-icons/fa";

const Transactions = () => {
  // Use both wallet systems for compatibility during transition
  const { address, isConnected: isWalletConnected } = useWallet();
  const { address: standaloneAddress, isConnected: isStandaloneConnected } = useStandaloneWallet();
  
  // Prefer standalone address
  const userAddress = standaloneAddress || address;
  const isAnyWalletConnected = isStandaloneConnected || isWalletConnected;

  useEffect(() => {
    // Log that the transactions page was loaded
    console.log("Transactions page loaded. User address:", userAddress || "Not connected");
  }, [userAddress]);

  if (!userAddress || !isAnyWalletConnected) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-[#0F172A] border-[#1E293B] mb-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <FaHistory className="mr-2 text-blue-400" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  Transaction History
                </span>
              </CardTitle>
              <CardDescription>
                View your complete on-chain activity with Prior Protocol
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-10">
              <p className="text-[#A0AEC0] mb-6 max-w-md mx-auto">
                Please connect your wallet to view your transaction history on Base Sepolia testnet.
              </p>
              <StandaloneWalletButton size="lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-[#0F172A] border-[#1E293B] mb-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FaHistory className="mr-2 text-blue-400" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Transaction History
              </span>
            </CardTitle>
            <CardDescription>
              View your complete on-chain activity with Prior Protocol
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionHistory address={userAddress} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Transactions;