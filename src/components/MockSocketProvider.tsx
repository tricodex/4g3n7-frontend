'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAvatarStore } from '@/lib/avatarStore';
import type { WebSocketEvent } from '@/services/WebSocketService'; // Import the type

// Mock WebSocket provider for fallback when real WebSockets fail

// Define the WebSocket context type - same as in WebSocketProvider
export type MockSocketContextType = {
  isConnected: boolean;
  lastMessage: string | null;
  sendMessage: (message: string) => void;
  setSocketUrl: (url: string) => void;
};

// Create the context with default values
const MockSocketContext = createContext<MockSocketContextType>({
  isConnected: true, // Always "connected" in mock mode
  lastMessage: null,
  sendMessage: () => {},
  setSocketUrl: () => {},
});

// Mock WebSocket Provider component
export function MockSocketProvider({ children }: { children: ReactNode }) {
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const { setIsSpeaking } = useAvatarStore();
  
  // Function to send a mock message
  const sendMessage = (message: string) => {
    console.log('MockSocket: Message sent:', message);
    setLastMessage(message);
    
    // Special handling for speech commands
    if (message === 'speak' || message === 'speechstart') {
      setIsSpeaking(true);
      // Direct animation
      if (typeof window !== 'undefined' && 'debugAnimateMouth' in window) {
        // @ts-ignore
        window.debugAnimateMouth(true);
      }
    } else if (message === 'stop' || message === 'speechend') {
      setIsSpeaking(false);
      // Direct animation
      if (typeof window !== 'undefined' && 'debugAnimateMouth' in window) {
        // @ts-ignore
        window.debugAnimateMouth(false);
      }
    }
  };

  // Context provider value
  const contextValue: MockSocketContextType = {
    isConnected: true, // Always connected in mock mode
    lastMessage,
    sendMessage,
    setSocketUrl: (url) => console.log('MockSocket: URL set to', url),
  };

  // Set up a demo script to simulate interactions
  useEffect(() => {
    // Show the user this is a mock provider
    console.log('MockSocketProvider initialized - WebSocket fallback mode active');
    
    // Automatically animate the mouth every 5 seconds
    const interval = setInterval(() => {
      // Toggle speaking state
      const isSpeaking = useAvatarStore.getState().isSpeaking;
      setIsSpeaking(!isSpeaking);
      
      // Direct animation
      if (typeof window !== 'undefined' && 'debugAnimateMouth' in window) {
        // @ts-ignore
        window.debugAnimateMouth(!isSpeaking);
      }
      
      console.log('MockSocket: Auto-toggling speaking state:', !isSpeaking);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <MockSocketContext.Provider value={contextValue}>
      {children}
    </MockSocketContext.Provider>
  );
}

// Custom hook to use the mock WebSocket context
export const useMockSocket = () => useContext(MockSocketContext);
