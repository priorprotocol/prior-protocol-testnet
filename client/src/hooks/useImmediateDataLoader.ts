import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBlockExplorerSync } from './useBlockExplorerSync';
import { apiRequest } from '@/lib/queryClient';

/**
 * This hook automatically loads all user data immediately after wallet connection
 * It ensures user data is available across the entire application without waiting
 * for navigation to specific pages.
 * 
 * It also loads global data like leaderboard immediately on app start.
 */
export function useImmediateDataLoader(address: string | null) {
  const queryClient = useQueryClient();
  const { syncTransactions } = useBlockExplorerSync(address);
  
  // Load global data immediately on hook mount, regardless of wallet connection
  useEffect(() => {
    console.log('App started, immediately loading global data');
    
    // Track loading state
    const globalLoadStart = Date.now();
    
    // Parallel global data loading
    const globalPromises = [
      // 1. Load leaderboard data immediately
      queryClient.prefetchQuery({
        queryKey: ['/api/leaderboard'],
        queryFn: () => apiRequest('/api/leaderboard'),
        staleTime: 5000 // Consider stale after 5 seconds to enable frequent refreshes
      }),
      
      // 2. Load token data
      queryClient.prefetchQuery({
        queryKey: ['/api/tokens'],
        queryFn: () => apiRequest('/api/tokens')
      })
    ];
    
    // Execute global data loading in parallel
    Promise.all(globalPromises)
      .then(() => {
        const loadTime = Date.now() - globalLoadStart;
        console.log(`✅ Global data pre-loaded in ${loadTime}ms`);
        
        // Set up auto-refresh interval for leaderboard
        const refreshLeaderboard = setInterval(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
        }, 10000); // Refresh every 10 seconds
        
        // Clean up interval on unmount
        return () => clearInterval(refreshLeaderboard);
      })
      .catch(error => {
        console.error('Error pre-loading global data:', error);
      });
  }, [queryClient]);
  
  // Immediately load user-specific data when wallet is connected
  useEffect(() => {
    if (!address) return;
    
    // Keep track if component is still mounted
    let isMounted = true;
    
    // Create a stable reference to avoid continuous calls
    const currentAddress = address;
    
    // Wait a short time to avoid multiple rapid data loading requests
    const debounceTimer = setTimeout(() => {
      if (!isMounted) return;
      
      console.log('Wallet connected, immediately loading user data for:', currentAddress);
      
      // Track loading state
      const userLoadStart = Date.now();
      
      // Parallel user data loading for maximum speed
      const userPromises = [
        // 1. Load user stats (points, swap count, etc)
        queryClient.prefetchQuery({
          queryKey: [`/api/users/${currentAddress}/stats`],
          queryFn: () => apiRequest(`/api/users/${currentAddress}/stats`)
        }),
        
        // 2. Load user transactions
        queryClient.prefetchQuery({
          queryKey: [`/api/users/${currentAddress}/transactions`],
          queryFn: () => apiRequest(`/api/users/${currentAddress}/transactions`)
        }),
        
        // 3. Load user swap transactions 
        queryClient.prefetchQuery({
          queryKey: [`/api/users/${currentAddress}/transactions`, 'swap'],
          queryFn: () => apiRequest(`/api/users/${currentAddress}/transactions/swap`)
        })
      ];
      
      // Execute all user data loading in parallel
      Promise.all(userPromises)
        .then(() => {
          if (!isMounted) return;
          
          const loadTime = Date.now() - userLoadStart;
          console.log(`✅ User data pre-loaded in ${loadTime}ms`);
          
          // We're no longer syncing with blockchain, only using database
          // Refresh the leaderboard after user data is loaded
          queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
        })
        .catch(error => {
          if (!isMounted) return;
          console.error('Error pre-loading user data:', error);
        });
    }, 100); // Small debounce timer to avoid repeated calls
    
    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [address, queryClient]);
  
  // No return value needed, this hook is for side effects only
  return null;
}

export default useImmediateDataLoader;