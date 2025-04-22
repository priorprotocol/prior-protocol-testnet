import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

export interface NftStakingRecord {
  id: number;
  userId: number;
  address: string;
  nftContractAddress: string;
  tokenId: string;
  stakedAt: string;
  unstakeAt: string | null;
  status: string;
  bonusReceived: boolean;
  bonusAmount: number;
  bonusTxId: number | null;
  activations: number;
}

export interface StakingJourneySummary {
  totalActivations: number;
  daysStaked: number;
  firstTimeBonusReceived: boolean;
  bonusAmount: number;
  activeStakes: NftStakingRecord[];
}

export const useStakingJourney = (address: string | undefined) => {
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Fetch staking journey data
  const {
    data: journeyData,
    isLoading: journeyLoading,
    refetch: refetchJourney
  } = useQuery({
    queryKey: ['/api/staking', address, 'journey'],
    queryFn: async () => {
      if (!address) return null;
      try {
        setSyncError(null);
        const response = await apiRequest<{ success: boolean; data: StakingJourneySummary }>(`/api/staking/${address}/journey`);
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch staking journey data');
        }
        
        return response.data;
      } catch (error) {
        console.error('Error fetching staking journey:', error);
        setSyncError('Failed to load staking journey data. Please try again.');
        return null;
      }
    },
    enabled: !!address,
    refetchOnWindowFocus: false
  });
  
  // Fetch staking records
  const {
    data: stakingRecords,
    isLoading: recordsLoading,
    refetch: refetchRecords
  } = useQuery({
    queryKey: ['/api/staking', address, 'records'],
    queryFn: async () => {
      if (!address) return [];
      try {
        setSyncError(null);
        const response = await apiRequest<{ success: boolean; data: NftStakingRecord[] }>(`/api/staking/${address}/records`);
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch staking records');
        }
        
        return response.data;
      } catch (error) {
        console.error('Error fetching staking records:', error);
        setSyncError('Failed to load staking records. Please try again.');
        return [];
      }
    },
    enabled: !!address,
    refetchOnWindowFocus: false
  });
  
  // Combined refetch function
  const refreshAllData = async () => {
    try {
      await Promise.all([
        refetchJourney(),
        refetchRecords()
      ]);
      setSyncError(null);
    } catch (error) {
      console.error('Error refreshing staking data:', error);
      setSyncError('Failed to refresh staking data. Please try again.');
    }
  };
  
  return {
    journeyData,
    stakingRecords,
    isLoading: journeyLoading || recordsLoading,
    syncError,
    refreshAllData
  };
};