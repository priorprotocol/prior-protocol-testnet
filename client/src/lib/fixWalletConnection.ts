// Direct wallet connection script that bypasses the problematic context

/**
 * A simple function to connect a wallet directly, bypassing the existing hooks
 */
export async function connectWalletDirectly(): Promise<string | null> {
  try {
    if (!window.ethereum) {
      console.error("No MetaMask found");
      window.open('https://metamask.io/download.html', '_blank');
      return null;
    }
    
    console.log("Requesting accounts directly...");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    
    if (!accounts || accounts.length === 0) {
      console.error("No accounts found");
      return null;
    }
    
    const account = accounts[0];
    console.log("Account connected:", account);
    
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
    
    // Store in localStorage
    localStorage.setItem('walletDirectAddress', account);
    
    // Also save in standard walletState format for compatibility
    localStorage.setItem('walletState', JSON.stringify({
      address: account,
      timestamp: Date.now()
    }));
    
    // Try to refresh the page to ensure all components have the latest state
    window.location.reload();
    
    return account;
  } catch (error) {
    console.error("Error connecting wallet directly:", error);
    return null;
  }
}

/**
 * Function to check if wallet is connected
 */
export function getConnectedWallet(): string | null {
  // Try localStorage first
  const directAddress = localStorage.getItem('walletDirectAddress');
  if (directAddress) return directAddress;
  
  // Try walletState as fallback
  try {
    const walletState = localStorage.getItem('walletState');
    if (walletState) {
      const { address } = JSON.parse(walletState);
      return address;
    }
  } catch (error) {
    console.error("Error parsing wallet state:", error);
  }
  
  return null;
}

/**
 * Function to disconnect wallet
 */
export function disconnectWalletDirectly(): void {
  localStorage.removeItem('walletDirectAddress');
  localStorage.removeItem('walletState');
  
  // Refresh page to ensure all components update
  window.location.reload();
}