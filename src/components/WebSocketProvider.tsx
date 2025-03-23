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

  // Function to establish WebSocket connection
  useEffect(() => {
    // Clean up previous socket if it exists
    if (socket) {
      socket.disconnect();
    }

    try {
      // Create new socket connection
      const newSocket = io(socketUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      // Socket event handlers
      newSocket.on('connect', () => {
        console.log(`WebSocket connected to ${socketUrl}`);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      });

      newSocket.on('message', (data) => {
        console.log('WebSocket message received:', data);
        setLastMessage(typeof data === 'string' ? data : JSON.stringify(data));
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
    }
  }, [socketUrl]);

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