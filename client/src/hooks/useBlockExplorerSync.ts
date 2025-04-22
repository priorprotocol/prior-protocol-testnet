import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

/**
 * Custom hook to fetch transactions from our database
 * We're no longer using Basescan API due to rate limiting issues
 */
export function useBlockExplorerSync(address: string | null) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Only fetch from local database - no blockchain explorer API calls
  const syncTransactions = async (walletAddress: string) => {
    if (!walletAddress || isSyncing) return;
    
    try {
      setIsSyncing(true);
      setError(null);
      
      console.log('Refreshing database transactions for:', walletAddress);
      
      try {
        // Fetch transactions from our database
        const dbResponse = await apiRequest(`/api/users/${walletAddress}/transactions`, {
          method: 'GET'
        });
        
        console.log('Local database transactions:', dbResponse);
        
        // Invalidate all relevant queries to update UI
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress] });
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'transactions', 'swap'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'transactions', 'faucet_claim'] });
        queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
        
        console.log('Local data refresh completed successfully.');
        setLastSyncTime(new Date());
      } catch (dbError) {
        console.error('Error fetching database transactions:', dbError);
        setError('Error refreshing transactions. Please try again.');
      }
    } catch (err) {
      console.error('Error in sync process:', err);
      setError('Data refresh failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync when address changes
  useEffect(() => {
    if (address) {
      syncTransactions(address);
    }
  }, [address]);

  return {
    isSyncing,
    lastSyncTime,
    error,
    syncTransactions: address ? () => syncTransactions(address) : undefined
  };
}

export default useBlockExplorerSync;