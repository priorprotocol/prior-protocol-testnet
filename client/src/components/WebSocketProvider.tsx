import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

// Define the notification types that match the server's types
interface PointsNotification {
  type: 'points_update';
  userId: number;
  address: string;
  pointsBefore: number;
  pointsAfter: number;
  timestamp: string;
}

interface LeaderboardNotification {
  type: 'leaderboard_update';
  totalGlobalPoints: number;
  userCount: number;
  timestamp: string;
}

type WebSocketMessage = PointsNotification | LeaderboardNotification | {
  type: 'connection_established';
  message: string;
  timestamp: string;
};

// Context for WebSocket state
interface WebSocketContextType {
  connected: boolean;
  lastMessage: WebSocketMessage | null;
  totalGlobalPoints: number;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  lastMessage: null,
  totalGlobalPoints: 0,
  reconnect: () => {}
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [totalGlobalPoints, setTotalGlobalPoints] = useState<number>(0);
  const { toast } = useToast();

  // Function to establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    // Close existing connection if any
    if (socket) {
      socket.close();
    }

    // Set up WebSocket connection with correct protocol based on current URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log('WebSocket connection established');
      setConnected(true);
    };
    
    newSocket.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        connectWebSocket();
      }, 5000);
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };
    
    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log('WebSocket message received:', message);
        setLastMessage(message);
        
        // Handle different types of messages
        switch (message.type) {
          case 'points_update':
            // Invalidate queries related to the user's points
            queryClient.invalidateQueries({ queryKey: [`/api/users/${message.address}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/users/${message.address}/transactions`] });
            queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
            
            // Show a toast notification for the user
            toast({
              title: "Points Updated",
              description: `Your points have been recalculated: ${message.pointsBefore} → ${message.pointsAfter}`,
              duration: 5000,
            });
            break;
            
          case 'leaderboard_update':
            // Update global points state
            setTotalGlobalPoints(message.totalGlobalPoints);
            
            // Invalidate leaderboard query to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
            break;
            
          case 'connection_established':
            console.log('WebSocket connection confirmed by server');
            break;
            
          default:
            console.log('Unknown message type received:', message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    setSocket(newSocket);
    
    // Clean up function
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [toast]);
  
  // Initial connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [connectWebSocket]);
  
  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('Manually reconnecting WebSocket...');
    connectWebSocket();
  }, [connectWebSocket]);

  return (
    <WebSocketContext.Provider value={{ 
      connected, 
      lastMessage, 
      totalGlobalPoints,
      reconnect
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};