import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useStandaloneWallet } from './useStandaloneWallet';
import { apiRequest } from '@/lib/queryClient';

// This hook synchronizes blockchain transactions with our backend
// It fetches transactions directly from the block explorer and sends them
// to our backend to be stored and used for pointsb attribution
export function useBlockExplorerSync() {
  const { address: contextAddress, isConnected } = useWallet();
  const { address: standaloneAddress } = useStandaloneWallet();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStats, setSyncStats] = useState<{
    newTransactions: number;
    swaps: number;
    claims: number;
    points: number;
  } | null>(null);

  // Use whichever address is available
  const address = contextAddress || standaloneAddress;

  // Function to trigger a sync with the block explorer
  const syncTransactions = async (): Promise<boolean> => {
    if (!address) {
      console.log('No wallet address available for sync');
      return false;
    }

    setIsSyncing(true);
    try {
      console.log('Syncing transactions for address:', address);
      
      // Step 1: Fetch transactions from block explorer
      const { fetchBlockExplorerTransactions } = await import('@/lib/blockExplorerService');
      const transactions = await fetchBlockExplorerTransactions(address);
      
      if (transactions.length === 0) {
        console.log('No relevant transactions found in block explorer');
        setIsSyncing(false);
        return false;
      }
      
      console.log(`Found ${transactions.length} transactions in block explorer`);
      
      // Step 2: Send transactions to our backend for processing
      const response = await apiRequest('/sync-transactions', {
        method: 'POST',
        body: JSON.stringify({
          address,
          transactions
        })
      });
      
      console.log('Sync response:', response);
      
      if (response && response.success) {
        setSyncStats(response.stats);
        setLastSyncTime(new Date());
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error syncing transactions:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync when the wallet address changes
  useEffect(() => {
    if (address) {
      console.log('Wallet address changed, triggering transaction sync');
      syncTransactions();
    }
  }, [address]);

  return {
    syncTransactions,
    isSyncing,
    lastSyncTime,
    syncStats
  };
}

export default useBlockExplorerSync;