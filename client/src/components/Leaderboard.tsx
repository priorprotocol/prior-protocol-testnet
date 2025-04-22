import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/types";
import { formatAddress } from "@/lib/formatAddress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FaTrophy, FaMedal, FaAward, FaExchangeAlt, FaSync, FaChevronLeft, FaChevronRight, FaWifi } from "react-icons/fa";
import { useWallet } from "@/context/WalletContext";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import { useEffect, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/components/WebSocketProvider";

// Updated types to match the new leaderboard format
interface LeaderboardData {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
  totalGlobalPoints: number; // Total global points
  globalSwaps?: {
    total: number;
    eligible: number;
    ineligible: number;
  }
}

interface LeaderboardProps {
  limit?: number;
}

export const Leaderboard = ({ limit = 15 }: LeaderboardProps) => {
  // Use both for compatibility during transition
  const { address: contextAddress } = useWallet();
  const { address: standaloneAddress } = useStandaloneWallet();
  
  // Prefer standalone address but fall back to context address
  const address = standaloneAddress || contextAddress;
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // For refreshing leaderboard data automatically
  const queryClient = useQueryClient();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // WebSocket connection for real-time updates
  const { connected: wsConnected, totalGlobalPoints: wsTotalGlobalPoints, lastMessage } = useWebSocket();
  
  // User rank query
  const { data: userRankData, isLoading: isRankLoading } = useQuery({
    queryKey: ["/api/users/rank", address],
    queryFn: () => address ? apiRequest<{rank: number | null}>(`/api/users/${address}/rank`) : Promise.resolve({rank: null}),
    staleTime: 10000, // Consider rank stale after 10 seconds
    enabled: !!address, // Only run this query if we have an address
  });
  
  // Real-time leaderboard with pagination
  const { data: leaderboardData, isLoading, refetch } = useQuery<LeaderboardData>({
    queryKey: ["/api/leaderboard", limit, currentPage],
    queryFn: () => apiRequest<LeaderboardData>(`/api/leaderboard?limit=${limit}&page=${currentPage}`),
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchOnMount: true, 
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  
  // Function to refresh leaderboard data with cache busting
  const refreshLeaderboard = useCallback(async () => {
    // Create a timestamp to force a cache miss
    const cacheBuster = new Date().getTime();
    
    // First remove all cached leaderboard data
    queryClient.removeQueries({ queryKey: ["/api/leaderboard"] });
    
    // Force refetch with fresh data (bypass cache)
    const freshData = await apiRequest<LeaderboardData>(`/api/leaderboard?limit=${limit}&page=${currentPage}&_cb=${cacheBuster}`);
    
    // Update query cache with fresh data
    queryClient.setQueryData(["/api/leaderboard", limit, currentPage], freshData);
    
    // Also refresh user rank if available
    if (address) {
      queryClient.invalidateQueries({ queryKey: ["/api/users/rank", address] });
    }
    
    console.log("Leaderboard refresh completed with fresh data");
  }, [limit, currentPage, address, queryClient]);
  
  // Initialize real-time updates as soon as component mounts 
  useEffect(() => {
    // Immediately load leaderboard data on app start
    queryClient.prefetchQuery({
      queryKey: ["/api/leaderboard", limit, currentPage],
      queryFn: () => apiRequest<LeaderboardData>(`/api/leaderboard?limit=${limit}&page=${currentPage}`)
    });
    
    // Set up interval for real-time updates
    refreshIntervalRef.current = setInterval(() => {
      refreshLeaderboard();
    }, 10000); // Refresh every 10 seconds
    
    // Clean up interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [limit, currentPage, queryClient, refreshLeaderboard]);
  
  // Pagination controls
  const goToNextPage = () => {
    if (leaderboardData && currentPage < leaderboardData.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  // Rank badge rendering helper
  const getRankBadge = (globalIndex: number) => {
    // Calculate actual global rank based on pagination
    const actualRank = ((currentPage - 1) * limit) + globalIndex + 1;
    
    switch (actualRank) {
      case 1: // 1st place
        return (
          <Badge className="bg-amber-500 text-black hover:bg-amber-400">
            <FaTrophy className="mr-1" /> 1st Place
          </Badge>
        );
      case 2: // 2nd place
        return (
          <Badge className="bg-gray-400 text-black hover:bg-gray-300">
            <FaMedal className="mr-1" /> 2nd Place
          </Badge>
        );
      case 3: // 3rd place
        return (
          <Badge className="bg-amber-700 text-white hover:bg-amber-600">
            <FaMedal className="mr-1" /> 3rd Place
          </Badge>
        );
      case 4: // 4th place
      case 5: // 5th place
        return (
          <Badge className="bg-blue-600 hover:bg-blue-500">
            <FaAward className="mr-1" /> Top 5
          </Badge>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card className="bg-[#111827] border-[#2D3748]">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FaTrophy className="text-amber-500" /> Prior Protocol Leaderboard
          </CardTitle>
          <div className="flex gap-2">
            {/* WebSocket connection indicator */}
            <div 
              className={`text-xs flex items-center gap-1 ${
                wsConnected 
                ? "bg-green-900/30 text-green-300" 
                : "bg-red-900/30 text-red-300"
              } px-2 py-1 rounded-md`}
              title={wsConnected ? "Real-time updates active" : "Reconnecting..."}
            >
              {wsConnected 
                ? <FaWifi size={10} className="mr-1" /> 
                : <FaWifi size={10} className="mr-1 animate-pulse" />
              }
              {wsConnected ? "Live" : "Connecting..."}
            </div>
            
            <button 
              className="text-xs flex items-center gap-1 bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 px-2 py-1 rounded-md"
              onClick={() => refreshLeaderboard()}
              title="Refresh Leaderboard"
            >
              <FaSync size={10} className="mr-1" />
              Refresh
            </button>
          </div>
        </div>
        <CardDescription>
          Top users ranked by Prior points - 0.5 points per swap, max 5 swaps daily (2.5 pts)
        </CardDescription>
        
        {/* Total global points and swap statistics summary - Enhanced visibility as requested */}
        <div className="mt-2 p-3 bg-gradient-to-r from-[#1A2A40] to-[#162138] rounded-md border border-[#2D3748] shadow-lg">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Points Stats */}
            <div className="text-center">
              <span className="text-[#A0AEC0] text-sm uppercase tracking-wider">Points Achievement:</span> 
              <div className="flex items-center justify-center mt-1">
                <span className="text-[#A0AEC0] mr-2 text-sm">Total Global Points:</span>
                <span className={`text-xl font-bold text-amber-400 ${lastMessage?.type === 'leaderboard_update' ? 'animate-pulse' : ''}`}>
                  {/* Use WebSocket value if available, otherwise fallback to API data */}
                  {(wsTotalGlobalPoints > 0 
                    ? wsTotalGlobalPoints 
                    : leaderboardData?.totalGlobalPoints || 0
                  ).toFixed(1)}
                </span>
                {wsConnected && lastMessage?.type === 'leaderboard_update' && (
                  <span className="ml-2 text-xs bg-indigo-900/40 text-indigo-300 px-1.5 py-0.5 rounded-full">
                    Updated live
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                0.5 points per swap (max 5 swaps daily = 2.5 points)
              </div>
            </div>
            
            {/* Swap Stats */}
            <div className="text-center border-t sm:border-t-0 sm:border-l border-[#2D3748] pt-3 sm:pt-0 sm:pl-3">
              <span className="text-[#A0AEC0] text-sm uppercase tracking-wider">Community Swaps:</span>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <div>
                  <div className="text-lg font-semibold text-blue-400">
                    {leaderboardData?.globalSwaps?.total || 0}
                  </div>
                  <div className="text-xs text-gray-400">Total</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-400">
                    {leaderboardData?.globalSwaps?.eligible || 0}
                  </div>
                  <div className="text-xs text-gray-400">Eligible</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-400">
                    {leaderboardData?.globalSwaps?.ineligible || 0}
                  </div>
                  <div className="text-xs text-gray-400">Ineligible</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Max 5 eligible swaps per user per day
              </div>
            </div>
          </div>
        </div>
        
        {/* Show user's rank if wallet is connected */}
        {address && (
          <div className="mt-3 p-2 bg-[#1A2A40] rounded-md border border-[#2D3748]">
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className="text-[#A0AEC0]">Your Wallet:</span> 
                <span className="ml-1 text-white">{formatAddress(address)}</span>
              </div>
              <div className="text-sm">
                {isRankLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-[#A0AEC0]">Your Rank:</span>
                    {userRankData?.rank ? (
                      <span className="font-bold text-[#1A5CFF]">#{userRankData.rank}</span>
                    ) : (
                      <span className="text-gray-400">Not ranked yet</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          // Loading state
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-md bg-[#1E2A3B]">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : (
          // Leaderboard list
          <div className="space-y-3">
            {leaderboardData?.users && leaderboardData.users.length > 0 ? (
              leaderboardData.users.map((user, index) => {
                // Calculate actual rank including pagination offset
                const globalRank = ((currentPage - 1) * limit) + index + 1;
                const isCurrentUser = address?.toLowerCase() === user.address.toLowerCase();
                const rankBadge = getRankBadge(index);
                
                return (
                  <div 
                    key={index} 
                    className={`flex flex-col p-3 rounded-md ${
                      isCurrentUser ? 'bg-[#1A3C5F] border border-[#1A5CFF]' : 'bg-[#1E2A3B]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#2D3748] rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold">{globalRank}</span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {formatAddress(user.address)}
                            {isCurrentUser && <span className="ml-2 text-xs text-[#1A5CFF]">(You)</span>}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {rankBadge}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{user.points}</div>
                        <div className="text-xs text-[#A0AEC0]">Prior points</div>
                      </div>
                    </div>
                    
                    {/* Activity details */}
                    <div className="mt-2 grid grid-cols-1 text-xs border-t border-[#2D3748] pt-2">
                      <div className={`text-center ${user.totalSwaps >= 5 ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-md p-1' : ''}`}>
                        <span className="text-[#A0AEC0] block mb-1">Swap Activity</span>
                        <div className="flex justify-center items-center">
                          <FaExchangeAlt className="text-indigo-400 mr-1" />
                          <span className={`text-lg font-bold ${user.totalSwaps >= 5 ? 'text-emerald-400' : 'text-white'}`}>
                            {user.totalSwaps || 0}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-1">(Total Swaps)</span>
                        </div>
                        
                        <div className="mt-2 text-center bg-blue-900/20 rounded px-1 py-1">
                          <div className="flex justify-between px-2">
                            <span className="text-blue-400">Points Earned:</span>
                            <span className="text-emerald-400 font-bold">
                              {Math.min(user.totalSwaps * 0.5, 2.5).toFixed(1)}
                            </span>
                          </div>
                          <div className="text-gray-400 text-[9px] mt-1">
                            0.5 pts per swap (max 5 swaps)
                          </div>
                        </div>
                        
                        {user.totalSwaps >= 5 && (
                          <div className="text-xs mt-1.5 text-emerald-300 bg-emerald-900/20 rounded py-0.5 px-2">
                            <FaExchangeAlt className="inline mr-1" size={10} />
                            Max Daily Points Achieved
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-[#A0AEC0]">
                No users on the leaderboard yet
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Pagination controls */}
      {leaderboardData && leaderboardData.totalPages > 1 && (
        <CardFooter className="flex justify-between items-center pt-2 pb-4 px-4 border-t border-[#2D3748]">
          <div className="text-xs text-[#A0AEC0]">
            Page {leaderboardData.page} of {Math.min(leaderboardData.totalPages, 5)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="h-8 px-2 py-1"
            >
              <FaChevronLeft className="mr-1" size={10} /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm" 
              onClick={goToNextPage}
              disabled={currentPage >= Math.min(leaderboardData.totalPages, 5)}
              className="h-8 px-2 py-1"
            >
              Next <FaChevronRight className="ml-1" size={10} />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};