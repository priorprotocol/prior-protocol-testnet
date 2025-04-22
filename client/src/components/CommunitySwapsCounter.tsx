import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FaExchangeAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useWebSocket } from '@/components/WebSocketProvider';

interface SwapStats {
  totalSwaps: number;
  eligibleSwaps: number;
  ineligibleSwaps: number;
  totalPoints: number;
}

const CommunitySwapsCounter: React.FC = () => {
  // WebSocket connection for real-time updates
  const { connected: wsConnected, totalGlobalPoints } = useWebSocket();
  
  // Fetch community swap statistics
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/stats/community-swaps'],
    queryFn: () => apiRequest<SwapStats>('/api/stats/community-swaps'),
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Calculate percentages for the progress bars
  const eligiblePercentage = data ? Math.min(100, (data.eligibleSwaps / Math.max(1, data.totalSwaps)) * 100) : 0;
  const ineligiblePercentage = data ? Math.min(100, (data.ineligibleSwaps / Math.max(1, data.totalSwaps)) * 100) : 0;

  return (
    <Card className="bg-[#111827] border-[#2D3748] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600"></div>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FaExchangeAlt className="text-indigo-500" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-300">
            Community Swaps
          </span>
          {wsConnected && (
            <span className="ml-auto text-xs bg-green-900/30 text-green-300 px-2 py-0.5 rounded-full">
              Live
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : isError ? (
          <div className="p-4 text-center text-red-400">
            <p>Error loading swap statistics</p>
            <button 
              onClick={() => refetch()}
              className="mt-2 text-xs px-3 py-1 bg-red-900/30 hover:bg-red-800/40 text-red-300 rounded-md"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total Swaps Counter */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs">Total Swaps</span>
                <span className="text-2xl font-bold text-white">{data?.totalSwaps.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-gray-400 text-xs">Points Generated</span>
                <span className="text-2xl font-bold text-indigo-400">{data?.totalPoints.toFixed(1)}</span>
              </div>
            </div>
            
            {/* Divider */}
            <div className="h-px bg-gray-800 my-2"></div>
            
            {/* Eligible Swaps */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2" size={12} />
                  <span className="text-gray-300 text-sm">Eligible Swaps</span>
                </div>
                <span className="text-green-400 font-medium">{data?.eligibleSwaps.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-600 to-green-400 h-full rounded-full" 
                  style={{ width: `${eligiblePercentage}%` }}
                ></div>
              </div>
            </div>
            
            {/* Ineligible Swaps */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaTimesCircle className="text-red-500 mr-2" size={12} />
                  <span className="text-gray-300 text-sm">Ineligible Swaps</span>
                </div>
                <span className="text-red-400 font-medium">{data?.ineligibleSwaps.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full" 
                  style={{ width: `${ineligiblePercentage}%` }}
                ></div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-800">
              <p>• Eligible swaps earn 0.5 points (max 5 per day)</p>
              <p>• Ineligible: exceeded daily limit or invalid</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunitySwapsCounter;