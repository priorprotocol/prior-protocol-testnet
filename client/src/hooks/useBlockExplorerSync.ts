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
      console.log('Using Basescan API key:', import.meta.env.VITE_BASESCAN_API_KEY ? 'Available (masked)' : 'NOT AVAILABLE');
      
      // Fetch transactions from block explorer with improved handling
      const transactions = await fetchBlockExplorerTransactions(walletAddress);
      
      // Log detailed transaction info for debugging
      console.log('Raw transactions returned:', transactions);
      
      if (transactions.length === 0) {
        console.log('No transactions found on blockchain for address:', walletAddress);
        setIsSyncing(false);
        setLastSyncTime(new Date());
        return;
      }
      
      console.log(`Found ${transactions.length} transactions on blockchain, syncing with database...`);
      
      // Count transaction types for debugging
      const typeCounts = transactions.reduce((acc, tx) => {
        acc[tx.type] = (acc[tx.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('Transaction types breakdown:', typeCounts);
      
      // Send transactions to backend for storage using our API endpoint
      try {
        console.log('Sending transactions to backend:', 
          transactions.map(tx => ({
            txHash: tx.txHash.substring(0, 10) + '...',
            type: tx.type,
            fromToken: tx.fromToken,
            toToken: tx.toToken
          }))
        );
        
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
        
        console.log('Backend response:', response);
        
        // Invalidate relevant queries to update UI
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress] });
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'transactions', 'swap'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'transactions', 'faucet_claim'] });
        queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
        
        console.log('Sync completed successfully. All queries invalidated for refresh.');
        setLastSyncTime(new Date());
      } catch (syncError) {
        console.error('Error saving transactions to database:', syncError);
        setError('Failed to save transactions to database. Please try again later.');
        throw syncError; // Re-throw to be caught by the outer try/catch
      }
    } catch (err) {
      console.error('Error synchronizing transactions:', err);
      setError('Failed to synchronize transactions. Please try again later.');
      throw err; // Re-throw to be handled by the calling component
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