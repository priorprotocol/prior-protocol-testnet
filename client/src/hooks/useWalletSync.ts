import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";

/**
 * A hook that ensures wallet connection state is synchronized across all components.
 * Components that need to be notified of wallet changes should use this hook.
 */
export function useWalletSync() {
  // Get the base wallet context
  const walletContext = useWallet();
  
  // Extract the original functions we'll enhance
  const { 
    openWalletModal: origOpenWalletModal, 
    connectWallet: origConnectWallet,
    disconnectWallet: origDisconnectWallet 
  } = walletContext;
  
  // Store synchronized state locally - always start with context values
  const [syncedAddress, setSyncedAddress] = useState<string | null>(walletContext.address);
  const [isLocalConnected, setIsLocalConnected] = useState<boolean>(!!walletContext.address);
  
  // Keep local state synchronized with context
  useEffect(() => {
    console.log("Wallet context updated, syncing local state. Address:", walletContext.address);
    setSyncedAddress(walletContext.address);
    setIsLocalConnected(!!walletContext.address);
  }, [walletContext.address]);
  
  // Listen for custom wallet events (for cross-component communication)
  useEffect(() => {
    const handleWalletChanged = (event: CustomEvent) => {
      // Update local state based on the event
      const { address } = event.detail;
      console.log("Wallet sync event received:", event.detail);
      setSyncedAddress(address);
      setIsLocalConnected(!!address);
    };
    
    // Add event listener
    window.addEventListener('walletChanged', handleWalletChanged as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('walletChanged', handleWalletChanged as EventListener);
    };
  }, []);
  
  // Try to restore wallet from localStorage on initial mount
  useEffect(() => {
    // Only try to restore if not already connected
    if (walletContext.address) return;
    
    // Check localStorage on mount
    try {
      const savedWalletState = localStorage.getItem('walletState');
      
      if (savedWalletState) {
        const { address, timestamp } = JSON.parse(savedWalletState);
        
        // Session timeout after 24 hours
        const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
        
        if (address && !isExpired) {
          // If we have saved state, but it's not in the context, try to reconnect
          console.log("Found saved wallet state in localStorage, attempting to reconnect...");
          origConnectWallet().catch(err => {
            console.error("Error auto-reconnecting wallet from localStorage:", err);
            // Clear localStorage on failed reconnect
            localStorage.removeItem('walletState');
          });
        } else if (isExpired) {
          // Clear expired wallet state
          localStorage.removeItem('walletState');
        }
      }
    } catch (e) {
      console.error("Error checking localStorage for wallet state:", e);
      // Clear potentially corrupted state
      localStorage.removeItem('walletState');
    }
  }, [origConnectWallet, walletContext.address]);
  
  // Enhanced openWalletModal with logging
  const openWalletModal = useCallback(() => {
    console.log("openWalletModal called from synchronized component");
    origOpenWalletModal();
  }, [origOpenWalletModal]);
  
  // Enhanced disconnectWallet with guaranteed state cleanup
  const disconnectWallet = useCallback(() => {
    console.log("Enhanced disconnectWallet called from synchronized component");
    
    // Clear local state first
    setSyncedAddress(null);
    setIsLocalConnected(false);
    
    // Clear localStorage state
    localStorage.removeItem('walletState');
    
    // Call original disconnect
    origDisconnectWallet();
    
    // Force dispatch a wallet changed event for other components
    const event = new CustomEvent('walletChanged', { 
      detail: { address: null } 
    });
    window.dispatchEvent(event);
  }, [origDisconnectWallet]);
  
  // Return synchronized values with enhanced functions
  return { 
    ...walletContext,
    address: syncedAddress, 
    isConnected: isLocalConnected,
    openWalletModal,
    disconnectWallet,
  };
}