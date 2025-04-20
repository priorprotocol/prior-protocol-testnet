import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface HistoricalPointsData {
  periods: string[];
  pointsData: number[];
  swapData: number[];
  totalPoints: number;
  currentPoints: number;
}

/**
 * Hook to fetch historical points data for a user
 * @param address User's wallet address
 * @param period Time period for data ('day', 'week', 'month', 'all')
 */
export function useHistoricalPoints(address: string | null, period: string = 'week') {
  return useQuery<HistoricalPointsData>({
    queryKey: ['/api/users', address, 'historical-points', period],
    queryFn: async () => {
      if (!address) {
        throw new Error('No address provided');
      }
      
      try {
        // Use apiRequest which resolves URLs correctly based on environment
        return await apiRequest(`/api/users/${address}/historical-points?period=${period}`);
      } catch (error) {
        console.error('Failed to fetch historical points:', error);
        
        // Return empty data structure on error
        return {
          periods: [],
          pointsData: [],
          swapData: [],
          totalPoints: 0,
          currentPoints: 0
        };
      }
    },
    enabled: Boolean(address),
    staleTime: 60000, // Consider data stale after 1 minute
    refetchOnWindowFocus: true
  });
}

export default useHistoricalPoints;