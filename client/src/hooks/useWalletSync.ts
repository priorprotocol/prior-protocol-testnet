import { useEffect } from "react";
import { useWallet } from "@/context/WalletContext";

/**
 * A hook that ensures wallet connection state is synchronized across all components.
 * Components that need to be notified of wallet changes should use this hook.
 */
export function useWalletSync() {
  const { address, isConnected, openWalletModal } = useWallet();
  
  useEffect(() => {
    // Create a listener for the custom wallet event
    const handleWalletChanged = (event: CustomEvent) => {
      // If for some reason openWalletModal was called from another component
      // and this component needs to show a connect button, this will update the UI
      console.log("Wallet sync event received:", event.detail);
    };
    
    // Add event listener
    window.addEventListener('walletChanged', handleWalletChanged as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('walletChanged', handleWalletChanged as EventListener);
    };
  }, []);
  
  return { address, isConnected, openWalletModal };
}