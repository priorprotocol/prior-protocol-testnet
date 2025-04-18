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
import { formatAddress } from "@/lib/formatAddress";
import { FaTrophy, FaLock, FaRankingStar } from "react-icons/fa6";
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
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Your Dashboard</h2>
        <p className="text-[#A0AEC0] mt-2">Track your activity and achievements in the Prior Protocol testnet</p>
      </div>

      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">
            <div className="flex items-center gap-1">
              <FaRankingStar className="text-xs" />
              Leaderboard
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Points Summary Card - New professional design with updated point system */}
          <Card className="bg-[#111827] border-[#2D3748] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center">
                  <FaTrophy className="text-blue-500" />
                </div>
                Points Summary
              </CardTitle>
              <CardDescription>Your point earnings from swaps - 0.5 points per swap, max 5 swaps daily</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                  <p className="ml-2 text-[#A0AEC0]">Loading your stats...</p>
                </div>
              ) : (
                <div>
                  {/* Total Points Counter - New Design */}
                  <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800/50 rounded-lg p-5 mb-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-2">
                          Points Earned 
                          {statsLoading && <span className="ml-2 inline-block w-4 h-4 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></span>}
                        </h3>
                        <p className="text-blue-300 text-sm">All points will be converted to PRIOR at TGE</p>
                      </div>
                      <div className="mt-4 md:mt-0 text-center md:text-right">
                        <div className="inline-block bg-gradient-to-r from-blue-900/60 to-purple-900/60 rounded-lg p-4 border border-blue-700/40">
                          {statsLoading ? (
                            <div className="h-12 flex items-center justify-center">
                              <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mr-2"></div>
                              <span className="text-blue-300">Loading...</span>
                            </div>
                          ) : (
                            <>
                              <span className="text-5xl font-bold text-white">{userStats?.points || 0}</span>
                              <span className="ml-2 text-blue-300">pts</span>
                            </>
                          )}
                        </div>
                        
                        {/* NEW Points system breakdown */}
                        <div className="mt-3 text-left bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
                          <div className="text-xs text-blue-200 font-medium mb-2">New Points System:</div>
                          <div className="text-xs space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Swaps:</span>
                              <span className="text-blue-300 font-medium">0.5 pts per swap</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Daily Limit:</span>
                              <span className="text-blue-300 font-medium">First 5 swaps only</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-emerald-300 font-medium">Maximum 2.5 pts earned daily</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Activity Cards Grid - Simplified to show only what matters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Swaps Card - Updated with new points system */}
                    <div className="bg-[#1E2A3B] rounded-lg border border-[#2D3748] p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 bg-opacity-20 flex items-center justify-center mr-3">
                            <i className="fas fa-exchange-alt text-indigo-400"></i>
                          </div>
                          <div>
                            <h4 className="font-medium">Total Swaps</h4>
                            <div className="flex items-center mt-1">
                              <span className="text-2xl font-bold text-white">{userStats?.totalSwaps || 0}</span>
                            </div>
                            <div className="mt-1 bg-indigo-900/20 border border-indigo-800/20 rounded-sm px-2 py-1">
                              <p className="text-xs text-indigo-300">
                                <i className="fas fa-info-circle mr-1"></i>
                                Swap count persists across sessions
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xl">
                            {/* Calculate potential points based on NEW system */}
                            {userStats && userStats.totalSwaps > 0 ? 
                              Math.min(userStats.totalSwaps * 0.5, 2.5).toFixed(1) : "0"}
                          </div>
                          <div className="flex flex-col text-xs space-y-1 mt-1">
                            <span className="text-blue-400 bg-blue-900/20 rounded px-2 py-0.5">+0.5 pts per swap</span>
                            <span className="text-emerald-400 bg-emerald-900/20 rounded px-2 py-0.5">
                              First 5 swaps of the day only
                            </span>
                            <span className="text-amber-400 text-[10px]">Max 2.5 Prior pts per day</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Transaction History Card */}
                    <div className="bg-[#1E2A3B] rounded-lg border border-[#2D3748] p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-cyan-600 bg-opacity-20 flex items-center justify-center mr-3">
                            <i className="fas fa-history text-cyan-400"></i>
                          </div>
                          <div>
                            <h4 className="font-medium">Transaction History</h4>
                            <div className="flex items-center mt-1">
                              <span className="text-sm text-[#A0AEC0]">View your recent activity</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          {isSyncing ? (
                            <div className="flex items-center bg-blue-900/20 rounded px-3 py-1.5">
                              <div className="w-4 h-4 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mr-2"></div>
                              <span className="text-xs text-blue-300">Syncing...</span>
                            </div>
                          ) : (
                            <button 
                              onClick={syncTransactions}
                              className="text-xs bg-blue-900/20 border border-blue-800/30 text-blue-400 rounded px-3 py-1.5 hover:bg-blue-900/30"
                            >
                              <i className="fas fa-sync-alt mr-1"></i> Sync Transactions
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Recent Transactions */}
                      <div className="mt-3 border-t border-[#2D3748] pt-3">
                        {isLoadingTransactions ? (
                          <div className="flex justify-center py-3">
                            <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                          </div>
                        ) : transactions && transactions.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {transactions.slice(0, 3).map((tx: any, i: number) => (
                              <div key={i} className="text-xs bg-[#131B29] p-2 rounded flex justify-between items-center">
                                <div>
                                  <span className={tx.type === 'swap' ? 'text-indigo-400' : 'text-cyan-400'}>
                                    {tx.type === 'swap' ? 'Swap' : 'Faucet Claim'}
                                  </span>
                                  <span className="text-[#A0AEC0] ml-1">
                                    {new Date(tx.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="text-xs">
                                  {tx.type === 'swap' && 
                                    <span className="text-blue-400">+0.5 pts</span>
                                  }
                                </div>
                              </div>
                            ))}
                            {transactions.length > 3 && (
                              <div className="text-center text-xs text-blue-400 hover:underline">
                                <Link to="/transactions">View all {totalTransactions} transactions</Link>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-2 text-xs text-[#A0AEC0]">
                            No transactions found
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Wallet Connection Card */}
          <Card className="bg-[#111827] border-[#2D3748]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center">
                  <i className="fas fa-wallet text-green-500 text-xs"></i>
                </div>
                Wallet Info
              </CardTitle>
              <CardDescription>Your connected Base Sepolia wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-[#1E2A3B] rounded-lg border border-[#2D3748] p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <div className="text-[#A0AEC0] text-xs mb-1">Wallet Address</div>
                    <div className="font-mono text-sm bg-[#131B29] p-2 rounded border border-[#2D3748] break-all">
                      {formatAddress(address || '')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#A0AEC0] text-xs mb-1">Network</div>
                    <div className="flex items-center gap-2 bg-[#131B29] p-2 rounded border border-[#2D3748]">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm">Base Sepolia</span>
                    </div>
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.disconnectWallet) {
                          window.disconnectWallet();
                        }
                      }}
                      className="w-full mt-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-900/30 bg-red-900/10 rounded-md"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Badges tab content has been removed */}
        
        <TabsContent value="leaderboard" className="space-y-6">
          <div className="space-y-4">
            <div className="px-1">
              <h3 className="text-xl font-semibold mb-1">Prior Protocol Leaderboard</h3>
              <p className="text-[#A0AEC0]">
                Top users ranked by Prior Points from swap activity. The new points system:
                <ul className="list-disc list-inside mt-1 ml-2">
                  <li><span className="text-blue-400">0.5 Prior points</span> per swap</li>
                  <li><span className="text-emerald-400">Maximum 5 swaps</span> count toward points each day</li>
                  <li><span className="text-indigo-400">2.5 Prior points</span> maximum daily earnings</li>
                </ul>
                <strong className="block mt-1">All points will be converted to PRIOR tokens at Token Generation Event (TGE).</strong>
              </p>
            </div>
            
            {/* User Stats Card */}
            {userId && userStats && (
              <Card className="bg-[#111827] border-[#2D3748]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Your Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div className="bg-[#1E2A3B] p-4 rounded-md text-center">
                      <p className="text-xs text-[#A0AEC0] mb-1">Total Prior Points</p>
                      <p className="text-2xl font-bold">{userStats?.points || 0}</p>
                      <p className="text-xs text-[#A0AEC0] mt-1 italic">
                        All Prior points convert to PRIOR at TGE
                      </p>
                    </div>
                    <div className="bg-[#1E2A3B] p-4 rounded-md text-center">
                      <p className="text-xs text-[#A0AEC0] mb-1">Swap Activity</p>
                      <p className="text-xl font-bold">
                        {userStats?.totalSwaps || 0} swaps
                      </p>
                      <div className="mt-2 flex items-center justify-center">
                        <div className="text-xs bg-blue-900/20 border border-blue-800/30 rounded-lg px-3 py-1">
                          <span className="text-blue-400">
                            {userStats?.totalSwaps ? 
                              `${Math.min(userStats.totalSwaps * 0.5, 2.5).toFixed(1)} pts earned` : 
                              "No points yet"}
                          </span>
                          <span className="block text-[10px] text-gray-400 mt-0.5">
                            0.5 pts per swap (max 5 swaps)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Global Leaderboard */}
            <Leaderboard limit={15} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;