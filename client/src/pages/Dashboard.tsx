import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BadgeCard } from "@/components/BadgeCard";
import { PioneerBadgeCard } from "@/components/PioneerBadgeCard";
import { Leaderboard } from "@/components/Leaderboard";
import { getBadgeInfo } from "@/lib/badges";
import { FaTrophy, FaLock, FaRankingStar } from "react-icons/fa6";
import StandaloneWalletButton from "@/components/StandaloneWalletButton";
// Define the UserStats interface locally to match the server return type
interface UserStats {
  totalFaucetClaims: number;
  totalSwaps: number;
  completedQuests: number;
  totalQuests: number;
  proposalsVoted: number;
  proposalsCreated: number;
  points: number;
}

const Dashboard = () => {
  // Use both wallet systems for compatibility during transition
  const { userId, tokens, getTokenBalance } = useWallet();
  const { address: standaloneAddress } = useStandaloneWallet();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Prefer standalone address
  const address = standaloneAddress;

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/users/stats", userId],
    queryFn: () => apiRequest<UserStats>(`/api/users/${userId}/stats`),
    enabled: !!userId,
  });

  // Fetch user badges
  const { data: userBadges, isLoading: badgesLoading } = useQuery({
    queryKey: ["/api/users/badges", userId],
    queryFn: () => apiRequest<string[]>(`/api/users/${userId}/badges`),
    enabled: !!userId,
  });

  // Total badges the user could potentially earn
  const allPossibleBadges = 8; // This should match the total number of badges in badges.ts
  
  // Calculate badge progress
  const badgeProgress = userBadges ? Math.round((userBadges.length / allPossibleBadges) * 100) : 0;

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
  
  // Placeholder badges that the user hasn't earned yet
  const unlockedBadges = userBadges || [];
  const lockedBadges = ['token_claimed', 'swap_completed', 'governance_vote', 'quest_completed', 'active_voter', 'all_quests', 'early_adopter', 'prior_pioneer']
    .filter(badgeId => !unlockedBadges.includes(badgeId));

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Your Dashboard</h2>
        <p className="text-[#A0AEC0] mt-2">Track your activity and achievements in the Prior Protocol testnet</p>
      </div>

      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
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
                            {userStats?.totalSwaps && userStats.totalSwaps >= 10 ? userStats.totalSwaps * 2 : 0}
                          </div>
                          <p className="text-xs text-green-400">
                            {userStats?.totalSwaps >= 10 ? '2 pts per swap' : 'Need 10+ daily swaps'}
                          </p>
                        </div>
                      </div>
                      
                      {userStats?.totalSwaps ? (
                        <div className="mt-3 pt-3 border-t border-[#2D3748]">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-[#A0AEC0]">Progress to Swap Badge:</span>
                            <span className="text-xs text-[#A0AEC0]">
                              {userStats.totalSwaps >= 20 ? "Eligible" : `${userStats.totalSwaps}/20 swaps`}
                            </span>
                          </div>
                          <Progress 
                            value={Math.min((userStats.totalSwaps / 20) * 100, 100)} 
                            className="h-1.5 mt-1 bg-[#2D3748]" 
                          />
                        </div>
                      ) : null}
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
                          <div className="font-bold text-xl">0</div>
                          <p className="text-xs text-[#A0AEC0]">No points for claims</p>
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
                      {address}
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
                      className="mt-2 w-full flex justify-center items-center gap-1 bg-red-900/20 text-red-400 border border-red-900/30 rounded px-3 py-1.5 text-xs hover:bg-red-900/30 transition-colors"
                    >
                      <i className="fas fa-power-off text-xs"></i>
                      Disconnect Wallet
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Badge Progress Card */}
          <Card className="bg-[#111827] border-[#2D3748]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 bg-opacity-20 flex items-center justify-center">
                  <FaTrophy className="text-amber-500 text-xs" />
                </div>
                Badges Progress
              </CardTitle>
              <CardDescription>Your achievement collection</CardDescription>
            </CardHeader>
            <CardContent>
              {badgesLoading ? (
                <div className="h-20 flex items-center justify-center">
                  <div className="w-6 h-6 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                  <p className="ml-2 text-[#A0AEC0]">Loading badges...</p>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-sm">Badge Collection Progress</h4>
                      <span className="text-xs text-[#A0AEC0]">
                        {userBadges?.length || 0} of {allPossibleBadges}
                      </span>
                    </div>
                    <Progress value={badgeProgress} className="h-2.5 bg-[#2D3748]" />
                    <p className="text-xs text-[#A0AEC0] mt-1 text-right">{badgeProgress}% completed</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {userBadges && userBadges.length > 0 ? (
                      userBadges.slice(0, 2).map((badge, index) => {
                        const badgeInfo = getBadgeInfo(badge);
                        return (
                          <div 
                            key={index} 
                            className="bg-[#1E2A3B] p-2.5 rounded border border-[#2D3748] flex items-center gap-3"
                          >
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${badgeInfo.color}15` }}
                            >
                              <FaTrophy style={{ color: badgeInfo.color }} />
                            </div>
                            <div>
                              <h5 className="font-medium text-sm">{badgeInfo.name}</h5>
                              <p className="text-xs text-[#A0AEC0]">{badgeInfo.description.split('.')[0]}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 bg-[#1E2A3B] p-4 rounded border border-[#2D3748] text-center">
                        <p className="text-sm text-[#A0AEC0]">Complete quests and activities to earn badges!</p>
                      </div>
                    )}
                    
                    {userBadges && userBadges.length > 0 && (
                      <div className="col-span-2 mt-2 text-center">
                        <button
                          onClick={() => setActiveTab("badges")}
                          className="text-[#1A5CFF] text-sm font-medium hover:underline inline-flex items-center"
                        >
                          View all badges
                          <i className="fas fa-chevron-right ml-1 text-xs"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <Card className="bg-[#111827] border-[#2D3748]">
            <CardHeader>
              <CardTitle>Your Achievement Badges</CardTitle>
              <CardDescription>
                Badges earned through your activity on the Prior Protocol testnet. Earn badges by interacting with the protocol's features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {badgesLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <div className="animate-pulse h-4 bg-[#2D3748] rounded w-3/4 mb-2"></div>
                  <div className="animate-pulse h-4 bg-[#2D3748] rounded w-1/2"></div>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <FaTrophy className="mr-2 text-[#1A5CFF]" /> 
                      Earned Badges ({unlockedBadges.length})
                    </h3>
                    
                    {unlockedBadges.length > 0 ? (
                      <div className="space-y-6">
                        {/* Show special Pioneer NFT badge card if user has it */}
                        {unlockedBadges.includes('prior_pioneer') && (
                          <div className="mb-6">
                            <PioneerBadgeCard />
                          </div>
                        )}
                        
                        {/* Show all other badges */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {unlockedBadges
                            .filter(badgeId => badgeId !== 'prior_pioneer')
                            .map((badgeId, index) => (
                              <BadgeCard key={index} badgeId={badgeId} />
                            ))
                          }
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#1E2A3B] p-6 rounded-md border border-[#2D3748] text-center">
                        <p className="text-[#A0AEC0]">
                          You haven't earned any badges yet. 
                          Interact with the protocol to earn achievements!
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <FaLock className="mr-2 text-[#A0AEC0]" /> 
                      Locked Badges ({lockedBadges.length})
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lockedBadges.map((badgeId, index) => (
                        <Card key={index} className="bg-[#1E2A3B] border border-[#2D3748] opacity-70">
                          <CardContent className="p-4 flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#2D3748]">
                              <FaLock className="text-[#A0AEC0]" />
                            </div>
                            <div>
                              <h4 className="font-bold">{getBadgeInfo(badgeId).name}</h4>
                              <p className="text-sm text-[#A0AEC0]">{getBadgeInfo(badgeId).description}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity History Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-[#111827] border-[#2D3748]">
            <CardHeader>
              <CardTitle>Your Activity History</CardTitle>
              <CardDescription>Track all your interactions with the Prior Protocol</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Faucet Claims */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <i className="fas fa-faucet mr-2 text-blue-400"></i>
                    Faucet Claims ({userStats?.totalFaucetClaims || 0})
                  </h3>
                  
                  {userStats?.totalFaucetClaims ? (
                    <div className="space-y-3">
                      <div className="overflow-hidden rounded-md border border-[#2D3748]">
                        <table className="w-full text-sm">
                          <thead className="bg-[#1E2A3B]">
                            <tr>
                              <th className="py-3 px-4 text-left">Date</th>
                              <th className="py-3 px-4 text-left">Amount</th>
                              <th className="py-3 px-4 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2D3748]">
                            {Array.from({ length: Math.min(userStats.totalFaucetClaims, 5) }, (_, i) => (
                              <tr key={i} className="bg-[#141D29]">
                                <td className="py-3 px-4">
                                  {new Date(Date.now() - (i * 86400000)).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 font-mono">1 PRIOR</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500 bg-opacity-20 text-green-500">
                                    Completed
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xs text-[#A0AEC0]">
                          Showing {Math.min(userStats.totalFaucetClaims, 5)} of {userStats.totalFaucetClaims} claims
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1E2A3B] p-6 rounded-md border border-[#2D3748] text-center">
                      <p className="text-[#A0AEC0]">
                        You haven't claimed any tokens yet. Visit the Faucet page to claim your PRIOR tokens.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Swaps */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <i className="fas fa-exchange-alt mr-2 text-purple-400"></i>
                    Swap Transactions ({userStats?.totalSwaps || 0})
                  </h3>
                  
                  {userStats?.totalSwaps ? (
                    <div className="space-y-3">
                      <div className="overflow-hidden rounded-md border border-[#2D3748]">
                        <table className="w-full text-sm">
                          <thead className="bg-[#1E2A3B]">
                            <tr>
                              <th className="py-3 px-4 text-left">Date</th>
                              <th className="py-3 px-4 text-left">From</th>
                              <th className="py-3 px-4 text-left">To</th>
                              <th className="py-3 px-4 text-right">Points</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2D3748]">
                            {Array.from({ length: Math.min(userStats.totalSwaps, 5) }, (_, i) => {
                              const tokens = ['PRIOR', 'USDC', 'USDT'];
                              const fromToken = tokens[Math.floor(Math.random() * tokens.length)];
                              const toToken = tokens.filter(t => t !== fromToken)[Math.floor(Math.random() * 2)];
                              
                              return (
                                <tr key={i} className="bg-[#141D29]">
                                  <td className="py-3 px-4">
                                    {new Date(Date.now() - (i * 3600000)).toLocaleDateString()}
                                  </td>
                                  <td className="py-3 px-4 font-mono">{fromToken}</td>
                                  <td className="py-3 px-4 font-mono">{toToken}</td>
                                  <td className="py-3 px-4 text-right">
                                    <span className="text-green-400">
                                      {userStats.totalSwaps >= 10 ? '+2' : '0'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xs text-[#A0AEC0]">
                          Showing {Math.min(userStats.totalSwaps, 5)} of {userStats.totalSwaps} swaps
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1E2A3B] p-6 rounded-md border border-[#2D3748] text-center">
                      <p className="text-[#A0AEC0]">
                        You haven't made any swaps yet. Visit the Swap page to exchange tokens.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Governance */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <i className="fas fa-landmark mr-2 text-amber-400"></i>
                    Governance Activity
                  </h3>
                  
                  <div className="bg-[#1E2A3B] p-6 rounded-md border border-[#2D3748] text-center">
                    <div className="mb-4">
                      <i className="fas fa-clock text-2xl text-[#A0AEC0]"></i>
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Feature Coming Soon</h4>
                    <p className="text-[#A0AEC0]">
                      Governance functionality will be available in the next update.
                      You'll be able to create and vote on proposals, earning points for participation.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="leaderboard" className="space-y-6">
          <div className="space-y-4">
            <div className="px-1">
              <h3 className="text-xl font-semibold mb-1">Prior Protocol Leaderboard</h3>
              <p className="text-[#A0AEC0]">
                Top users ranked by Prior Points from protocol activity. Earn points by swapping tokens (2 points per swap when you make 10+ daily swaps), 
                voting on governance proposals (10 points), and completing quests (various rewards). 
                <strong>All points will be converted to PRIOR tokens at Token Generation Event (TGE).</strong>
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
                      <p className="text-xl font-bold">0</p>
                      <p className="text-xs text-[#A0AEC0]">({userStats?.totalFaucetClaims || 0} claims × 0 pts)</p>
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