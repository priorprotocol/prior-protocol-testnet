import { useState, useEffect } from 'react';
import { useStandaloneWallet } from './useStandaloneWallet';
import { fetchBlockExplorerTransactions } from '@/lib/blockExplorerService';

interface UserStats {
  totalSwaps: number;
  totalClaims: number;
  points: number;
  transactions: any[];
}

export function useDashboardStats() {
  const { address } = useStandaloneWallet();
  const [stats, setStats] = useState<UserStats>({
    totalSwaps: 0,
    totalClaims: 0,
    points: 0,
    transactions: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Function to manually refresh data
  const refreshStats = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      // Get transactions directly from block explorer
      const transactions = await fetchBlockExplorerTransactions(address);
      
      // Calculate basic stats
      const swapTxs = transactions.filter(tx => tx.type === 'swap');
      const claimTxs = transactions.filter(tx => tx.type === 'faucet_claim');
      
      // Calculate points based on business rules
      // - 2 points per swap when user completes 10+ swaps per day
      let swapPoints = 0;
      if (swapTxs.length >= 10) {
        swapPoints = swapTxs.length * 2;
      }
      
      setStats({
        totalSwaps: swapTxs.length,
        totalClaims: claimTxs.length,
        points: swapPoints,
        transactions: transactions
      });
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically refresh when wallet address changes
  useEffect(() => {
    if (address) {
      refreshStats();
    }
  }, [address]);

  return {
    stats,
    isLoading,
    lastRefresh,
    refreshStats
  };
}

export default useDashboardStats;