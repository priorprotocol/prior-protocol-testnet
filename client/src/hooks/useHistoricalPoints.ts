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
    queryFn: async ({ queryKey }) => {
      if (!address) {
        throw new Error('No address provided');
      }
      
      try {
        console.log(`Fetching historical points for address: ${address}, period: ${period}`);
        
        // Add cache buster to prevent stale data after points calculation
        const cacheBuster = new Date().getTime();
        
        // Use apiRequest which provides better error handling and URL resolution
        // This is critical for resolving URLs correctly between Netlify frontend and Replit backend
        const data = await apiRequest(`/api/users/${address}/historical-points?period=${period}&_cb=${cacheBuster}`);
        
        console.log(`Historical data received for ${period}:`, data);
        
        // Validate the response
        if (!data || !Array.isArray(data.periods)) {
          console.warn(`Invalid historical data received:`, data);
          throw new Error('Invalid data structure received from API');
        }
        
        return data;
      } catch (error: any) {
        console.error('Failed to fetch historical points:', error);
        
        // Throw error so the UI can display the retry button
        throw new Error(`Failed to fetch historical data: ${error.message || 'Unknown error'}`);
      }
    },
    enabled: Boolean(address),
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 60000, // Refetch every minute
    retry: 3 // Retry failed requests more times
  });
}

export default useHistoricalPoints;