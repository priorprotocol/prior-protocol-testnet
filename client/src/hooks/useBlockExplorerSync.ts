import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchBlockExplorerTransactions } from '@/lib/blockExplorerService';
import { apiRequest } from '@/lib/queryClient';

/**
 * Custom hook to fetch and synchronize blockchain transactions with our backend
 * This ensures the user's activity on the blockchain is reflected in our app
 */
export function useBlockExplorerSync(address: string | null) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Sync transactions from blockchain to our database
  const syncTransactions = async (walletAddress: string) => {
    if (!walletAddress || isSyncing) return;
    
    try {
      setIsSyncing(true);
      setError(null);
      
      console.log('Fetching blockchain transactions for:', walletAddress);
      
      // Fetch transactions from block explorer
      const transactions = await fetchBlockExplorerTransactions(walletAddress);
      
      if (transactions.length === 0) {
        console.log('No transactions found on blockchain for address:', walletAddress);
        setIsSyncing(false);
        setLastSyncTime(new Date());
        return;
      }
      
      console.log(`Found ${transactions.length} transactions on blockchain, syncing with database...`);
      
      // Send transactions to backend for storage using our API endpoint
      const response = await apiRequest('/api/sync-transactions', {
        method: 'POST',
        body: JSON.stringify({
          address: walletAddress,
          transactions
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Invalidate relevant queries to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
      
      console.log('Sync completed successfully:', response);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Error synchronizing transactions:', err);
      setError('Failed to synchronize transactions. Please try again later.');
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