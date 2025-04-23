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
  message?: string;
  data: PersistentPointsData;
}

/**
 * Response from the sync persistent points API
 */
interface SyncPersistentPointsResponse {
  success: boolean;
  message?: string;
  data: {
    persistentPoints: number;
    regularPoints: number;
    updatedAt: string;
  };
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
        console.log("Fetching persistent points for:", address);
        const response = await apiRequest<PersistentPointsResponse>(`/api/users/${address}/persistent-points`);
        console.log("Fetched persistent points:", response);
        
        if (response && response.success && response.data) {
          // Make sure we explicitly convert to number to avoid any type issues
          const pointsValue = Number(response.data.persistentPoints) || 0;
          console.log(`Parsed persistent points value: ${pointsValue} (original: ${response.data.persistentPoints})`);
          
          return {
            persistentPoints: pointsValue,
            lastSync: response.data.lastSync
          };
        } else {
          console.error("Invalid response format:", response);
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
    enabled: Boolean(address),
    // Poll every minute to keep the data fresh
    refetchInterval: 60000
  });
  
  // Mutation to sync persistent points (manual refresh)
  const syncPersistentPoints = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("No wallet address");
      
      try {
        console.log("Syncing persistent points for address:", address);
        const response = await apiRequest<SyncPersistentPointsResponse>(
          `/api/users/${address}/sync-persistent-points`, 
          { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log("Sync response:", JSON.stringify(response, null, 2));
        
        // More detailed validation
        if (!response) {
          throw new Error("Empty response from server");
        }
        
        if (!response.success) {
          throw new Error(response.message || "Sync failed with unknown error");
        }
        
        if (!response.data) {
          throw new Error("Response missing data field");
        }
        
        // Make sure we have a numeric value for points
        const pointsValue = Number(response.data.persistentPoints) || 0;
        console.log(`Sync complete, parsed points value: ${pointsValue} (original: ${response.data.persistentPoints})`);
        
        // Return normalized data
        return {
          ...response,
          data: {
            ...response.data,
            persistentPoints: pointsValue
          }
        };
      } catch (error) {
        console.error("Error syncing persistent points:", error);
        if (error instanceof Error) {
          console.error("Error details:", error.message);
          if (error.stack) console.error("Stack trace:", error.stack);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Sync successful, data:", data);
      if (data?.data?.persistentPoints !== undefined) {
        console.log(`Successfully synced points: ${data.data.persistentPoints}`);
      }
      
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