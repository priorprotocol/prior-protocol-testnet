import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Leaderboard } from "@/components/Leaderboard";
import SwapPointsSystem from "@/components/SwapPointsSystem";
import PointsHistoryDisplay from "@/components/PointsHistoryDisplay";
import { formatAddress } from "@/lib/formatAddress";
import { 
  FaExchangeAlt, 
  FaNetworkWired, 
  FaDatabase, 
  FaChartLine,
  FaTrophy,
  FaChartBar
} from "react-icons/fa";
import { FaGlobe } from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";
import { HiOutlineChartSquareBar, HiOutlineSparkles } from "react-icons/hi";
import StandaloneWalletButton from "@/components/StandaloneWalletButton";
import { ADMIN_ADDRESS } from "@/config/constants";

/**
 * Completely redesigned Dashboard page
 * Focus on accurately displaying swap points - 0.5 per swap, max 5 swaps per day (2.5 pts max)
 */
const Dashboard = () => {
  // Use standalone wallet for address
  const { address: standaloneAddress, isConnected } = useStandaloneWallet();
  const address = standaloneAddress;
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("overview");
  
  // Syncing state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Check if user is admin
  const isAdmin = address && address.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
  
  // Get user statistics
  const { 
    data: userStats, 
    isLoading: statsLoading,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['/api/users/stats', address],
    queryFn: () => {
      if (!address) return Promise.resolve(null);
      console.log(`Fetching stats for address: ${address}`);
      return apiRequest(`/api/users/${address}/stats`);
    },
    enabled: !!address,
    staleTime: 10000, // 10 seconds
    retry: 3,
    refetchOnWindowFocus: true
  });
  
  // Get user transactions
  const { 
    data: transactionsData, 
    isLoading: transactionsLoading,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['/api/users/transactions', address],
    queryFn: () => {
      if (!address) return Promise.resolve(null);
      console.log(`Fetching transactions for address: ${address}`);
      return apiRequest(`/api/users/${address}/transactions?limit=30`);
    },
    enabled: !!address,
    staleTime: 10000, // 10 seconds
    retry: 3,
    refetchOnWindowFocus: true
  });
  
  // Function to sync all data
  const syncAllData = async () => {
    if (!address) return;
    
    try {
      setIsSyncing(true);
      setSyncError(null);
      
      // First fetch on-chain data
      await apiRequest(`/api/users/${address}/sync-onchain`, {
        method: 'POST'
      });
      
      // Then refetch all data
      await Promise.all([
        refetchStats(),
        refetchTransactions()
      ]);
      
      setIsSyncing(false);
    } catch (error) {
      console.error("Error syncing data:", error);
      setSyncError("Failed to sync data. Please try again.");
      setIsSyncing(false);
    }
  };
  
  // Filter transactions to get only swap transactions
  const swapTransactions = transactionsData?.transactions?.filter((tx: { type: string }) => tx.type === 'swap') || [];
  
  // Show wallet connect prompt if no wallet is connected
  if (!isConnected || !address) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Dashboard</h2>
          <p className="text-[#A0AEC0] mb-6">Connect your wallet to view your points, activity, and rank on the Prior Protocol network.</p>
          <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-lg shadow-lg">
            <div className="mb-4">
              <FaExchangeAlt className="mx-auto text-indigo-500 mb-2" size={24} />
              <p className="text-sm text-gray-400">Earn points by swapping tokens:</p>
              <p className="text-xs text-indigo-400 mt-1">0.5 points per swap, max 5 swaps daily</p>
            </div>
            <StandaloneWalletButton size="lg" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-blue-600/10 rounded-lg blur-3xl -z-10"></div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 inline-block">
              Prior Protocol Dashboard
            </h2>
            <p className="text-blue-300/80 mt-2 max-w-2xl leading-relaxed">
              <HiOutlineSparkles className="inline-block mr-1" />
              Track your points, swaps, and rank on Prior Protocol
            </p>
          </div>
          
          {/* Sync Button */}
          <Button
            onClick={syncAllData}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-900/60 to-blue-900/60 hover:from-indigo-800/60 hover:to-blue-800/60 border border-indigo-700/30"
          >
            {isSyncing ? (
              <>
                <FiRefreshCw className="animate-spin" size={14} />
                <span>Syncing Data...</span>
              </>
            ) : (
              <>
                <FaDatabase size={14} />
                <span>Refresh Data</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - User Profile & Stats */}
        <div className="lg:col-span-3 space-y-6">
          {/* User Profile Card */}
          <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600"></div>
            <CardHeader className="pb-3 relative">
              <div className="absolute top-0 right-0 mt-4 mr-4">
                <div className="inline-flex h-6 items-center rounded-full border border-blue-800/40 bg-blue-900/20 px-2 text-xs text-blue-400">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-green-400 mr-1.5"></span>
                  Base Sepolia
                </div>
              </div>
              <div className="flex flex-col items-center mb-1">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-900 to-blue-800 flex items-center justify-center border-2 border-indigo-700/50 mb-2">
                  <span className="text-2xl font-mono text-blue-200">{address.substring(2, 4)}</span>
                </div>
                <CardTitle className="text-lg text-blue-100">{formatAddress(address)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-xs text-indigo-300/70 mb-2">Wallet Connected</div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full text-xs bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-900/30"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.disconnectWallet) {
                      window.disconnectWallet();
                    }
                  }}
                >
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Rank Card */}
          <UserRankCard address={address} />

          {/* Points Summary Card */}
          <TotalPointsSummary
            points={userStats?.points || 0}
            swaps={userStats?.totalSwaps || 0}
            isLoading={statsLoading}
          />

          {/* Admin Panel Link (only for admin) */}
          {isAdmin && (
            <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-600 to-red-600"></div>
              <CardContent className="p-4">
                <h3 className="text-amber-400 font-medium mb-2 flex items-center">
                  <FaTrophy className="mr-2" size={14} />
                  Admin Controls
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  Access admin maintenance functions
                </p>
                <Button
                  variant="outline"
                  className="w-full text-xs bg-amber-900/20 hover:bg-amber-900/30 text-amber-400 border border-amber-900/30"
                  onClick={() => window.location.href = '/admin'}
                >
                  Open Admin Panel
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="mb-6 bg-[#0F172A] border border-[#1E293B]">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-900/50 data-[state=active]:to-blue-900/50"
              >
                <div className="flex items-center gap-1.5">
                  <HiOutlineChartSquareBar className="text-sm" />
                  Activity Overview
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboard"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-900/50 data-[state=active]:to-blue-900/50"
              >
                <div className="flex items-center gap-1.5">
                  <FaChartBar className="text-sm" />
                  Global Leaderboard
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Activity Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Swap Points System */}
              <SwapPointsSystem
                points={userStats?.points || 0}
                totalSwaps={userStats?.totalSwaps || 0}
                isLoading={statsLoading || transactionsLoading}
                swapTransactions={swapTransactions}
              />
              
              {/* Points History Chart */}
              <PointsHistoryDisplay address={address} />
              
              {/* Network Info Card */}
              <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <FaNetworkWired className="text-blue-400" size={12} />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
                      Protocol Information
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Prior Protocol on Base Sepolia testnet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#1A2234] rounded-lg p-3 border border-blue-900/20">
                      <div className="text-xs text-gray-400 mb-1">Points Formula</div>
                      <div className="text-sm font-medium text-indigo-400">0.5 pts per swap</div>
                      <div className="text-xs text-gray-500 mt-1">Max 5 swaps daily</div>
                    </div>
                    <div className="bg-[#1A2234] rounded-lg p-3 border border-blue-900/20">
                      <div className="text-xs text-gray-400 mb-1">Max Daily Points</div>
                      <div className="text-sm font-medium text-indigo-400">2.5 points</div>
                      <div className="text-xs text-gray-500 mt-1">Resets at midnight UTC</div>
                    </div>
                    <div className="bg-[#1A2234] rounded-lg p-3 border border-blue-900/20">
                      <div className="text-xs text-gray-400 mb-1">Swap Fee</div>
                      <div className="text-sm font-medium text-indigo-400">0.5%</div>
                      <div className="text-xs text-gray-500 mt-1">All token pairs</div>
                    </div>
                    <div className="bg-[#1A2234] rounded-lg p-3 border border-blue-900/20">
                      <div className="text-xs text-gray-400 mb-1">Exchange Rate</div>
                      <div className="text-sm font-medium text-indigo-400">1 PRIOR = 2 USDC</div>
                      <div className="text-xs text-gray-500 mt-1">Fixed test rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard">
              <div className="space-y-6">
                <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600"></div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500 bg-opacity-20 flex items-center justify-center">
                        <FaGlobe className="text-amber-400" size={12} />
                      </div>
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-300">
                        Global Leaderboard
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Top users ranked by Prior points - 0.5 points per swap, max 5 swaps daily (2.5 pts)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Leaderboard limit={20} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Total Points Summary Component
const TotalPointsSummary = ({ points, swaps, isLoading }: { points: number, swaps: number, isLoading: boolean }) => {
  return (
    <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FaExchangeAlt className="text-indigo-500" size={14} />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-300">
            Prior Points
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400">
              {points.toFixed(1)}
            </div>
            <div className="text-xs text-gray-400 mt-1 flex items-center justify-center">
              <FaExchangeAlt className="mr-1" size={10} />
              <span>Points calculation: 0.5 points per swap</span>
            </div>
            <div className="mt-2 p-1 rounded bg-gradient-to-r from-indigo-900/30 to-blue-900/30 text-xs text-indigo-400 font-medium max-w-xs mx-auto flex items-center justify-center">
              <span className="mr-1">Total swaps:</span> {swaps} {swaps >= 5 && <span className="ml-1 text-emerald-400">(Max daily points achieved)</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// User Rank Card Component
const UserRankCard = ({ address }: { address: string }) => {
  // Fetch user rank
  const { data: userRankData, isLoading } = useQuery({
    queryKey: ["/api/users/rank", address],
    queryFn: () => apiRequest<{rank: number | null}>(`/api/users/${address}/rank`),
    staleTime: 10000, // Consider rank stale after 10 seconds
    enabled: !!address, // Only run this query if we have an address
  });

  return (
    <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600"></div>
      <CardHeader className="pb-1 pt-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <FaChartLine className="text-amber-500" size={14} />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-300">
            Your Global Rank
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-2">
            <Skeleton className="h-8 w-20" />
          </div>
        ) : (
          <div className="text-center py-1">
            {userRankData?.rank ? (
              <>
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-300">
                  #{userRankData.rank}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Out of all active users
                </div>
              </>
            ) : (
              <>
                <div className="text-xl font-semibold text-gray-500">Not Ranked</div>
                <div className="text-xs text-gray-400 mt-1">
                  Complete a swap to get ranked
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Dashboard;