// src/components/providers/WebSocketProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import webSocketService, { WebSocketEvent, WebSocketEventHandler } from '@/services/WebSocketService';

// Define WebSocket context type
export type WebSocketContextType = {
  isConnected: boolean;
  clientId: string | null;
  events: WebSocketEvent[];
  lastMessage: string | null; // Add lastMessage property
  subscribe: (eventType: string, handler: WebSocketEventHandler) => void;
  unsubscribe: (eventType: string, handler: WebSocketEventHandler) => void;
  sendMessage: (message: string | object) => void;
  sendEvent: (eventType: string, data: any) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
};

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  clientId: null,
  events: [],
  lastMessage: null, // Add default value for lastMessage
  subscribe: () => {},
  unsubscribe: () => {},
  sendMessage: () => {},
  sendEvent: () => {},
  connect: async () => false,
  disconnect: () => {},
});

// Export hook for accessing WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);

// WebSocket Provider component props
type WebSocketProviderProps = {
  children: React.ReactNode;
  autoConnect?: boolean;
  notifyOnConnection?: boolean;
  maxEvents?: number;
};

/**
 * WebSocket Provider component that manages WebSocket connections and events
 */
export function WebSocketProvider({ 
  children, 
  autoConnect = true,
  notifyOnConnection = true,
  maxEvents = 50
}: WebSocketProviderProps) {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [lastMessage, setLastMessage] = useState<string | null>(null); // Add lastMessage state
  const [connectionAttempted, setConnectionAttempted] = useState(false);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    setConnectionAttempted(true);
    const connected = await webSocketService.connect();
    setIsConnected(connected);
    if (connected) {
      setClientId(webSocketService.getClientId());
      if (notifyOnConnection) {
        toast.success('Connected to WebSocket server');
      }
    } else if (notifyOnConnection) {
      toast.error('Failed to connect to WebSocket server');
    }
    return connected;
  }, [notifyOnConnection]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setIsConnected(false);
    setClientId(null);
    if (notifyOnConnection) {
      toast.info('Disconnected from WebSocket server');
    }
  }, [notifyOnConnection]);

  // Subscribe to WebSocket events
  const subscribe = useCallback((eventType: string, handler: WebSocketEventHandler) => {
    webSocketService.subscribe(eventType, handler);
  }, []);

  // Unsubscribe from WebSocket events
  const unsubscribe = useCallback((eventType: string, handler: WebSocketEventHandler) => {
    webSocketService.unsubscribe(eventType, handler);
  }, []);

  // Send a message to the WebSocket server
  const sendMessage = useCallback((message: string | object) => {
    webSocketService.sendMessage(message);
  }, []);

  // Send an event to the WebSocket server
  const sendEvent = useCallback((eventType: string, data: any) => {
    webSocketService.sendEvent(eventType, data);
  }, []);

  // Set up connection and event listeners on mount
  useEffect(() => {
    if (autoConnect && !connectionAttempted) {
      connect();
    }

    // Handler for all events
    const handleAllEvents = (event: WebSocketEvent) => {
      setEvents(prevEvents => {
        const newEvents = [event, ...prevEvents];
        // Limit number of events
        if (newEvents.length > maxEvents) {
          return newEvents.slice(0, maxEvents);
        }
        return newEvents;
      });
      
      // Update lastMessage when receiving a message event
      if (event.type === 'message') {
        const messageData = event.data;
        setLastMessage(typeof messageData === 'string' ? 
          messageData : 
          JSON.stringify(messageData)
        );
      }
    };

    // Handler for connection events
    const handleConnectionEvent = (event: WebSocketEvent) => {
      const { connected, clientId } = event.data || {};
      setIsConnected(connected === true);
      if (clientId) {
        setClientId(clientId);
      }
    };

    // Subscribe to events
    webSocketService.subscribe('all', handleAllEvents);
    webSocketService.subscribe('connection', handleConnectionEvent);

    // Clean up on unmount
    return () => {
      webSocketService.unsubscribe('all', handleAllEvents);
      webSocketService.unsubscribe('connection', handleConnectionEvent);
      
      // Only disconnect if autoConnect is true (we initiated the connection)
      if (autoConnect) {
        webSocketService.disconnect();
      }
    };
  }, [autoConnect, connectionAttempted, connect, maxEvents]);

  // Context value
  const contextValue: WebSocketContextType = {
    isConnected,
    clientId,
    events,
    lastMessage, // Add lastMessage to the context value
    subscribe,
    unsubscribe,
    sendMessage,
    sendEvent,
    connect,
    disconnect,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}