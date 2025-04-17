import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/types";
import { formatAddress } from "@/lib/formatAddress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FaTrophy, FaMedal, FaAward, FaExchangeAlt, FaShieldAlt } from "react-icons/fa";
import { useWallet } from "@/context/WalletContext";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";

interface LeaderboardProps {
  limit?: number;
}

export const Leaderboard = ({ limit = 20 }: LeaderboardProps) => {
  // Use both for compatibility during transition
  const { address: contextAddress } = useWallet();
  const { address: standaloneAddress } = useStandaloneWallet();
  
  // Prefer standalone address but fall back to context address
  const address = standaloneAddress || contextAddress;
  
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["/api/leaderboard", limit],
    queryFn: () => apiRequest<User[]>(`/api/leaderboard?limit=${limit}`),
  });
  
  // Rank badge rendering helper
  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: // 1st place
        return (
          <Badge className="bg-amber-500 text-black hover:bg-amber-400">
            <FaTrophy className="mr-1" /> 1st Place
          </Badge>
        );
      case 1: // 2nd place
        return (
          <Badge className="bg-gray-400 text-black hover:bg-gray-300">
            <FaMedal className="mr-1" /> 2nd Place
          </Badge>
        );
      case 2: // 3rd place
        return (
          <Badge className="bg-amber-700 text-white hover:bg-amber-600">
            <FaMedal className="mr-1" /> 3rd Place
          </Badge>
        );
      case 3: // 4th place
      case 4: // 5th place
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
        <CardTitle className="flex items-center gap-2">
          <FaTrophy className="text-amber-500" /> Prior Protocol Leaderboard
        </CardTitle>
        <CardDescription>
          Top {limit} users ranked by points - Highest swap activity highlighted
        </CardDescription>
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
            {leaderboard && leaderboard.length > 0 ? (
              leaderboard.map((user, index) => {
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
                          <span className="text-sm font-semibold">{index + 1}</span>
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
                        <div className="text-xs text-[#A0AEC0]">points</div>
                      </div>
                    </div>
                    
                    {/* Activity details - shown for all users for better transparency */}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs border-t border-[#2D3748] pt-2">
                      <div className={`text-center ${user.totalSwaps >= 10 ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-md p-1' : ''}`}>
                        <span className="text-[#A0AEC0] block">Total Swaps</span>
                        <span className={`font-medium ${user.totalSwaps >= 10 ? 'text-emerald-400' : ''}`}>{user.totalSwaps || 0}</span>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          <div className="text-center bg-blue-900/20 rounded px-1 py-0.5">
                            <span className="text-blue-400">+4 pts</span>
                            <div className="text-gray-400 text-[9px]">First Swap</div>
                          </div>
                          {user.totalSwaps >= 10 ? (
                            <div className="text-center bg-emerald-900/20 rounded px-1 py-0.5">
                              <span className="text-emerald-400">+2 pts</span>
                              <div className="text-gray-400 text-[9px]">10+ Swaps</div>
                            </div>
                          ) : (
                            <div className="text-center bg-gray-800/30 rounded px-1 py-0.5">
                              <span className="text-gray-500">--</span>
                              <div className="text-gray-500 text-[9px]">Need 10+</div>
                            </div>
                          )}
                        </div>
                        {user.totalSwaps >= 10 && (
                          <div className="text-xs mt-1 text-emerald-300">
                            <FaExchangeAlt className="inline mr-1" size={10} />Top Swapper
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <span className="text-[#A0AEC0] block">Faucet Claims</span>
                        <span className="font-medium">{user.totalClaims || 0}</span>
                        <div className="text-center mt-1 bg-indigo-900/20 rounded px-1 py-0.5">
                          <span className="text-indigo-400">+1 pt</span>
                          <div className="text-gray-400 text-[9px]">Per Claim</div>
                        </div>
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
    </Card>
  );
};