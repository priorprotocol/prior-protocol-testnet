import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  
  // Track connection failures to implement fallback polling if needed
  const connectionFailures = useRef<number>(0);
  const pollingInterval = useRef<number | null>(null);
  
  // Function to start polling as a fallback when WebSockets aren't working
  const startPollingFallback = useCallback(() => {
    console.log('Starting polling fallback mechanism');
    
    // Clear any existing polling interval
    if (pollingInterval.current) {
      window.clearInterval(pollingInterval.current);
    }
    
    // Show a notification to the user
    toast({
      title: "Switched to periodic updates",
      description: "Live updates unavailable. Data will refresh every 10 seconds.",
      duration: 5000,
    });
    
    // Set up polling for leaderboard data
    pollingInterval.current = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('Polling for leaderboard data...');
        queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
      }
    }, 10000); // Poll every 10 seconds
  }, [toast]);

  // Function to establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    // Close existing connection if any
    if (socket) {
      socket.close();
    }

    // Set up WebSocket connection with protocol detection for Replit environment
    // Replit requires specific WebSocket URL handling
    
    // Get the current hostname and determine if we're in Replit environment
    const isReplit = window.location.hostname.includes('replit') || 
                     window.location.hostname.includes('janeway');
    
    let wsUrl;
    if (isReplit) {
      // Use the current window location to determine the WebSocket URL
      // This is important for Replit's proxy environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws`;
    } else {
      // For local development, use relative path
      wsUrl = '/ws';
    }
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    
    try {
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = () => {
        console.log('WebSocket connection established');
        setConnected(true);
        // Reset connection failures counter
        connectionFailures.current = 0;
        
        // Reset reconnection attempts when successfully connected
        toast({
          title: "Real-time updates active",
          description: "Connected to Prior Protocol's live update system",
          duration: 3000,
        });
      };
      
      newSocket.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        setConnected(false);
        
        // Increment connection failures counter for fallback mechanism
        connectionFailures.current += 1;
        
        // If we've failed too many times, switch to polling fallback
        if (connectionFailures.current >= 5) {
          console.log(`WebSocket connection failed ${connectionFailures.current} times. Switching to polling fallback.`);
          startPollingFallback();
          return;
        }
        
        // Only attempt to reconnect if not closed cleanly
        if (event.code !== 1000) {
          // Special handling for specific Replit error cases
          if (event.code === 1006) {
            console.log('Connection closed abnormally (1006) - common in Replit environment');
            // Use a shorter timeout for Replit-specific errors
            setTimeout(() => {
              if (document.visibilityState === 'visible') {
                console.log('Attempting to reconnect after Replit-specific error...');
                connectWebSocket();
              }
            }, 3000);
            
            return;
          }
          
          // Standard backoff for other errors  
          const backoffDelay = Math.min(5000 + Math.random() * 5000, 30000);
          console.log(`Will attempt to reconnect WebSocket in ${Math.round(backoffDelay/1000)}s...`);
          
          setTimeout(() => {
            if (document.visibilityState === 'visible') {
              console.log('Attempting to reconnect WebSocket...');
              connectWebSocket();
            } else {
              console.log('Page not visible, delaying reconnection until visible');
              // Set up a listener to reconnect when page becomes visible again
              const visibilityHandler = () => {
                if (document.visibilityState === 'visible') {
                  console.log('Page now visible, attempting reconnection');
                  connectWebSocket();
                  document.removeEventListener('visibilitychange', visibilityHandler);
                }
              };
              document.addEventListener('visibilitychange', visibilityHandler);
            }
          }, backoffDelay);
        }
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
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
      setConnected(false);
      
      // Increment connection failures counter
      connectionFailures.current += 1;
      
      // Try to reconnect after a delay if there was an error
      setTimeout(() => {
        console.log('Attempting to reconnect after connection error...');
        connectWebSocket();
      }, 5000);
    }
    
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [toast, socket, startPollingFallback]);
  
  // Initial connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [connectWebSocket, socket]);
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        window.clearInterval(pollingInterval.current);
      }
    };
  }, []);
  
  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('Manually reconnecting WebSocket...');
    // Reset failure counter when manually reconnecting
    connectionFailures.current = 0;
    
    // Clear polling if it was active
    if (pollingInterval.current) {
      window.clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    
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