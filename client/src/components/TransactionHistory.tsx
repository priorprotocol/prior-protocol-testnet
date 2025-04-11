import React, { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  id: number;
  type: string;
  txHash: string;
  fromToken: string | null;
  toToken: string | null;
  fromAmount: string | null;
  toAmount: string | null;
  timestamp: string;
  status: string;
  blockNumber: number | null;
}

export const TransactionHistory: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchTransactions = async (type?: string) => {
    if (!address) return;
    
    setLoading(true);
    try {
      const endpoint = type && type !== "all" 
        ? `/api/users/${address}/transactions/${type}`
        : `/api/users/${address}/transactions`;
        
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchTransactions(activeTab !== "all" ? activeTab : undefined);
    }
  }, [isConnected, address, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "faucet_claim":
        return "Faucet Claim";
      case "swap":
        return "Token Swap";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getExplorerLink = (txHash: string) => {
    // Use Base Sepolia explorer
    return `https://sepolia.basescan.org/tx/${txHash}`;
  };

  const formatAmount = (amount: string | null, token: string | null) => {
    if (!amount || !token) return "";
    return `${amount} ${token}`;
  };

  const renderTransactionItem = (tx: Transaction) => {
    return (
      <div key={tx.id} className="py-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-medium">{getTransactionLabel(tx.type)}</div>
            <div className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(tx.status)}
            <a 
              href={getExplorerLink(tx.txHash)} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
        
        {tx.type === "swap" && (
          <div className="text-sm">
            <div>
              From: {formatAmount(tx.fromAmount, tx.fromToken)}
            </div>
            <div>
              To: {formatAmount(tx.toAmount, tx.toToken)}
            </div>
          </div>
        )}
        
        {tx.type === "faucet_claim" && (
          <div className="text-sm">
            Received: {formatAmount(tx.toAmount, tx.toToken)}
          </div>
        )}
        
        <div className="text-xs text-gray-500 truncate">
          Tx: {tx.txHash.substring(0, 10)}...{tx.txHash.substring(tx.txHash.length - 8)}
        </div>
        
        <Separator className="mt-3" />
      </div>
    );
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">
            Connect your wallet to view transaction history
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transaction History</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchTransactions(activeTab !== "all" ? activeTab : undefined)}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span className="ml-2">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="faucet_claim">Faucet Claims</TabsTrigger>
            <TabsTrigger value="swap">Swaps</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw size={24} className="animate-spin text-gray-500" />
              </div>
            ) : transactions.length > 0 ? (
              <div>
                {transactions.map(renderTransactionItem)}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                No {activeTab !== "all" ? getTransactionLabel(activeTab).toLowerCase() : ""} transactions found
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};