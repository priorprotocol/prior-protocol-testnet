import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";

/**
 * A hook that ensures wallet connection state is synchronized across all components.
 * Components that need to be notified of wallet changes should use this hook.
 */
export function useWalletSync() {
  const walletContext = useWallet();
  const { openWalletModal: origOpenWalletModal, connectWallet: origConnectWallet } = walletContext;
  
  // Store synchronized state locally
  const [syncedAddress, setSyncedAddress] = useState<string | null>(walletContext.address);
  const [isLocalConnected, setIsLocalConnected] = useState<boolean>(!!walletContext.address);
  
  // Listen for wallet changes and update local state
  useEffect(() => {
    // Update local state from context
    setSyncedAddress(walletContext.address);
    setIsLocalConnected(!!walletContext.address);
    
    // Create a listener for the custom wallet event
    const handleWalletChanged = (event: CustomEvent) => {
      // Update local state based on the event
      const { address } = event.detail;
      setSyncedAddress(address);
      setIsLocalConnected(!!address);
      console.log("Wallet sync event received:", event.detail);
    };
    
    // Add event listener
    window.addEventListener('walletChanged', handleWalletChanged as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('walletChanged', handleWalletChanged as EventListener);
    };
  }, [walletContext.address]);
  
  // Restore from localStorage if available
  useEffect(() => {
    // Check localStorage on mount
    try {
      const savedWalletState = localStorage.getItem('walletState');
      
      if (savedWalletState && !walletContext.address) {
        const { address, timestamp } = JSON.parse(savedWalletState);
        
        // Session timeout after 24 hours
        const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
        
        if (address && !isExpired) {
          // If we have saved state, but it's not in the context, try to reconnect
          console.log("Found saved wallet state in localStorage, attempting to reconnect...");
          origConnectWallet().catch(err => {
            console.error("Error auto-reconnecting wallet from localStorage:", err);
            localStorage.removeItem('walletState');
          });
        }
      }
    } catch (e) {
      console.error("Error checking localStorage for wallet state:", e);
    }
  }, [origConnectWallet]);
  
  // Enhanced openWalletModal that tracks attempts
  const openWalletModal = useCallback(() => {
    console.log("openWalletModal called from synchronized component");
    origOpenWalletModal();
  }, [origOpenWalletModal]);
  
  // Return synchronized values
  return { 
    ...walletContext,
    address: syncedAddress, 
    isConnected: isLocalConnected,
    openWalletModal,
  };
}