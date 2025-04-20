/**
 * Standalone wallet connection module
 * This provides direct methods to connect/disconnect wallets without relying on context
 */

// Event emitter system to notify components of changes
type WalletListener = (address: string | null) => void;
const listeners: WalletListener[] = [];

/**
 * Add a listener to be notified when wallet state changes
 */
export function addWalletListener(listener: WalletListener) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
}

// Track the last wallet address to prevent duplicate notifications
let lastNotifiedAddress: string | null = null;

/**
 * Notify all listeners of a wallet state change, but only if the address has actually changed
 */
function notifyListeners(address: string | null) {
  // Skip if the address hasn't changed (prevents redundant notifications)
  if (address === lastNotifiedAddress) {
    console.log("Skipping redundant wallet notification for:", address);
    return;
  }
  
  // Update the last notified address
  lastNotifiedAddress = address;
  
  console.log(`Notifying ${listeners.length} listeners of wallet change to:`, address);
  
  for (const listener of listeners) {
    try {
      listener(address);
    } catch (error) {
      console.error("Error in wallet listener:", error);
    }
  }
}

// Store wallet state
interface WalletState {
  address: string | null;
  timestamp: number;
  chainId?: number;
}

/**
 * Save wallet state to localStorage
 */
function saveWalletState(address: string | null, chainId?: number) {
  // Only process if the address has actually changed
  const currentState = getWalletState();
  
  if (currentState?.address === address && !chainId) {
    console.log("Wallet state unchanged, skipping update for:", address);
    return;
  }
  
  console.log("Saving wallet state:", address);
  
  const state: WalletState = {
    address,
    timestamp: Date.now(),
    chainId: chainId || currentState?.chainId
  };
  
  if (address) {
    localStorage.setItem('walletState', JSON.stringify(state));
  } else {
    localStorage.removeItem('walletState');
  }
  
  // Notify any listeners about the change - this will check for redundant notifications
  notifyListeners(address);
  
  // Throttle custom events to prevent overload
  if (window._lastWalletEvent && Date.now() - window._lastWalletEvent < 500) {
    console.log("Throttling wallet change event");
    return;
  }
  
  // Store the timestamp of the last event
  window._lastWalletEvent = Date.now();
  
  // Trigger a custom event for components that listen for it
  try {
    const event = new CustomEvent('walletChanged', { 
      detail: { address } 
    });
    window.dispatchEvent(event);
  } catch (error) {
    console.error("Error dispatching wallet event:", error);
  }
}

/**
 * Get current wallet state from localStorage
 */
export function getWalletState(): WalletState | null {
  const stateJson = localStorage.getItem('walletState');
  if (!stateJson) return null;
  
  try {
    return JSON.parse(stateJson) as WalletState;
  } catch (error) {
    console.error("Error parsing wallet state:", error);
    return null;
  }
}

/**
 * Connect to wallet directly
 * @returns Connected address or null if failed
 */
export async function connectWallet(): Promise<string | null> {
  if (!window.ethereum) {
    console.error("MetaMask not found");
    window.open('https://metamask.io/download.html', '_blank');
    return null;
  }
  
  console.log("Requesting accounts from wallet...");
  
  try {
    const accounts = await window.ethereum.request({ 
      method: "eth_requestAccounts" 
    });
    
    if (!accounts || accounts.length === 0) {
      console.error("No accounts returned from wallet");
      return null;
    }
    
    const address = accounts[0];
    console.log("Wallet connected:", address);
    
    // Try to switch to Base Sepolia network
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${(84532).toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${(84532).toString(16)}`,
                chainName: "Base Sepolia",
                nativeCurrency: {
                  name: "Sepolia Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://sepolia.base.org"],
                blockExplorerUrls: ["https://sepolia.basescan.org"],
              },
            ],
          });
        } catch (addError) {
          console.error("Error adding chain:", addError);
        }
      }
    }
    
    // Get current chain ID
    const chainId = await window.ethereum.request({ 
      method: "eth_chainId" 
    });
    
    // Save wallet state
    saveWalletState(address, parseInt(chainId, 16));
    
    // Remove any existing listeners first to prevent duplicates
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
    
    // Add event listener for account changes
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      console.log("Accounts changed:", accounts);
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnectWallet();
      } else {
        // User switched accounts
        saveWalletState(accounts[0]);
      }
    });
    
    // Add event listener for chain changes
    window.ethereum.on('chainChanged', (chainId: string) => {
      console.log("Chain changed:", chainId);
      const state = getWalletState();
      if (state?.address) {
        saveWalletState(state.address, parseInt(chainId, 16));
      }
    });
    
    return address;
  } catch (error) {
    console.error("Error connecting wallet:", error);
    return null;
  }
}

/**
 * Disconnect wallet
 */
export function disconnectWallet() {
  console.log("Standalone wallet disconnect called");
  
  // Clear wallet state
  saveWalletState(null);
  
  // Remove event listeners
  if (window.ethereum) {
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }
}

// Make the disconnect function available globally
if (typeof window !== 'undefined') {
  // Add throttling timestamp to window object
  window._lastWalletEvent = 0;
  // Add disconnect method
  window.disconnectWallet = disconnectWallet;
}

/**
 * Get the currently connected wallet address
 */
export function getConnectedWallet(): string | null {
  const state = getWalletState();
  return state?.address || null;
}

/**
 * Check if wallet is connected
 */
export function isWalletConnected(): boolean {
  return getConnectedWallet() !== null;
}

/**
 * Restore wallet connection on page load
 * Call this when the application starts to try to reconnect to the previously connected wallet
 */
export async function restoreWalletConnection(): Promise<string | null> {
  const state = getWalletState();
  if (!state?.address) return null;
  
  // If there's a saved state, try to reconnect
  console.log("Restoring wallet connection from saved state...");
  
  try {
    // Check if the wallet is still connected
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ 
        method: "eth_accounts" 
      });
      
      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        console.log("Wallet restored:", address);
        
        // Get current chain ID
        const chainId = await window.ethereum.request({ 
          method: "eth_chainId" 
        });
        
        // Remove any existing listeners first to prevent duplicates
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
        
        // Set up listeners
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          console.log("Accounts changed:", accounts);
          if (accounts.length === 0) {
            disconnectWallet();
          } else {
            saveWalletState(accounts[0]);
          }
        });
        
        window.ethereum.on('chainChanged', (chainId: string) => {
          console.log("Chain changed:", chainId);
          saveWalletState(address, parseInt(chainId, 16));
        });
        
        // Save updated state
        saveWalletState(address, parseInt(chainId, 16));
        
        return address;
      }
    }
    
    // If we get here, the wallet is no longer connected
    disconnectWallet();
    return null;
  } catch (error) {
    console.error("Error restoring wallet connection:", error);
    disconnectWallet();
    return null;
  }
}