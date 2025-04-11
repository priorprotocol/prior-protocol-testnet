import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/types";
import { formatWalletAddress } from "@/lib/formatAddress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FaTrophy, FaMedal, FaAward } from "react-icons/fa";
import { useWallet } from "@/context/WalletContext";

interface LeaderboardProps {
  limit?: number;
}

export const Leaderboard = ({ limit = 15 }: LeaderboardProps) => {
  const { address } = useWallet();
  
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["/api/leaderboard", limit],
    queryFn: () => apiRequest<User[]>(`/api/leaderboard?limit=${limit}`),
  });
  
  // Badge rendering helper functions
  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: // 1st place
        return (
          <Badge className="bg-amber-500 text-black hover:bg-amber-400" variant="secondary">
            <FaTrophy className="mr-1" /> 1st Place
          </Badge>
        );
      case 1: // 2nd place
        return (
          <Badge className="bg-gray-400 text-black hover:bg-gray-300" variant="secondary">
            <FaMedal className="mr-1" /> 2nd Place
          </Badge>
        );
      case 2: // 3rd place
        return (
          <Badge className="bg-amber-700 text-white hover:bg-amber-600" variant="secondary">
            <FaMedal className="mr-1" /> 3rd Place
          </Badge>
        );
      case 3: // 4th place
      case 4: // 5th place
        return (
          <Badge className="bg-blue-600 hover:bg-blue-500" variant="secondary">
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
          <FaTrophy className="text-amber-500" /> Leaderboard
        </CardTitle>
        <CardDescription>Top {limit} users ranked by points</CardDescription>
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
                    className={`flex justify-between items-center p-3 rounded-md ${
                      isCurrentUser ? 'bg-[#1A3C5F] border border-[#1A5CFF]' : 'bg-[#1E2A3B]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#2D3748] rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">
                          {formatWalletAddress(user.address)}
                          {isCurrentUser && <span className="ml-2 text-xs text-[#1A5CFF]">(You)</span>}
                        </div>
                        {rankBadge && <div className="mt-1">{rankBadge}</div>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{user.points}</div>
                      <div className="text-xs text-[#A0AEC0]">points</div>
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