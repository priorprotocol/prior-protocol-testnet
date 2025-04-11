import { useState, useEffect, useCallback } from 'react';
import {
  connectWallet,
  disconnectWallet,
  getConnectedWallet,
  addWalletListener,
  restoreWalletConnection,
  isWalletConnected
} from '@/lib/standaloneWallet';

/**
 * Hook to use standalone wallet functionality in components
 * This provides a consistent wallet state across all components using it
 */
export function useStandaloneWallet() {
  const [address, setAddress] = useState<string | null>(getConnectedWallet());
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  // Sync wallet state
  useEffect(() => {
    // Check immediately if wallet is already connected
    const currentAddress = getConnectedWallet();
    if (currentAddress !== address) {
      setAddress(currentAddress);
    }

    // Try to restore previous connection
    if (!currentAddress) {
      restoreWalletConnection().then(newAddress => {
        if (newAddress) {
          setAddress(newAddress);
        }
      });
    }

    // Listen for wallet changes
    const removeListener = addWalletListener(newAddress => {
      console.log("Wallet address changed:", newAddress);
      setAddress(newAddress);
      
      // If address changed to null, we've disconnected
      if (!newAddress) {
        setChainId(null);
      }
    });

    // Cleanup listener on unmount
    return () => {
      removeListener();
    };
  }, []);

  // Connect to wallet
  const connect = useCallback(async () => {
    if (isConnecting) return null;
    
    try {
      setIsConnecting(true);
      const newAddress = await connectWallet();
      // We don't need to set state here as the listener will handle it
      return newAddress;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    try {
      disconnectWallet();
      // We don't need to set state here as the listener will handle it
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  }, []);

  return {
    address,
    isConnected: !!address,
    isConnecting,
    chainId,
    connect,
    disconnect
  };
}