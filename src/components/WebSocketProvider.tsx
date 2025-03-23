'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../services/ApiClient'; // Import the API config

// Define the WebSocket context type
export type WebSocketContextType = {
  isConnected: boolean;
  lastMessage: string | null;
  sendMessage: (message: string) => void;
  setSocketUrl: (url: string) => void;
};

// Create the context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {},
  setSocketUrl: () => {},
});

// WebSocket Provider component
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [socketUrl, setSocketUrl] = useState(API_CONFIG.BASE_URL || 'http://localhost:3222');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxReconnectAttempts = 3;

  // Function to establish WebSocket connection
  useEffect(() => {
    // Clean up previous socket if it exists
    if (socket) {
      socket.disconnect();
    }

    try {
      console.log(`Attempting to connect to WebSocket at ${socketUrl} (Attempt ${connectionAttempts + 1}/${maxReconnectAttempts})`);
      
      // Create new socket connection with more robust options
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000, // Longer timeout for initial connection
        forceNew: true
      });

      // Socket event handlers
      newSocket.on('connect', () => {
        console.log(`WebSocket connected to ${socketUrl}`);
        setIsConnected(true);
        setConnectionAttempts(0); // Reset attempts on successful connection
      });

      newSocket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
        
        // Only increment counter for connection errors (not other errors)
        if (connectionAttempts < maxReconnectAttempts) {
          setConnectionAttempts(prev => prev + 1);
        } else {
          console.warn(`Max reconnection attempts (${maxReconnectAttempts}) reached. Switching to mock mode.`);
          // At this point, we would activate a mock/fallback mode instead of real WebSocket
        }
      });

      newSocket.on('error', (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      });

      newSocket.on('message', (data) => {
        console.log('WebSocket message received:', data);
        setLastMessage(typeof data === 'string' ? data : JSON.stringify(data));
        
        // Special handling for speech-related messages
        if (data === 'speak' || data === 'speechstart') {
          // Directly trigger avatar animation for more reliable operation
          if (typeof window !== 'undefined' && 'debugAnimateMouth' in window) {
            // @ts-ignore
            window.debugAnimateMouth(true);
            console.log('WebSocket received speak command, directly animating mouth');
          }
        } else if (data === 'stop' || data === 'speechend') {
          // Directly trigger avatar animation stop
          if (typeof window !== 'undefined' && 'debugAnimateMouth' in window) {
            // @ts-ignore
            window.debugAnimateMouth(false);
            console.log('WebSocket received stop command, directly stopping mouth animation');
          }
        }
      });

      // Store socket in state
      setSocket(newSocket);

      // Clean up function
      return () => {
        newSocket.disconnect();
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnected(false);
      
      if (connectionAttempts < maxReconnectAttempts) {
        setConnectionAttempts(prev => prev + 1);
      }
    }
  }, [socketUrl, connectionAttempts]);

  // Function to send a message
  const sendMessage = (message: string) => {
    if (socket && isConnected) {
      socket.emit('message', message);
    } else {
      console.error('Cannot send message - WebSocket not connected');
    }
  };

  // Context provider value
  const contextValue: WebSocketContextType = {
    isConnected,
    lastMessage,
    sendMessage,
    setSocketUrl,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Custom hook to use the WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);