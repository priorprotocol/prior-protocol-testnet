import { useQuery } from '@tanstack/react-query';
import { UserStats } from '@/types';
import useBlockExplorerSync from './useBlockExplorerSync';
import { apiRequest } from '@/lib/queryClient';

/**
 * Custom hook to fetch user stats and transactions for dashboard
 */
export function useDashboardStats(address: string | null) {
  // Use our blockchain sync hook to ensure data is up-to-date
  const { isSyncing, lastSyncTime, error: syncError, syncTransactions } = useBlockExplorerSync(address);
  
  // Fetch user stats from backend
  const statsQuery = useQuery({
    queryKey: ['/api/users', address, 'stats'],
    queryFn: async () => {
      if (!address) return null;
      
      try {
        // Use our improved apiRequest function that handles CORS and API URL resolution
        const data = await apiRequest(`/api/users/${address}/stats`);
        console.log("Fetched user stats:", data);
        return data as UserStats;
      } catch (error) {
        // If we get a 404, the user may not have interacted with the protocol yet
        if (error instanceof Error && error.message.includes('404')) {
          console.log("User not found, returning default stats");
          return {
            totalFaucetClaims: 0,
            totalSwaps: 0,
            completedQuests: 0,
            totalQuests: 0,
            proposalsVoted: 0,
            proposalsCreated: 0,
            points: 0
          } as UserStats;
        }
        console.error("Error fetching user stats:", error);
        throw error;
      }
    },
    enabled: Boolean(address)
  });
  
  // Badge functionality has been removed
  const badgesQuery = {
    data: [] as string[],
    isLoading: false,
    error: null
  };
  
  // Fetch user's transaction history
  const transactionsQuery = useQuery({
    queryKey: ['/api/users', address, 'transactions'],
    queryFn: async () => {
      if (!address) return { transactions: [], total: 0, page: 1, hasMore: false };
      
      try {
        // Use our improved apiRequest function that handles CORS and API URL resolution
        const data = await apiRequest(`/api/users/${address}/transactions?limit=10`);
        console.log("Fetched user transactions:", data);
        return data;
      } catch (error) {
        // If we get a 404, the user may not have any transactions yet
        if (error instanceof Error && error.message.includes('404')) {
          console.log("No transactions found for user");
          return { transactions: [], total: 0, page: 1, hasMore: false };
        }
        console.error("Error fetching transactions:", error);
        throw error;
      }
    },
    enabled: Boolean(address),
    retry: 1
  });

  // Handle manual sync trigger
  const handleSyncTransactions = () => {
    if (syncTransactions) {
      syncTransactions();
    }
  };

  return {
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    statsError: statsQuery.error,
    
    badges: badgesQuery.data || [],
    isLoadingBadges: badgesQuery.isLoading,
    badgesError: badgesQuery.error,
    
    transactions: transactionsQuery.data?.transactions || [],
    totalTransactions: transactionsQuery.data?.total || 0,
    isLoadingTransactions: transactionsQuery.isLoading,
    transactionsError: transactionsQuery.error,
    
    isSyncing,
    lastSyncTime,
    syncError,
    syncTransactions: handleSyncTransactions
  };
}

export default useDashboardStats;