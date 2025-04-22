import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/types";
import { formatAddress } from "@/lib/formatAddress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FaTrophy, FaMedal, FaAward, FaGift, FaSync, FaChevronLeft, FaChevronRight, FaWifi } from "react-icons/fa";
import { HiOutlineStar } from "react-icons/hi";
import { useWallet } from "@/context/WalletContext";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import { useEffect, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/components/WebSocketProvider";

// Types for bonus leaderboard
interface BonusLeaderboardData {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
  totalGlobalBonusPoints: number;
  type: 'bonus';
}

interface BonusLeaderboardProps {
  limit?: number;
}

export const BonusLeaderboard = ({ limit = 15 }: BonusLeaderboardProps) => {
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
  const { connected: wsConnected, lastMessage } = useWebSocket();
  
  // Real-time bonus leaderboard with pagination
  const { data: leaderboardData, isLoading, refetch } = useQuery<BonusLeaderboardData>({
    queryKey: ["/api/bonus-leaderboard", limit, currentPage],
    queryFn: () => apiRequest<BonusLeaderboardData>(`/api/bonus-leaderboard?limit=${limit}&page=${currentPage}`),
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchOnMount: true, 
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  
  // Function to refresh bonus leaderboard data with cache busting
  const refreshLeaderboard = useCallback(async () => {
    // Create a timestamp to force a cache miss
    const cacheBuster = new Date().getTime();
    
    // First remove all cached bonus leaderboard data
    queryClient.removeQueries({ queryKey: ["/api/bonus-leaderboard"] });
    
    // Force refetch with fresh data (bypass cache)
    const freshData = await apiRequest<BonusLeaderboardData>(`/api/bonus-leaderboard?limit=${limit}&page=${currentPage}&_cb=${cacheBuster}`);
    
    // Update query cache with fresh data
    queryClient.setQueryData(["/api/bonus-leaderboard", limit, currentPage], freshData);
    
    console.log("Bonus leaderboard refresh completed with fresh data");
  }, [limit, currentPage, queryClient]);
  
  // Initialize real-time updates as soon as component mounts 
  useEffect(() => {
    // Immediately load bonus leaderboard data on app start
    queryClient.prefetchQuery({
      queryKey: ["/api/bonus-leaderboard", limit, currentPage],
      queryFn: () => apiRequest<BonusLeaderboardData>(`/api/bonus-leaderboard?limit=${limit}&page=${currentPage}`)
    });
    
    // Set up interval for real-time updates
    refreshIntervalRef.current = setInterval(() => {
      refreshLeaderboard();
    }, 15000); // Refresh every 15 seconds
    
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
  
  // Get user's role badge
  const getRoleBadge = (userRole: string) => {
    switch (userRole?.toLowerCase()) {
      case 'ambassador':
        return (
          <Badge className="bg-purple-700 hover:bg-purple-600">
            <HiOutlineStar className="mr-1" /> Ambassador
          </Badge>
        );
      case 'tester':
        return (
          <Badge className="bg-green-700 hover:bg-green-600">
            <HiOutlineStar className="mr-1" /> Beta Tester
          </Badge>
        );
      case 'helper':
        return (
          <Badge className="bg-blue-700 hover:bg-blue-600">
            <HiOutlineStar className="mr-1" /> Community Helper
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Get transaction metadata reason (if available)
  const getUserBonusReason = (user: User) => {
    // This would require an API endpoint to fetch detailed bonus reasons
    // Simplified version for now
    if (!user.userRole || user.userRole === 'user') {
      return null;
    }
    
    return (
      <div className="text-xs mt-1 text-amber-300 bg-amber-900/20 rounded py-0.5 px-2">
        <FaGift className="inline mr-1" size={10} />
        Community Contribution
      </div>
    );
  };
  
  return (
    <Card className="bg-[#111827] border-[#2D3748]">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FaGift className="text-amber-500" /> Bonus Points Leaderboard
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
              className="text-xs flex items-center gap-1 bg-amber-900/30 hover:bg-amber-800/40 text-amber-300 px-2 py-1 rounded-md"
              onClick={() => refreshLeaderboard()}
              title="Refresh Bonus Leaderboard"
            >
              <FaSync size={10} className="mr-1" />
              Refresh
            </button>
          </div>
        </div>
        <CardDescription>
          Special rewards for community contributions - ambassadors, testers, and helpers
        </CardDescription>
        
        {/* Total global bonus points summary */}
        <div className="mt-2 p-3 bg-gradient-to-r from-[#2A2A20] to-[#212118] rounded-md border border-[#3D3D28] shadow-lg">
          <div className="text-center">
            <span className="text-[#BFBA90] text-sm uppercase tracking-wider">Community Bonus Pool:</span> 
            <div className="flex items-center justify-center mt-1">
              <span className="text-[#BFBA90] mr-2 text-sm">Total Bonus Points:</span>
              <span className="text-xl font-bold text-amber-400">
                {parseFloat(String(leaderboardData?.totalGlobalBonusPoints || 0)).toFixed(1)}
              </span>
              {wsConnected && lastMessage?.type === 'leaderboard_update' && (
                <span className="ml-2 text-xs bg-amber-900/40 text-amber-300 px-1.5 py-0.5 rounded-full">
                  Updated live
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Special rewards for valuable contributions to the Prior Protocol community
            </div>
          </div>
        </div>
        
        {/* Show user's wallet if connected */}
        {address && (
          <div className="mt-3 p-2 bg-[#2A2A20] rounded-md border border-[#3D3D28]">
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className="text-[#BFBA90]">Your Wallet:</span> 
                <span className="ml-1 text-white">{formatAddress(address)}</span>
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-[#BFBA90]">Bonus Type:</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <span className="font-bold text-amber-400">Community Rewards</span>
                  )}
                </div>
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
          // Bonus leaderboard list
          <div className="space-y-3">
            {leaderboardData?.users && leaderboardData.users.length > 0 ? (
              leaderboardData.users.map((user, index) => {
                // Calculate actual rank including pagination offset
                const globalRank = ((currentPage - 1) * limit) + index + 1;
                const isCurrentUser = address?.toLowerCase() === user.address.toLowerCase();
                const rankBadge = getRankBadge(index);
                const roleBadge = getRoleBadge(user.userRole);
                const bonusReason = getUserBonusReason(user);
                
                return (
                  <div 
                    key={index} 
                    className={`flex flex-col p-3 rounded-md ${
                      isCurrentUser ? 'bg-[#2A2A20] border border-amber-700' : 'bg-[#1E2A3B]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-amber-900/30 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-amber-200">{globalRank}</span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {formatAddress(user.address)}
                            {isCurrentUser && <span className="ml-2 text-xs text-amber-400">(You)</span>}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {rankBadge}
                            {roleBadge}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-amber-400">
                          {typeof user.bonusPoints === 'string' ? 
                            parseFloat(user.bonusPoints).toFixed(1) : 
                            user.bonusPoints.toFixed(1)}
                        </div>
                        <div className="text-xs text-[#BFBA90]">Bonus points</div>
                      </div>
                    </div>
                    
                    {/* Bonus details */}
                    <div className="mt-2 grid grid-cols-1 text-xs border-t border-[#3D3D28] pt-2">
                      <div className="text-center">
                        <span className="text-[#BFBA90] block mb-1">Community Role</span>
                        <div className="flex justify-center items-center">
                          <HiOutlineStar className="text-amber-400 mr-1" />
                          <span className="text-lg font-bold text-white">
                            {user.userRole === 'user' ? 'Community Member' : user.userRole}
                          </span>
                        </div>
                        
                        <div className="mt-2 text-center bg-amber-900/20 rounded px-1 py-1">
                          <div className="flex justify-between px-2">
                            <span className="text-amber-400">Bonus Points:</span>
                            <span className="text-amber-200 font-bold">
                              {typeof user.bonusPoints === 'string' ? 
                                parseFloat(user.bonusPoints).toFixed(1) : 
                                user.bonusPoints.toFixed(1)}
                            </span>
                          </div>
                          <div className="text-gray-400 text-[9px] mt-1">
                            Special rewards for community contributions
                          </div>
                        </div>
                        
                        {bonusReason}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-[#BFBA90]">
                No users with bonus points yet
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Pagination controls */}
      {leaderboardData && leaderboardData.totalPages > 1 && (
        <CardFooter className="flex justify-between items-center pt-2 pb-4 px-4 border-t border-[#3D3D28]">
          <div className="text-xs text-[#BFBA90]">
            Page {leaderboardData.page} of {Math.min(leaderboardData.totalPages, 5)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="h-8 px-2 py-1 bg-amber-900/20 text-amber-200 border-amber-700/50 hover:bg-amber-800/30"
            >
              <FaChevronLeft className="mr-1" size={10} /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm" 
              onClick={goToNextPage}
              disabled={currentPage >= Math.min(leaderboardData.totalPages, 5)}
              className="h-8 px-2 py-1 bg-amber-900/20 text-amber-200 border-amber-700/50 hover:bg-amber-800/30"
            >
              Next <FaChevronRight className="ml-1" size={10} />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};