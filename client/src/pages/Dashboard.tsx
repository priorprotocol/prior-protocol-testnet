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
import { TransactionHistory } from "@/components/TransactionHistory";
import { formatAddress } from "@/lib/formatAddress";
import { FaTrophy, FaLock, FaRankingStar } from "react-icons/fa6";
import { RefreshCw } from "lucide-react";
import StandaloneWalletButton from "@/components/StandaloneWalletButton";
import { UserStats } from "@/types";
import { useToast } from "@/hooks/use-toast";

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
          <TabsTrigger value="activity">Activity History</TabsTrigger>
          <TabsTrigger value="leaderboard">
            <div className="flex items-center gap-1">
              <FaRankingStar className="text-xs" />
              Leaderboard
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Points Summary Card - New professional design */}
          <Card className="bg-[#111827] border-[#2D3748] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center">
                  <FaTrophy className="text-blue-500" />
                </div>
                Points Summary
              </CardTitle>
              <CardDescription>Your point earnings across all activities</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                  <p className="ml-2 text-[#A0AEC0]">Loading your stats...</p>
                </div>
              ) : (
                <div>
                  {/* Total Points Counter */}
                  <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800/50 rounded-lg p-5 mb-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-2">Total Points Earned</h3>
                        <p className="text-blue-300 text-sm">All points will be converted to PRIOR at TGE</p>
                      </div>
                      <div className="mt-4 md:mt-0">
                        <span className="text-4xl font-bold text-white">{userStats?.points || 0}</span>
                        <span className="ml-2 text-blue-300">pts</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Activity Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Swaps Card */}
                    <div className="bg-[#1E2A3B] rounded-lg border border-[#2D3748] p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 bg-opacity-20 flex items-center justify-center mr-3">
                            <i className="fas fa-exchange-alt text-indigo-400"></i>
                          </div>
                          <div>
                            <h4 className="font-medium">Swaps</h4>
                            <p className="text-[#A0AEC0] text-sm">
                              {userStats?.totalSwaps || 0} total swap{userStats?.totalSwaps !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xl">
                            {/* Calculate potential points based on new system */}
                            {userStats ? (
                              // First daily swap (4pts) + Additional 2pts per swap for 10+ swaps
                              4 + (userStats.totalSwaps >= 10 ? Math.min((userStats.totalSwaps - 1) * 2, 6) : 0)
                            ) : 0}
                          </div>
                          <div className="flex flex-col text-xs space-y-1 mt-1">
                            <span className="text-blue-400 bg-blue-900/20 rounded px-2 py-0.5">+4 pts first swap of the day</span>
                            <span className="text-emerald-400 bg-emerald-900/20 rounded px-2 py-0.5">
                              +2 pts per swap after 10+ daily swaps
                            </span>
                            <span className="text-amber-400 text-[10px]">Max 6 pts from 10+ swaps bonus</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Badge progression removed */}
                    </div>
                    
                    {/* Faucet Claims Card */}
                    <div className="bg-[#1E2A3B] rounded-lg border border-[#2D3748] p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-cyan-600 bg-opacity-20 flex items-center justify-center mr-3">
                            <i className="fas fa-faucet text-cyan-400"></i>
                          </div>
                          <div>
                            <h4 className="font-medium">Faucet Claims</h4>
                            <p className="text-[#A0AEC0] text-sm">
                              {userStats?.totalFaucetClaims || 0} total claim{userStats?.totalFaucetClaims !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xl">{userStats?.totalFaucetClaims || 0}</div>
                          <div className="text-xs text-indigo-400 bg-indigo-900/20 rounded px-2 py-0.5 mt-1">
                            +1 pt per claim
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-[#2D3748]">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[#A0AEC0]">Claims over last 7 days:</span>
                          <span className="text-xs text-[#A0AEC0]">
                            {Math.min(userStats?.totalFaucetClaims || 0, 7)}/7 days
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(((userStats?.totalFaucetClaims || 0) / 7) * 100, 100)} 
                          className="h-1.5 mt-1 bg-[#2D3748]" 
                        />
                      </div>
                    </div>
                    
                    {/* Quests Card */}
                    <div className="bg-[#1E2A3B] rounded-lg border border-[#2D3748] p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-amber-600 bg-opacity-20 flex items-center justify-center mr-3">
                            <i className="fas fa-tasks text-amber-400"></i>
                          </div>
                          <div>
                            <h4 className="font-medium">Quests</h4>
                            <p className="text-[#A0AEC0] text-sm">
                              {userStats?.completedQuests || 0}/{userStats?.totalQuests || 0} completed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <button 
                            onClick={() => setActiveTab("activity")} 
                            className="text-xs text-blue-400 hover:underline"
                          >
                            View all quests
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-[#2D3748]">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[#A0AEC0]">Quest completion:</span>
                          <span className="text-xs text-[#A0AEC0]">
                            {Math.round(((userStats?.completedQuests || 0) / (userStats?.totalQuests || 1)) * 100)}%
                          </span>
                        </div>
                        <Progress 
                          value={((userStats?.completedQuests || 0) / (userStats?.totalQuests || 1)) * 100} 
                          className="h-1.5 mt-1 bg-[#2D3748]" 
                        />
                      </div>
                    </div>
                    
                    {/* Governance Card */}
                    <div className="bg-[#1E2A3B] rounded-lg border border-[#2D3748] p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-purple-600 bg-opacity-20 flex items-center justify-center mr-3">
                            <i className="fas fa-landmark text-purple-400"></i>
                          </div>
                          <div>
                            <h4 className="font-medium">Governance</h4>
                            <div className="flex items-center">
                              <span className="text-yellow-400 text-xs mr-2">Coming Soon</span>
                              <i className="fas fa-clock text-yellow-400 text-xs"></i>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs bg-purple-900/30 border border-purple-800/30 rounded px-2 py-1">
                            <span className="text-purple-300">+10</span> <span className="text-[#A0AEC0]">pts per vote</span>
                          </div>
                          <div className="text-xs bg-purple-900/30 border border-purple-800/30 rounded px-2 py-1 mt-1">
                            <span className="text-purple-300">+300</span> <span className="text-[#A0AEC0]">pts with NFT</span>
                          </div>
                        </div>
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
        
        {/* Activity History Tab with Transaction History Component */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-[#111827] border-[#2D3748]">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Your Activity History</CardTitle>
                <CardDescription>Track all your interactions with the Prior Protocol testnet</CardDescription>
              </div>
              <div className="mt-4 sm:mt-0">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    if (syncTransactions) {
                      toast({
                        title: "Syncing blockchain activity",
                        description: "Fetching your latest swap and faucet transactions...",
                      });
                      
                      try {
                        syncTransactions();
                        
                        // Show success toast after a delay - this assumes the sync is fast
                        // In a real app, you might want to use events or promises to know when it's done
                        setTimeout(() => {
                          if (!syncError) {
                            toast({
                              title: "Sync complete",
                              description: "Your transactions have been updated",
                            });
                          }
                        }, 3000);
                      } catch (err) {
                        toast({
                          title: "Sync failed",
                          description: "There was a problem synchronizing with the blockchain",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                  disabled={isSyncing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Blockchain Activity'}
                </Button>
                {lastSyncTime instanceof Date && (
                  <p className="text-[#A0AEC0] text-xs mt-1 text-right">
                    Last synced: {lastSyncTime.toLocaleTimeString()}
                  </p>
                )}
                {syncError && (
                  <p className="text-red-400 text-xs mt-1 text-right">
                    Error: {syncError}
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Pass the address explicitly to ensure consistency */}
              <TransactionHistory address={address} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="leaderboard" className="space-y-6">
          <div className="space-y-4">
            <div className="px-1">
              <h3 className="text-xl font-semibold mb-1">Prior Protocol Leaderboard</h3>
              <p className="text-[#A0AEC0]">
                Top users ranked by Prior Points from protocol activity. Earn points by:
                <ul className="list-disc list-inside mt-1 ml-2">
                  <li><span className="text-blue-400">4 points</span> for your first swap of the day</li>
                  <li><span className="text-emerald-400">2 points</span> per swap after reaching 10+ daily swaps (max 6 additional points)</li>
                  <li><span className="text-indigo-400">1 point</span> for each faucet claim</li>
                  <li><span className="text-purple-400">10 points</span> for governance votes (coming soon)</li>
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
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-2">
                    <div className="bg-[#1E2A3B] p-4 rounded-md text-center">
                      <p className="text-xs text-[#A0AEC0] mb-1">Total Points</p>
                      <p className="text-2xl font-bold">{userStats?.points || 0}</p>
                      <p className="text-xs text-[#A0AEC0] mt-1 italic">
                        All points convert to PRIOR at TGE
                      </p>
                    </div>
                    <div className="bg-[#1E2A3B] p-4 rounded-md text-center">
                      <p className="text-xs text-[#A0AEC0] mb-1">From Swaps</p>
                      <p className="text-xl font-bold">
                        {userStats?.totalSwaps && userStats.totalSwaps >= 10 ? 
                          userStats.totalSwaps * 2 : 0}
                      </p>
                      <p className="text-xs text-[#A0AEC0]">
                        {userStats?.totalSwaps ? 
                          (userStats.totalSwaps >= 10 ? 
                            `${userStats.totalSwaps} swaps × 2 pts each` : 
                            `${userStats.totalSwaps} swaps (need 10+ daily swaps for points)`) : 
                          "No swaps yet"}
                      </p>
                    </div>
                    <div className="bg-[#1E2A3B] p-4 rounded-md text-center">
                      <p className="text-xs text-[#A0AEC0] mb-1">From Faucet</p>
                      <p className="text-xl font-bold">{userStats?.totalFaucetClaims || 0}</p>
                      <p className="text-xs text-[#A0AEC0]">({userStats?.totalFaucetClaims || 0} claims × 1 pt each)</p>
                    </div>
                    <div className="bg-[#1E2A3B] p-4 rounded-md text-center">
                      <p className="text-xs text-[#A0AEC0] mb-1">From Governance</p>
                      <p className="text-xl font-bold">{userStats?.proposalsVoted ? userStats.proposalsVoted * 10 : 0}</p>
                      <p className="text-xs text-[#A0AEC0]">
                        {userStats?.proposalsVoted ? 
                          `${userStats.proposalsVoted} votes (${userStats.proposalsVoted * 10} pts)` : 
                          "No votes yet"}
                      </p>
                      <p className="text-xs text-[#A0AEC0] mt-1">
                        <span className="text-purple-400">+300</span> with Prior NFT
                      </p>
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