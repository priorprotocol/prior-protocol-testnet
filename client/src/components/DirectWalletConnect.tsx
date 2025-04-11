import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DirectWalletConnectProps {
  onConnect?: (address: string) => void;
  className?: string;
}

/**
 * A completely standalone wallet connection button that bypasses the context
 * system and directly connects to MetaMask without any dependencies.
 */
const DirectWalletConnect: React.FC<DirectWalletConnectProps> = ({ 
  onConnect, 
  className = ''
}) => {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();
  
  // Check if wallet is already connected via localStorage
  useEffect(() => {
    try {
      const savedAddress = localStorage.getItem('directWalletAddress');
      if (savedAddress) {
        setAddress(savedAddress);
        
        // Notify parent component if there's a callback
        if (onConnect) {
          onConnect(savedAddress);
        }
      }
    } catch (error) {
      console.error("Error checking saved wallet:", error);
    }
  }, [onConnect]);
  
  const connectWallet = async () => {
    if (connecting) return;
    
    try {
      setConnecting(true);
      
      if (!window.ethereum) {
        window.open('https://metamask.io/download/', '_blank');
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask to connect your wallet",
          variant: "destructive"
        });
        return;
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }
      
      const connectedAddress = accounts[0];
      
      // Switch to Base Sepolia
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x14a34' }], // 84532 in hex
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x14a34',
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'Sepolia Ether',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org']
            }]
          });
        }
      }
      
      // Save to localStorage
      localStorage.setItem('directWalletAddress', connectedAddress);
      
      // Also save to standard walletState for compatibility
      localStorage.setItem('walletState', JSON.stringify({
        address: connectedAddress,
        timestamp: Date.now()
      }));
      
      // Update state
      setAddress(connectedAddress);
      
      // Call onConnect callback
      if (onConnect) {
        onConnect(connectedAddress);
      }
      
      // Show toast
      toast({
        title: "Wallet Connected",
        description: `Connected to ${connectedAddress.substring(0, 6)}...${connectedAddress.substring(connectedAddress.length - 4)}`,
      });
      
      // Reload the page to ensure all components pick up the new wallet state
      window.location.reload();
      
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };
  
  const disconnectWallet = () => {
    // Clear localStorage
    localStorage.removeItem('directWalletAddress');
    localStorage.removeItem('walletState');
    
    // Update state
    setAddress(null);
    
    // Show toast
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
    
    // Reload the page to ensure all components pick up the new wallet state
    window.location.reload();
  };
  
  // If already connected, show the connected state
  if (address) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          className="bg-[#1E293B] px-4 py-2 rounded-full text-[#A0AEC0] text-sm"
          onClick={(e) => e.preventDefault()}
        >
          {address.substring(0, 6)}...{address.substring(address.length - 4)}
        </button>
        <button
          className="bg-[#1A5CFF] px-4 py-2 rounded-full text-white text-sm font-bold hover:bg-opacity-90 transition-colors"
          onClick={disconnectWallet}
        >
          Disconnect
        </button>
      </div>
    );
  }
  
  // Otherwise show connect button
  return (
    <button
      className={`bg-[#1A5CFF] px-6 py-2 rounded-full text-white text-sm font-bold hover:bg-opacity-90 transition-colors ${className} ${connecting ? 'opacity-70 cursor-not-allowed' : ''}`}
      onClick={connectWallet}
      disabled={connecting}
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
};

export default DirectWalletConnect;