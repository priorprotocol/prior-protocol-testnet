import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
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
  const { address, userId, tokens, getTokenBalance, connectWallet, openWalletModal } = useWallet();
  const [activeTab, setActiveTab] = useState("overview");

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
          <button 
            onClick={() => {
              console.log("Dashboard: Opening wallet modal");
              openWalletModal();
            }}
            className="rounded-lg bg-[#1A5CFF] hover:bg-opacity-90 transition-all font-bold text-sm px-6 py-3"
          >
            Connect Wallet
          </button>
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
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="leaderboard">
            <div className="flex items-center gap-1">
              <FaRankingStar className="text-xs" />
              Leaderboard
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats cards */}
            <Card className="bg-[#111827] border-[#2D3748]">
              <CardHeader>
                <CardTitle className="text-lg">Activity Stats</CardTitle>
                <CardDescription>Your protocol interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-20 flex items-center justify-center">
                    <div className="animate-pulse h-4 bg-[#2D3748] rounded w-3/4 mb-2"></div>
                    <div className="animate-pulse h-4 bg-[#2D3748] rounded w-1/2"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-[#A0AEC0]">Total Swaps:</span>
                      <span className="font-bold">{userStats?.totalSwaps || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A0AEC0]">Faucet Claims:</span>
                      <span className="font-bold">{userStats?.totalFaucetClaims || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A0AEC0]">Quests Completed:</span>
                      <span className="font-bold">{userStats?.completedQuests || 0} / {userStats?.totalQuests || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A0AEC0]">Proposals Voted:</span>
                      <span className="font-bold">{userStats?.proposalsVoted || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A0AEC0]">Proposals Created:</span>
                      <span className="font-bold">{userStats?.proposalsCreated || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#111827] border-[#2D3748]">
              <CardHeader>
                <CardTitle className="text-lg">Wallet Info</CardTitle>
                <CardDescription>Your connected wallet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="break-all">
                    <span className="text-[#A0AEC0] block mb-1">Address:</span>
                    <span className="font-medium text-sm">{address}</span>
                  </div>
                  <div>
                    <span className="text-[#A0AEC0] block mb-1">Network:</span>
                    <span className="font-medium">Base Sepolia Testnet</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#111827] border-[#2D3748]">
              <CardHeader>
                <CardTitle className="text-lg">Badges Earned</CardTitle>
                <CardDescription>Your achievements</CardDescription>
              </CardHeader>
              <CardContent>
                {badgesLoading ? (
                  <div className="h-20 flex items-center justify-center">
                    <div className="animate-pulse h-4 bg-[#2D3748] rounded w-3/4 mb-2"></div>
                    <div className="animate-pulse h-4 bg-[#2D3748] rounded w-1/2"></div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-2xl font-bold">{userBadges?.length || 0}</span>
                      <span className="text-sm text-[#A0AEC0]">of {allPossibleBadges}</span>
                    </div>
                    
                    <div className="mb-4">
                      <Progress value={badgeProgress} className="h-2 bg-[#2D3748]" />
                      <p className="text-xs text-[#A0AEC0] mt-1 text-right">{badgeProgress}% completed</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {userBadges && userBadges.length > 0 ? (
                        userBadges.slice(0, 3).map((badge, index) => {
                          const badgeInfo = getBadgeInfo(badge);
                          return (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="flex items-center gap-1 px-2 py-1"
                              style={{ 
                                borderColor: badgeInfo.color,
                                color: badgeInfo.color,
                                backgroundColor: `${badgeInfo.color}15`
                              }}
                            >
                              <FaTrophy className="text-xs" />
                              {badgeInfo.name}
                            </Badge>
                          );
                        })
                      ) : (
                        <p className="text-sm text-[#A0AEC0]">No badges earned yet</p>
                      )}
                    </div>
                    
                    {userBadges && userBadges.length > 3 && (
                      <p className="text-sm text-[#A0AEC0] mt-2">+ {userBadges.length - 3} more badges</p>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <button
                  onClick={() => setActiveTab("badges")}
                  className="text-[#1A5CFF] text-sm font-medium hover:underline"
                >
                  View all badges
                </button>
              </CardFooter>
            </Card>
          </div>
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

        <TabsContent value="tokens" className="space-y-6">
          <Card className="bg-[#111827] border-[#2D3748]">
            <CardHeader>
              <CardTitle>Your Token Balances</CardTitle>
              <CardDescription>Current balances on Base Sepolia testnet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tokens.map((token, index) => (
                  <div key={index} className="bg-[#1E2A3B] p-4 rounded-md border border-[#2D3748]">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: token.logoColor }}
                        >
                          <span className="text-white font-bold text-xs">{token.symbol.substring(0, 1)}</span>
                        </div>
                        <div>
                          <h4 className="font-bold">{token.name}</h4>
                          <p className="text-xs text-[#A0AEC0]">{token.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-md">{getTokenBalance(token.symbol)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="leaderboard" className="space-y-6">
          <div className="space-y-4">
            <div className="px-1">
              <h3 className="text-xl font-semibold mb-1">Prior Protocol Leaderboard</h3>
              <p className="text-[#A0AEC0]">
                Top users ranked by points from protocol activity. Earn points by swapping tokens (5 points) 
                and claiming from the faucet (7 points).
              </p>
            </div>
            
            {/* User Stats Card */}
            {userId && userStats && (
              <Card className="bg-[#111827] border-[#2D3748]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Your Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    <div className="bg-[#1E2A3B] p-4 rounded-md text-center">
                      <p className="text-xs text-[#A0AEC0] mb-1">Total Points</p>
                      <p className="text-2xl font-bold">{userStats?.points || 0}</p>
                    </div>
                    <div className="bg-[#1E2A3B] p-4 rounded-md text-center">
                      <p className="text-xs text-[#A0AEC0] mb-1">From Swaps</p>
                      <p className="text-xl font-bold">{(userStats?.totalSwaps || 0) * 5}</p>
                      <p className="text-xs text-[#A0AEC0]">({userStats?.totalSwaps || 0} swaps × 5 pts)</p>
                    </div>
                    <div className="bg-[#1E2A3B] p-4 rounded-md text-center">
                      <p className="text-xs text-[#A0AEC0] mb-1">From Faucet</p>
                      <p className="text-xl font-bold">{(userStats?.totalFaucetClaims || 0) * 7}</p>
                      <p className="text-xs text-[#A0AEC0]">({userStats?.totalFaucetClaims || 0} claims × 7 pts)</p>
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