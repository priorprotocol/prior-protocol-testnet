import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook to fetch transactions from our database with improved retry logic
 * We're no longer using Basescan API due to rate limiting issues
 */
export function useBlockExplorerSync(address: string | null) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Use refs to track sync attempts and prevent multiple concurrent syncs
  const syncAttempts = useRef<number>(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef<boolean>(true);

  // Improved function to fetch transactions with retry logic
  const syncTransactions = async (walletAddress: string, forceSync: boolean = false) => {
    if ((!walletAddress || isSyncing) && !forceSync) return;
    
    // Clear any pending sync timeouts
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    
    try {
      setIsSyncing(true);
      setError(null);
      
      console.log('Refreshing database transactions for:', walletAddress);
      
      try {
        // Add a cache buster directly to the URL to prevent caching issues
        const cacheBuster = Date.now();
        const url = `/api/users/${walletAddress}/transactions?_cb=${cacheBuster}`;
        
        // Use our improved apiRequest with retry logic
        const dbResponse = await apiRequest(url, {
          method: 'GET'
        }, undefined, 2); // 2 retries = total of 3 attempts
        
        console.log('Local database transactions:', dbResponse);
        
        // Reset sync attempts counter on success
        syncAttempts.current = 0;
        
        // Invalidate all relevant queries to ensure UI updates with fresh data
        invalidateRelevantQueries(walletAddress);
        
        console.log('Local data refresh completed successfully.');
        setLastSyncTime(new Date());
        
        // Show a success toast if this was a manual refresh (not auto-sync)
        if (forceSync) {
          toast({
            title: "Data Refresh Successful",
            description: "Your transaction history has been updated",
            duration: 3000,
          });
        }
      } catch (dbError) {
        console.error('Error fetching database transactions:', dbError);
        setError('Error refreshing transactions. Please try again.');
        
        // Increment sync attempts counter
        syncAttempts.current += 1;
        
        // If we've tried less than 3 times, try again with exponential backoff
        if (syncAttempts.current < 3 && isComponentMounted.current) {
          const backoffTime = Math.min(1000 * Math.pow(2, syncAttempts.current), 8000);
          console.log(`Retrying transaction sync in ${backoffTime / 1000}s...`);
          
          syncTimeoutRef.current = setTimeout(() => {
            if (isComponentMounted.current) {
              console.log(`Automatic retry attempt ${syncAttempts.current + 1} for transaction sync`);
              syncTransactions(walletAddress, false);
            }
          }, backoffTime);
        } else if (forceSync) {
          // Only show error toast for manual refresh attempts
          toast({
            title: "Data Refresh Failed",
            description: "Could not update your transaction history. Please try again later.",
            duration: 5000,
            variant: "destructive"
          });
        }
      }
    } catch (err) {
      console.error('Error in sync process:', err);
      setError('Data refresh failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Helper function to invalidate all relevant queries
  const invalidateRelevantQueries = (walletAddress: string) => {
    // Invalidate user data
    queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress] });
    
    // Invalidate transactions data
    queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'transactions'] });
    
    // Invalidate transaction types
    queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'transactions', 'swap'] });
    queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'transactions', 'faucet_claim'] });
    
    // Invalidate user stats
    queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'stats'] });
    
    // Invalidate user rank
    queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress, 'rank'] });
    
    // Invalidate global leaderboard
    queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
  };

  // Auto-sync when address changes with debounce
  useEffect(() => {
    if (address) {
      // Reset sync attempts counter when address changes
      syncAttempts.current = 0;
      
      // Add a small delay to avoid multiple rapid syncs
      const debounceTimer = setTimeout(() => {
        if (isComponentMounted.current) {
          syncTransactions(address);
        }
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [address]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    isSyncing,
    lastSyncTime,
    error,
    syncTransactions: address ? (force = false) => syncTransactions(address, force) : undefined
  };
}

export default useBlockExplorerSync;