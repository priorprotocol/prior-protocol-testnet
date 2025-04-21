import React from 'react';
import { FaExchangeAlt, FaInfoCircle } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface SwapPointsSystemProps {
  points: number;
  totalSwaps: number;
  isLoading: boolean;
  swapTransactions: any[];
}

export const SwapPointsSystem: React.FC<SwapPointsSystemProps> = ({ 
  points, 
  totalSwaps, 
  isLoading,
  swapTransactions = []
}) => {
  // Calculate daily swap points (0.5 points per swap, max 5 swaps = 2.5 points)
  const pointsPerSwap = 0.5; // Each swap earns exactly 0.5 points
  const maxDailySwaps = 5; // Maximum of 5 swaps count for points per day
  const maxDailyPoints = pointsPerSwap * maxDailySwaps; // 2.5 points maximum per day
  
  const dailySwapPoints = Math.min(Math.min(totalSwaps, maxDailySwaps) * pointsPerSwap, maxDailyPoints);
  const dailySwapPointsPercentage = (dailySwapPoints / maxDailyPoints) * 100;
  
  // Calculate eligible swaps (max 5)
  const eligibleSwaps = Math.min(totalSwaps, maxDailySwaps);
  
  // Group transactions by day for display
  const transactionsByDay: Record<string, {date: string, swaps: any[], points: number}> = {};
  
  swapTransactions.forEach(tx => {
    const txDate = new Date(tx.timestamp);
    const dayStr = txDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const readableDate = txDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    if (!transactionsByDay[dayStr]) {
      transactionsByDay[dayStr] = {
        date: readableDate,
        swaps: [],
        points: 0
      };
    }
    
    // Only count points for the first 5 swaps of the day
    if (transactionsByDay[dayStr].swaps.length < maxDailySwaps) {
      transactionsByDay[dayStr].points += pointsPerSwap;
    }
    
    transactionsByDay[dayStr].swaps.push(tx);
  });
  
  // Convert to array and sort by date (newest first)
  const dailyActivity = Object.entries(transactionsByDay)
    .map(([day, data]) => ({
      day,
      ...data
    }))
    .sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime());
  
  return (
    <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600"></div>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FaExchangeAlt className="text-indigo-500" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-300">
            Swap Points System
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="w-5 h-5 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
            <p className="ml-2 text-[#A0AEC0] text-sm">Processing data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Points Explanation */}
            <div className="bg-[#1A2234] p-4 rounded-md border border-indigo-900/40">
              <h3 className="text-sm font-medium text-indigo-400 mb-2 flex items-center">
                <FaInfoCircle className="mr-1.5" size={12} />
                How Points Work
              </h3>
              <div className="space-y-2 text-xs text-gray-300">
                <p>• Each swap earns <span className="text-indigo-400 font-medium">0.5 points</span></p>
                <p>• Maximum <span className="text-indigo-400 font-medium">5 swaps</span> count toward points each day</p>
                <p>• Daily maximum: <span className="text-indigo-400 font-medium">2.5 points</span> (5 swaps × 0.5)</p>
              </div>
            </div>
            
            {/* Daily Points Breakdown */}
            <div className="mt-4 space-y-2 bg-[#1A2234] p-4 rounded-md border border-indigo-900/40">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-400">
                  <FaExchangeAlt className="mr-1.5 text-indigo-500" size={12} />
                  <span>Today's Swap Points</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="ml-1 text-gray-500 hover:text-gray-400">
                          <FaInfoCircle size={12} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">You earn 0.5 points per swap transaction, up to a maximum of 5 swaps (2.5 points) per day.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="font-medium text-indigo-400">
                  {dailySwapPoints.toFixed(1)} / 2.5
                </span>
              </div>
              
              <Progress 
                value={dailySwapPointsPercentage} 
                className="h-1.5 bg-indigo-950"
                // Custom styling
                style={{background: '#1E1B4B'}}
              />
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">Eligible Swaps</span>
                <span className="text-xs font-medium text-indigo-400">
                  {eligibleSwaps} / 5
                </span>
              </div>
            </div>
            
            {/* Activity Log By Day */}
            <div className="space-y-2 mt-4">
              <h3 className="text-sm text-blue-400">Daily Swap Activity</h3>
              
              {dailyActivity.length > 0 ? (
                <div className="space-y-3">
                  {dailyActivity.map((day, index) => (
                    <div key={index} className="bg-[#1A2234] p-3 rounded-md border border-blue-900/30">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-gray-400">{day.date}</span>
                        <span className="text-xs font-medium text-indigo-400">
                          +{day.points.toFixed(1)} points
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-1">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const swap = day.swaps[i];
                          return (
                            <div 
                              key={i} 
                              className={`rounded-md p-1.5 flex items-center justify-center ${
                                swap ? 'bg-indigo-900/30 border border-indigo-900/50' : 'bg-[#111827] border border-blue-900/20'
                              }`}
                            >
                              {swap ? (
                                <span className="font-medium text-[10px] text-indigo-400">+{pointsPerSwap}</span>
                              ) : (
                                <span className="text-[10px] text-gray-500">--</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-2 text-[10px] text-center text-indigo-300 bg-indigo-900/20 py-1 rounded-sm">
                        Daily points: {Math.min(day.swaps.length, maxDailySwaps)} swaps × {pointsPerSwap} = {Math.min(day.swaps.length, maxDailySwaps) * pointsPerSwap} points
                      </div>
                      
                      {day.swaps.length > 5 && (
                        <div className="mt-2 text-xs text-center text-gray-500">
                          +{day.swaps.length - 5} more swaps (no additional points)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#1A2234] p-4 rounded-md text-center border border-blue-900/30">
                  <span className="text-gray-400 text-sm">No swap activity recorded yet</span>
                  <p className="text-xs text-gray-500 mt-1">Complete swaps to earn points</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SwapPointsSystem;