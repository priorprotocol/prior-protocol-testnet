import { useQuery } from '@tanstack/react-query';
import { UserStats } from '@/types';
import useBlockExplorerSync from './useBlockExplorerSync';

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
      
      const response = await fetch(`/api/users/${address}/stats`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // User not found - they may not have interacted with the protocol yet
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
        throw new Error('Failed to fetch user stats');
      }
      
      return response.json() as Promise<UserStats>;
    },
    enabled: Boolean(address)
  });
  
  // Fetch user's badges 
  const badgesQuery = useQuery({
    queryKey: ['/api/users', address, 'badges'],
    queryFn: async () => {
      if (!address) return [];
      
      const response = await fetch(`/api/users/${address}/badges`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // User not found - they may not have any badges yet
          return [];
        }
        throw new Error('Failed to fetch badges');
      }
      
      return response.json() as Promise<string[]>;
    },
    enabled: Boolean(address)
  });
  
  // Fetch user's transaction history
  const transactionsQuery = useQuery({
    queryKey: ['/api/users', address, 'transactions'],
    queryFn: async () => {
      if (!address) return { transactions: [], total: 0, page: 1, hasMore: false };
      
      const response = await fetch(`/api/users/${address}/transactions?limit=10`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // User not found - they may not have any transactions yet
          return { transactions: [], total: 0, page: 1, hasMore: false };
        }
        throw new Error('Failed to fetch transactions');
      }
      
      return response.json();
    },
    enabled: Boolean(address)
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