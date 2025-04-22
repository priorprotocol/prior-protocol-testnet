import React from 'react';
import { FaTrophy, FaExchangeAlt } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { HiInformationCircle } from 'react-icons/hi';

interface PointsSummaryProps {
  points: number;
  bonusPoints?: number;
  totalSwaps: number;
  isLoading: boolean;
  userRole?: string;
}

export const PointsSummary: React.FC<PointsSummaryProps> = ({ 
  points, 
  bonusPoints = 0,
  totalSwaps, 
  isLoading,
  userRole = 'user'
}) => {
  // Ensure points and bonusPoints are numbers by converting from strings if needed
  const numericPoints = typeof points === 'string' ? parseFloat(points) : points || 0;
  const numericBonusPoints = typeof bonusPoints === 'string' ? parseFloat(bonusPoints as string) : (bonusPoints || 0);
  
  // Calculate daily swap points (0.5 points per swap, max 5 swaps = 2.5 points)
  const dailySwapPoints = Math.min(Math.min(totalSwaps, 5) * 0.5, 2.5);
  const dailySwapPointsPercentage = (dailySwapPoints / 2.5) * 100;
  
  // Calculate eligible swaps (max 5)
  const eligibleSwaps = Math.min(totalSwaps, 5);
  
  return (
    <Card className="bg-[#0F172A] border-[#1E293B] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600"></div>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FaTrophy className="text-amber-500" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-300">Points Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="ml-2 text-[#A0AEC0] text-sm">Processing data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total Points Display */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-xl"></div>
                <div className="relative bg-[#1A2234] rounded-2xl p-4 border border-blue-900/50">
                  <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                    {numericPoints.toFixed(1)}
                  </div>
                  <div className="text-xs text-blue-400 mt-1">Prior Points</div>
                </div>
              </div>
            </div>
            
            {/* Daily Points Breakdown */}
            <div className="mt-4 space-y-2 bg-[#1A2234] p-4 rounded-md border border-blue-900/40">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-400">
                  <FaExchangeAlt className="mr-1.5 text-blue-500" size={12} />
                  <span>Daily Swap Points</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="ml-1 text-gray-500 hover:text-gray-400">
                          <HiInformationCircle size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>You earn 0.5 points per swap transaction, up to a maximum of 5 swaps (2.5 points) per day.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="font-medium text-blue-400">
                  {dailySwapPoints.toFixed(1)} / 2.5
                </span>
              </div>
              
              <Progress 
                value={dailySwapPointsPercentage} 
                className="h-1.5 bg-blue-950"
                // indicatorClassName is not supported, using className for styling
              />
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">Eligible Swaps</span>
                <span className="text-xs font-medium text-emerald-400">
                  {eligibleSwaps} / 5
                </span>
              </div>
              
              <div className="text-center mt-2">
                <p className="text-[10px] text-gray-500">
                  Points are capped at 0.5 × 5 swaps = 2.5 per day
                </p>
              </div>
            </div>
            
            {/* Bonus Points Section - Only show if user has bonus points or special role */}
            {(numericBonusPoints > 0 || userRole !== 'user') && (
              <div className="mt-4 space-y-2 bg-[#1A2234] p-4 rounded-md border border-indigo-900/40">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-1.5 text-indigo-500">✨</span>
                    <span>Bonus Points</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="ml-1 text-gray-500 hover:text-gray-400">
                            <HiInformationCircle size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>Bonus points are special rewards for community participation and contributions.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="font-medium text-indigo-400">
                    {numericBonusPoints.toFixed(1)}
                  </span>
                </div>
                
                <div className="text-center mt-2">
                  <p className="text-xs text-indigo-300/70">
                    {userRole !== 'user' ? 
                      `You have ${numericBonusPoints.toFixed(1)} bonus points as a ${userRole}` : 
                      'Bonus points for community contributions'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsSummary;