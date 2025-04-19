import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import useDashboardStats from "@/hooks/useDashboardStats";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Leaderboard } from "@/components/Leaderboard";
import { PointsHistoryChart } from "@/components/PointsHistoryChart";
import { formatAddress } from "@/lib/formatAddress";
import { FaTrophy, FaLock, FaExchangeAlt, FaNetworkWired, FaRegLightbulb, FaDatabase } from "react-icons/fa";
import { FaRankingStar } from "react-icons/fa6";
import { HiOutlineChartSquareBar, HiOutlineSparkles } from "react-icons/hi";
import StandaloneWalletButton from "@/components/StandaloneWalletButton";
import { UserStats } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const Dashboard = () => {
  // Use both wallet systems for compatibility during transition
  const { userId, tokens, getTokenBalance } = useWallet();
  const { address: standaloneAddress } = useStandaloneWallet();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Prefer standalone address
  const address = standaloneAddress;
  const { toast } = useToast();
  
  // Use our custom dashboard stats hook
  const { 
    stats: userStats, 
    isLoadingStats: statsLoading,
    badges: userBadges,
    isLoadingBadges: badgesLoading,
    transactions,
    totalTransactions,
    isLoadingTransactions,
    isSyncing,
    lastSyncTime,
    syncError,
    syncTransactions
  } = useDashboardStats(address);

  // Note: We're using useDashboardStats hook now which provides all these values

  // Badge functionality has been removed

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
          <p className="text-[#A0AEC0] mb-6">Please connect your wallet to view your dashboard.</p>
          <StandaloneWalletButton 
            size="lg"
          />
        </div>
      </div>
    );
  }
  
  // Badge functionality has been removed

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-pink-600/10 rounded-lg blur-3xl -z-10"></div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 inline-block">PRIOR.AI Dashboard</h2>
        <p className="text-blue-300/80 mt-2 max-w-2xl leading-relaxed">
          <HiOutlineSparkles className="inline-block mr-1" />
          Track your activity on the PRIOR Protocol network with AI-enhanced analytics
        </p>
      </div>

      {/* AI-themed Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Stats & Wallet Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Profile */}
          <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600"></div>
            <CardHeader className="pb-3 relative">
              <div className="absolute top-0 right-0 mt-4 mr-4">
                <div className="inline-flex h-6 items-center rounded-full border border-blue-800/40 bg-blue-900/20 px-2 text-xs text-blue-500">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-green-400 mr-1.5"></span>
                  Base Sepolia
                </div>
              </div>
              <div className="flex flex-col items-center mb-1">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-900 to-indigo-800 flex items-center justify-center border-2 border-blue-700/50 mb-2">
                  <span className="text-2xl font-mono text-blue-200">{address.substring(2, 4)}</span>
                </div>
                <CardTitle className="text-lg text-blue-100">{formatAddress(address)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-xs text-blue-300/70 mb-2">Wallet Connected</div>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.disconnectWallet) {
                      window.disconnectWallet();
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-900/30 bg-red-900/10 rounded-md"
                >
                  Disconnect
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Total Points Summary */}
          <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600"></div>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FaTrophy className="text-amber-500" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-300">Points Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-20 flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                  <p className="ml-2 text-[#A0AEC0] text-sm">Processing data...</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-xl"></div>
                    <div className="relative bg-[#1A2234] rounded-2xl p-4 border border-blue-900/50">
                      <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                        {userStats?.points || 0}
                      </div>
                      <div className="text-xs text-blue-400 mt-1">Prior Points</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-left space-y-1.5 bg-[#1A2234] p-3 rounded-md border border-blue-900/50">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center">
                        <FaExchangeAlt className="mr-1.5 text-blue-500" size={12} />
                        Swap Points
                      </span>
                      <span className="font-medium text-blue-400">0.5 pts/swap</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Daily Limit</span>
                      <span className="font-medium text-emerald-400">5 swaps max</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Max Daily</span>
                      <span className="font-medium text-amber-400">2.5 pts</span>
                    </div>
                    <div className="mt-2 text-center text-blue-300/70 text-[10px]">
                      All points convert to PRIOR tokens at TGE
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync Transactions Button */}
          <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
            <CardContent className="p-3">
              {isSyncing ? (
                <div className="flex items-center justify-center bg-blue-900/20 rounded-md py-2">
                  <div className="w-4 h-4 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mr-2"></div>
                  <span className="text-xs text-blue-300">Refreshing data...</span>
                </div>
              ) : (
                <button 
                  onClick={syncTransactions}
                  className="w-full text-sm bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 rounded-md py-2 border border-blue-800/50 hover:bg-blue-900/30 flex items-center justify-center"
                >
                  <FaDatabase className="mr-1.5" size={12} />
                  Refresh Data
                </button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-6 bg-[#0F172A] border border-[#1E293B]">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-900/50 data-[state=active]:to-purple-900/50"
              >
                <div className="flex items-center gap-1.5">
                  <HiOutlineChartSquareBar className="text-sm" />
                  Activity Overview
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboard"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-900/50 data-[state=active]:to-purple-900/50"
              >
                <div className="flex items-center gap-1.5">
                  <FaRankingStar className="text-sm" />
                  Global Leaderboard
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Swap Activity Card */}
              <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600"></div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 bg-opacity-20 flex items-center justify-center">
                      <FaExchangeAlt className="text-indigo-400" size={12} />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
                      Swap Activity
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Your swaps on Prior Protocol, earning 0.5 points per swap (max 5 daily)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="h-32 flex items-center justify-center">
                      <div className="w-6 h-6 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                      <p className="ml-2 text-[#A0AEC0]">Analyzing your activity...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Swap Stats */}
                      <div className="bg-[#1A2234] rounded-lg border border-indigo-900/30 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm text-indigo-300">Total Swaps</div>
                          <div className="text-3xl font-bold text-white">{userStats?.totalSwaps || 0}</div>
                        </div>
                        
                        <div className="mt-2 border-t border-indigo-900/30 pt-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Points Earned</span>
                            <span className="text-xl font-semibold text-indigo-400">
                              {userStats && userStats.totalSwaps > 0 ? 
                                Math.min(userStats.totalSwaps * 0.5, 2.5).toFixed(1) : "0"}
                            </span>
                          </div>
                          
                          <div className="mt-2 text-xs flex items-center gap-2">
                            <div className="px-2 py-0.5 rounded bg-indigo-900/20 border border-indigo-900/30 text-indigo-400">
                              0.5 pts per swap
                            </div>
                            <div className="px-2 py-0.5 rounded bg-emerald-900/20 border border-emerald-900/30 text-emerald-400">
                              First 5 swaps only
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Recent Transactions */}
                      <div className="bg-[#1A2234] rounded-lg border border-blue-900/30 p-4">
                        <div className="text-sm text-blue-300 mb-2">Recent Activity</div>
                        
                        {isLoadingTransactions ? (
                          <div className="flex justify-center py-6">
                            <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                          </div>
                        ) : transactions && transactions.length > 0 ? (
                          <div className="space-y-2">
                            {transactions.slice(0, 4).map((tx: any, i: number) => (
                              <div key={i} className="text-xs bg-[#0F172A] p-2 rounded flex justify-between items-center border border-blue-900/30">
                                <div className="flex items-center">
                                  <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center mr-2">
                                    {tx.type === 'swap' ? 
                                      <FaExchangeAlt className="text-indigo-400" size={10} /> : 
                                      <FaDatabase className="text-cyan-400" size={10} />
                                    }
                                  </div>
                                  <div>
                                    <span className={tx.type === 'swap' ? 'text-indigo-400' : 'text-cyan-400'}>
                                      {tx.type === 'swap' ? 'Swap' : 'Faucet Claim'}
                                    </span>
                                    <span className="text-[#A0AEC0] ml-1 text-[10px]">
                                      {new Date(tx.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs">
                                  {tx.type === 'swap' && 
                                    <span className="text-blue-400">+0.5 pts</span>
                                  }
                                </div>
                              </div>
                            ))}
                            {transactions.length > 4 && (
                              <div className="text-center text-xs mt-2">
                                <Link to="/transactions" className="text-blue-400 hover:text-blue-300 hover:underline">
                                  View all {totalTransactions} transactions
                                </Link>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-400 text-sm">
                            No transactions recorded yet
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Points History Chart */}
              {address && <PointsHistoryChart address={address} className="mb-6" />}
              
              {/* Network Activity Card */}
              <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600"></div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500 bg-opacity-20 flex items-center justify-center">
                      <FaNetworkWired className="text-purple-400" size={12} />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
                      Network Status
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Prior Protocol on Base Sepolia testnet - PRIOR token metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#1A2234] rounded-lg p-3 border border-purple-900/20">
                      <div className="text-xs text-gray-400 mb-1">PRIOR Token</div>
                      <div className="text-lg font-bold text-purple-300">Testnet</div>
                      <div className="text-xs text-gray-500 mt-1">Base Sepolia Chain</div>
                    </div>
                    <div className="bg-[#1A2234] rounded-lg p-3 border border-purple-900/20">
                      <div className="text-xs text-gray-400 mb-1">Exchange Rate</div>
                      <div className="text-lg font-bold text-purple-300">1 : 2</div>
                      <div className="text-xs text-gray-500 mt-1">PRIOR : USDC</div>
                    </div>
                    <div className="bg-[#1A2234] rounded-lg p-3 border border-purple-900/20">
                      <div className="text-xs text-gray-400 mb-1">Swap Fee</div>
                      <div className="text-lg font-bold text-purple-300">0.5%</div>
                      <div className="text-xs text-gray-500 mt-1">All pairs</div>
                    </div>
                    <div className="bg-[#1A2234] rounded-lg p-3 border border-purple-900/20">
                      <div className="text-xs text-gray-400 mb-1">Faucet Limit</div>
                      <div className="text-lg font-bold text-purple-300">1 PRIOR</div>
                      <div className="text-xs text-gray-500 mt-1">Every 24 hours</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="leaderboard" className="space-y-6">
              {/* Leaderboard Info Card */}
              <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600"></div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500 bg-opacity-20 flex items-center justify-center">
                      <FaRegLightbulb className="text-amber-400" size={12} />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-300">
                      Points & Rewards
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Prior Protocol rewards system explained
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-[#1A2234] border border-amber-900/30 rounded-md p-4 text-sm">
                    <p className="text-gray-300 mb-2">
                      Points will be converted to PRIOR tokens at TGE (Token Generation Event).
                    </p>
                    <div className="text-gray-400 space-y-2 mt-3">
                      <div className="flex items-start gap-2">
                        <div className="min-w-5 mt-0.5">
                          <div className="w-4 h-4 rounded-full bg-blue-900/30 flex items-center justify-center">
                            <span className="text-[10px] text-blue-500">1</span>
                          </div>
                        </div>
                        <p><span className="text-blue-400">0.5 Prior points</span> per swap transaction</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="min-w-5 mt-0.5">
                          <div className="w-4 h-4 rounded-full bg-blue-900/30 flex items-center justify-center">
                            <span className="text-[10px] text-blue-500">2</span>
                          </div>
                        </div>
                        <p>Maximum of <span className="text-emerald-400">5 swaps</span> count toward points each day</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="min-w-5 mt-0.5">
                          <div className="w-4 h-4 rounded-full bg-blue-900/30 flex items-center justify-center">
                            <span className="text-[10px] text-blue-500">3</span>
                          </div>
                        </div>
                        <p>Maximum <span className="text-amber-400">2.5 Prior points</span> earned daily</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* User Stats Card */}
              {userId && userStats && (
                <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600"></div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Your Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div className="bg-[#1A2234] p-4 rounded-md text-center border border-blue-900/30">
                        <p className="text-xs text-blue-400 mb-1">Total Prior Points</p>
                        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                          {userStats?.points || 0}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          All points convert to PRIOR at TGE
                        </p>
                      </div>
                      <div className="bg-[#1A2234] p-4 rounded-md text-center border border-indigo-900/30">
                        <p className="text-xs text-indigo-400 mb-1">Swap Activity</p>
                        <p className="text-2xl font-bold text-white">
                          {userStats?.totalSwaps || 0} <span className="text-sm">swaps</span>
                        </p>
                        <div className="mt-2 inline-flex items-center bg-[#111827] rounded px-2 py-1 text-xs">
                          <span className="text-indigo-400">
                            {userStats?.totalSwaps ? 
                              `${Math.min(userStats.totalSwaps * 0.5, 2.5).toFixed(1)} pts earned` : 
                              "No points yet"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Global Leaderboard */}
              <Leaderboard limit={15} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;