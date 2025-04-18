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

  // First fetch local transactions from database, then from blockchain
  const syncTransactions = async (walletAddress: string) => {
    if (!walletAddress || isSyncing) return;
    
    try {
      setIsSyncing(true);
      setError(null);
      
      // IMPROVEMENT: First get database transactions as they're faster
      console.log('Fetching local database transactions first for:', walletAddress);
      
      try {
        // First fetch transactions from our database (super fast)
        const dbResponse = await apiRequest(`/api/users/${walletAddress}/transactions`, {
          method: 'GET'
        });
        
        console.log('Local database transactions:', dbResponse);
        
        // No need to wait - now immediately fetch blockchain transactions in parallel
        // This makes the sync process much faster overall
        fetchBlockchainData(walletAddress);
        
      } catch (dbError) {
        console.error('Error fetching database transactions:', dbError);
        // If database fetch failed, still try blockchain
        fetchBlockchainData(walletAddress);
      }
    } catch (err) {
      console.error('Error in sync process:', err);
      setError('Sync failed. Please try again.');
      setIsSyncing(false);
    }
  };
  
  // Separate function to fetch blockchain data
  const fetchBlockchainData = async (walletAddress: string) => {
    try {
      console.log('Now fetching blockchain transactions for:', walletAddress);
      console.log('Using Basescan API key:', import.meta.env.VITE_BASESCAN_API_KEY ? 'Available (masked)' : 'NOT AVAILABLE');
      
      // Fetch transactions from block explorer with timeout
      const fetchPromise = fetchBlockExplorerTransactions(walletAddress);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Blockchain fetch timed out after 8 seconds')), 8000)
      );
      
      // Race the fetch against a timeout to ensure we don't wait too long
      const transactions = await Promise.race([fetchPromise, timeoutPromise]) as Awaited<typeof fetchPromise>;
      
      // Log detailed transaction info for debugging
      console.log('Raw blockchain transactions returned:', transactions);
      
      if (transactions.length === 0) {
        console.log('No new transactions found on blockchain for address:', walletAddress);
        setIsSyncing(false);
        setLastSyncTime(new Date());
        return;
      }
      
      console.log(`Found ${transactions.length} blockchain transactions, syncing with database...`);
      
      // Count transaction types for debugging
      const typeCounts = transactions.reduce((acc, tx) => {
        acc[tx.type] = (acc[tx.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('Transaction types breakdown:', typeCounts);
      
      // Send transactions to backend for storage using our API endpoint
      try {
        console.log('Sending blockchain transactions to backend for processing');
        
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
        
        console.log('Backend sync response:', response);
        
        // Immediately invalidate all relevant queries to update UI right away
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress] });
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'transactions', 'swap'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'transactions', 'faucet_claim'] });
        queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
        
        console.log('Sync completed successfully. UI refreshed with latest data.');
        setLastSyncTime(new Date());
      } catch (syncError) {
        console.error('Error saving blockchain transactions to database:', syncError);
        setError('Error saving transactions. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching from blockchain:', err);
      if (String(err).includes('timed out')) {
        setError('Blockchain query timed out. Showing local data only.');
      } else {
        setError('Error fetching blockchain data. Showing local data only.');
      }
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