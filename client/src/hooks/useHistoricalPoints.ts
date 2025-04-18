import { useQuery } from '@tanstack/react-query';

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
      
      const response = await fetch(`/api/users/${address}/historical-points?period=${period}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // User not found or no historical data
          return {
            periods: [],
            pointsData: [],
            swapData: [],
            totalPoints: 0,
            currentPoints: 0
          };
        }
        throw new Error('Failed to fetch historical points data');
      }
      
      return response.json();
    },
    enabled: Boolean(address),
    staleTime: 60000, // Consider data stale after 1 minute
    refetchOnWindowFocus: true
  });
}

export default useHistoricalPoints;