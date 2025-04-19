import React, { createContext, useState, useEffect, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  address: string;
  points: number;
  badges: string[];
  lastClaim: string | null;
  swapCount: number;
  claimCount: number;
  createdAt: string;
}

interface UserContextType {
  user: User | null;
  isConnecting: boolean;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  isConnecting: false,
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  
  // Check for stored address in localStorage on mount
  useEffect(() => {
    const checkStoredWallet = async () => {
      const storedAddress = localStorage.getItem('walletAddress');
      if (storedAddress) {
        setIsConnecting(true);
        try {
          // Fetch user data
          const userData = await apiRequest(`/api/users/${storedAddress}`);
          if (userData) {
            setUser(userData);
            setIsConnected(true);
            console.log('Reconnected wallet from localStorage:', storedAddress);
          }
        } catch (error) {
          console.error('Error reconnecting stored wallet:', error);
          localStorage.removeItem('walletAddress');
        }
        setIsConnecting(false);
      }
    };
    
    checkStoredWallet();
  }, []);
  
  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask to use this feature');
        setIsConnecting(false);
        return;
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      
      // Store address in localStorage
      localStorage.setItem('walletAddress', address);
      
      // Create or fetch user
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect wallet');
      }
      
      const userData = await response.json();
      setUser(userData);
      setIsConnected(true);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
      
      console.log('Connected wallet:', address);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
      localStorage.removeItem('walletAddress');
    }
    
    setIsConnecting(false);
  };
  
  const disconnectWallet = () => {
    setUser(null);
    setIsConnected(false);
    localStorage.removeItem('walletAddress');
    console.log('Disconnected wallet');
  };
  
  return (
    <UserContext.Provider
      value={{
        user,
        isConnecting,
        isConnected,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);