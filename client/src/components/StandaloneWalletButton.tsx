import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  connectWallet,
  disconnectWallet,
  getConnectedWallet,
  addWalletListener,
  restoreWalletConnection
} from '@/lib/standaloneWallet';
import { formatAddress } from '@/lib/formatAddress';
import { useImmediateDataLoader } from '@/hooks/useImmediateDataLoader';

interface StandaloneWalletButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showAddress?: boolean;
  className?: string;
}

const StandaloneWalletButton: React.FC<StandaloneWalletButtonProps> = ({
  onConnect,
  onDisconnect,
  variant = 'primary',
  size = 'md',
  showAddress = true,
  className = ''
}) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  
  // This hook will immediately fetch all user data as soon as the wallet is connected
  // There's no need to wait for navigation to specific pages
  useImmediateDataLoader(address);

  // Initialize wallet state and listeners
  useEffect(() => {
    // Check for existing wallet connection
    const currentAddress = getConnectedWallet();
    if (currentAddress) {
      setAddress(currentAddress);
      if (onConnect) onConnect(currentAddress);
    } else {
      // Try to restore previous connection
      restoreWalletConnection().then(restoredAddress => {
        if (restoredAddress) {
          setAddress(restoredAddress);
          if (onConnect) onConnect(restoredAddress);
        }
      });
    }

    // Add listener for wallet changes
    const removeListener = addWalletListener(newAddress => {
      console.log("Wallet listener triggered with address:", newAddress);
      setAddress(newAddress);
      
      if (newAddress) {
        if (onConnect) onConnect(newAddress);
      } else {
        if (onDisconnect) onDisconnect();
      }
    });

    // Cleanup
    return () => {
      removeListener();
    };
  }, [onConnect, onDisconnect]);

  const handleConnect = async () => {
    if (isConnecting) return;
    
    try {
      setIsConnecting(true);
      const connectedAddress = await connectWallet();
      
      if (connectedAddress) {
        // No need to call setAddress here as the listener will handle that
        toast({
          title: "Wallet Connected",
          description: `Connected to ${formatAddress(connectedAddress)}`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Please make sure MetaMask is installed and unlocked",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    try {
      disconnectWallet();
      // No need to call setAddress here as the listener will handle that
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Style based on variant
  const getVariantClass = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-[#1E293B] text-white hover:bg-opacity-90';
      case 'outline':
        return 'bg-transparent border border-[#1A5CFF] text-[#1A5CFF] hover:bg-[#1A5CFF] hover:bg-opacity-10';
      case 'primary':
      default:
        return 'bg-[#1A5CFF] text-white hover:bg-opacity-90';
    }
  };

  // Style based on size
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-3 py-1.5';
      case 'lg':
        return 'text-md px-8 py-3';
      case 'md':
      default:
        return 'text-sm px-6 py-2';
    }
  };

  const buttonClass = `rounded-full ${getVariantClass()} ${getSizeClass()} transition-all font-bold ${className}`;

  if (address) {
    return (
      <div className="flex items-center space-x-2">
        {showAddress && (
          <button 
            className="bg-[#1E293B] rounded-full px-4 py-2 text-[#A0AEC0] text-sm font-bold"
            onClick={(e) => e.preventDefault()}
          >
            {formatAddress(address)}
          </button>
        )}
        <button
          onClick={handleDisconnect}
          className={buttonClass}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className={`${buttonClass} ${isConnecting ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
};

export default StandaloneWalletButton;