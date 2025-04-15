import React, { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RefreshCw, ChevronRight, ChevronLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

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
  points?: number; // Points allocated for this transaction
}

interface TransactionResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  hasMore: boolean;
}

export const TransactionHistory: React.FC = () => {
  const { address, isConnected, userId } = useWallet();
  const { address: standaloneAddress } = useStandaloneWallet();
  
  // Use whichever address is available
  const userAddress = address || standaloneAddress;
  const [transactionData, setTransactionData] = useState<TransactionResponse>({
    transactions: [],
    total: 0,
    page: 1,
    hasMore: false
  });
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchTransactions = async (type?: string, page: number = 1, limit: number = 10) => {
    // If we don't have an address or userId, we can't fetch transactions
    if (!userAddress && !userId) {
      console.log("No user address or ID available");
      return;
    }
    
    setLoading(true);
    try {
      // Prefer using userId if available for consistent tracking
      const apiPath = userId 
        ? `/api/users/${userId}/transactions` 
        : `/api/users/${userAddress}/transactions`;
      
      const typeSegment = type && type !== "all" ? `/${type}` : "";
      const queryParams = `?page=${page}&limit=${limit}`;
      
      const apiUrl = `${apiPath}${typeSegment}${queryParams}`;
      
      console.log("Fetching transactions from endpoint:", apiUrl, "for user:", userAddress || userId);
      
      try {
        const data = await apiRequest<TransactionResponse>(apiUrl);
        console.log("Received transactions:", data);
        
        if (data && data.transactions) {
          setTransactionData(data);
        } else {
          console.warn("No transaction data received or empty transactions array");
          setTransactionData({
            transactions: [],
            total: 0,
            page: 1,
            hasMore: false
          });
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        // Reset transaction data on error
        setTransactionData({
          transactions: [],
          total: 0,
          page: 1,
          hasMore: false
        });
      }
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load transactions when component mounts or wallet changes
  useEffect(() => {
    if (isConnected) {
      if (userAddress || userId) {
        console.log("TransactionHistory: Wallet connected, fetching transactions for:", userAddress || userId);
        fetchTransactions(activeTab !== "all" ? activeTab : undefined, currentPage);
      } else {
        console.log("TransactionHistory: Wallet connected but no address or userId");
      }
    } else {
      console.log("TransactionHistory: Wallet not connected");
    }
  }, [isConnected, address, standaloneAddress, userAddress, userId, activeTab, currentPage]);
  
  // Manual refresh button
  const handleRefresh = () => {
    console.log("TransactionHistory: Manual refresh triggered");
    fetchTransactions(activeTab !== "all" ? activeTab : undefined, currentPage);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1); // Reset to page 1 when changing tabs
  };
  
  const handleNextPage = () => {
    if (transactionData.hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
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
            <div className="mt-1">
              {tx.points && tx.points > 0 ? (
                <Badge className="bg-green-600">+{tx.points} points</Badge>
              ) : (
                <Badge variant="outline" className="text-gray-400">No points</Badge>
              )}
            </div>
          </div>
        )}
        
        {tx.type === "faucet_claim" && (
          <div className="text-sm">
            <div>Received: {formatAmount(tx.toAmount, tx.toToken)}</div>
            <div className="mt-1">
              <Badge variant="outline" className="text-gray-400">No points</Badge>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 truncate mt-1">
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
          onClick={handleRefresh}
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
            ) : transactionData.transactions.length > 0 ? (
              <>
                <div>
                  {transactionData.transactions.map(renderTransactionItem)}
                </div>
                
                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {transactionData.transactions.length} of {transactionData.total} transactions
                    {transactionData.total > 0 && ` (Page ${currentPage})`}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage <= 1 || loading}
                    >
                      <ChevronLeft size={16} />
                      <span className="ml-1">Previous</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!transactionData.hasMore || loading}
                    >
                      <span className="mr-1">Next</span>
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              </>
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