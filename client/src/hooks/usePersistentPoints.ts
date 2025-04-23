import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

/**
 * Interface for persistent points data
 */
export interface PersistentPointsData {
  persistentPoints: number;
  lastSync: string | null;
}

/**
 * Response from the persistent points API
 */
interface PersistentPointsResponse {
  success: boolean;
  data: PersistentPointsData;
}

/**
 * Custom hook to fetch and manage user's persistent points
 * These are points that are directly calculated from swap transactions
 * and don't get wiped during server resets
 */
export function usePersistentPoints(address: string | null) {
  const queryClient = useQueryClient();
  
  // Fetch persistent points data
  const { 
    data, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['/api/users', address, 'persistent-points'],
    queryFn: async () => {
      if (!address) return null;
      
      try {
        const response = await apiRequest<PersistentPointsResponse>(`/api/users/${address}/persistent-points`);
        console.log("Fetched persistent points:", response);
        
        if (response && response.success && response.data) {
          return response.data;
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Error fetching persistent points:", error);
        // Return default values if user not found or error
        return {
          persistentPoints: 0,
          lastSync: null
        } as PersistentPointsData;
      }
    },
    enabled: Boolean(address)
  });
  
  // Mutation to sync persistent points (manual refresh)
  const syncPersistentPoints = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("No wallet address");
      
      try {
        console.log("Syncing persistent points for address:", address);
        const response = await apiRequest<PersistentPointsResponse>(
          `/api/users/${address}/sync-persistent-points`, 
          { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        console.log("Sync response:", response);
        return response;
      } catch (error) {
        console.error("Error syncing persistent points:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Sync successful, data:", data);
      // Invalidate and refetch the persistent points
      queryClient.invalidateQueries({ queryKey: ['/api/users', address, 'persistent-points'] });
      // Also invalidate normal stats since they might have changed
      queryClient.invalidateQueries({ queryKey: ['/api/users', address, 'stats'] });
    }
  });
  
  return {
    persistentPoints: data?.persistentPoints || 0,
    lastSync: data?.lastSync ? new Date(data.lastSync) : null,
    isLoading,
    error,
    refetch,
    syncPersistentPoints: syncPersistentPoints.mutate,
    isSyncing: syncPersistentPoints.isPending
  };
}

export default usePersistentPoints;