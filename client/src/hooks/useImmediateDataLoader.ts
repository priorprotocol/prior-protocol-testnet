import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBlockExplorerSync } from './useBlockExplorerSync';
import { apiRequest } from '@/lib/queryClient';

/**
 * This hook automatically loads all user data immediately after wallet connection
 * It ensures user data is available across the entire application without waiting
 * for navigation to specific pages
 */
export function useImmediateDataLoader(address: string | null) {
  const queryClient = useQueryClient();
  const { syncTransactions } = useBlockExplorerSync(address);
  
  // Immediately load all user data when wallet is connected
  useEffect(() => {
    if (!address) return;
    
    console.log('Wallet connected, immediately loading all user data for:', address);
    
    // Track loading state
    const loadStart = Date.now();
    
    // Parallel data loading for maximum speed
    const promises = [
      // 1. Load user stats (points, swap count, etc)
      queryClient.prefetchQuery({
        queryKey: [`/api/users/${address}/stats`],
        queryFn: () => apiRequest(`/api/users/${address}/stats`)
      }),
      
      // 2. Load user transactions
      queryClient.prefetchQuery({
        queryKey: [`/api/users/${address}/transactions`],
        queryFn: () => apiRequest(`/api/users/${address}/transactions`)
      }),
      
      // 3. Load user swap transactions 
      queryClient.prefetchQuery({
        queryKey: [`/api/users/${address}/transactions`, 'swap'],
        queryFn: () => apiRequest(`/api/users/${address}/transactions/swap`)
      }),
      
      // 4. Load token data
      queryClient.prefetchQuery({
        queryKey: ['/api/tokens'],
        queryFn: () => apiRequest('/api/tokens')
      }),
      
      // 5. Load leaderboard data
      queryClient.prefetchQuery({
        queryKey: ['/api/leaderboard'],
        queryFn: () => apiRequest('/api/leaderboard')
      })
    ];
    
    // Execute all data loading in parallel
    Promise.all(promises)
      .then(() => {
        const loadTime = Date.now() - loadStart;
        console.log(`✅ All user data pre-loaded in ${loadTime}ms`);
        
        // After database data is loaded, sync with blockchain
        if (syncTransactions) {
          console.log('Now syncing blockchain data in background...');
          syncTransactions();
        }
      })
      .catch(error => {
        console.error('Error pre-loading user data:', error);
      });
  }, [address, queryClient, syncTransactions]);
  
  // No return value needed, this hook is for side effects only
  return null;
}

export default useImmediateDataLoader;