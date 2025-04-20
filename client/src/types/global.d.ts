/**
 * Global TypeScript declaration file for custom window properties
 */

// Extend Window interface to include our custom properties
interface Window {
  // Wallet event throttling timestamp
  _lastWalletEvent: number;
  
  // Global wallet disconnect function (for emergency use)
  disconnectWallet: () => void;
  
  // Debug function for wallet state (legacy)
  __setWalletAddress?: (address: string) => boolean;
  
  // MetaMask or other wallet provider
  ethereum?: {
    request: (args: any) => Promise<any>;
    on: (event: string, listener: (...args: any[]) => void) => void;
    removeAllListeners: (event: string) => void;
  };
}