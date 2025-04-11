/**
 * Global wallet state store
 * 
 * This centralizes wallet state management to ensure consistency across components.
 * Provides both direct access to wallet state and subscribable updates.
 */

// Define our listeners and state
type Listener = (address: string | null) => void;
let listeners: Listener[] = [];
let currentAddress: string | null = null;

// Initialize from localStorage on module load
try {
  const savedState = localStorage.getItem('walletState');
  if (savedState) {
    const { address, timestamp } = JSON.parse(savedState);
    // Session timeout after 24 hours
    const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
    
    if (address && !isExpired) {
      currentAddress = address;
      console.log("Wallet state restored from localStorage:", address);
    } else {
      localStorage.removeItem('walletState');
    }
  }
} catch (error) {
  console.error("Failed to restore wallet state:", error);
  localStorage.removeItem('walletState');
}

// Add a listener to be notified of wallet changes
export function subscribeToWallet(listener: Listener): () => void {
  listeners.push(listener);
  
  // Immediately notify the listener of the current state
  if (currentAddress) {
    setTimeout(() => listener(currentAddress), 0);
  }
  
  // Return a function to unsubscribe
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

// Update the wallet address and notify all listeners
export function setWalletAddress(address: string | null): void {
  if (currentAddress === address) return;
  
  currentAddress = address;
  console.log("Wallet address updated:", address);
  
  // Persist to localStorage for page reloads
  if (address) {
    localStorage.setItem('walletState', JSON.stringify({
      address,
      timestamp: Date.now()
    }));
  } else {
    localStorage.removeItem('walletState');
  }
  
  // Notify all subscribers
  listeners.forEach(listener => {
    try {
      listener(address);
    } catch (error) {
      console.error("Error in wallet listener:", error);
    }
  });
}

// Get the current wallet address
export function getWalletAddress(): string | null {
  return currentAddress;
}

// Disconnect wallet
export function disconnectWallet(): void {
  setWalletAddress(null);
}

// Export a single object for easier imports
export const walletStore = {
  subscribe: subscribeToWallet,
  setAddress: setWalletAddress,
  getAddress: getWalletAddress,
  disconnect: disconnectWallet
};

export default walletStore;