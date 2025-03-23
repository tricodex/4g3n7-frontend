// src/services/WebSocketService.ts
'use client';

import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from './ApiClient';

export type WebSocketEvent = {
  type: string;
  data: any;
  timestamp?: string;
};

export type WebSocketEventHandler = (event: WebSocketEvent) => void;

/**
 * WebSocket service for real-time communication with the backend
 */
class WebSocketService {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Set<WebSocketEventHandler>> = new Map();
  private connected: boolean = false;
  private serverUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private topics: Set<string> = new Set(); // Track subscribed topics

  constructor() {
    // Use the same base URL as API client by default
    this.serverUrl = API_CONFIG.BASE_URL || 'http://localhost:3222';
  }

  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves to true if connected successfully
   */
  public async connect(): Promise<boolean> {
    if (this.socket && this.connected) {
      console.log('[WebSocketService] Already connected');
      return true;
    }

    try {
      console.log(`[WebSocketService] Connecting to ${this.serverUrl}...`);

      // Try to get WebSocket configuration from API
      try {
        const response = await fetch(`/api/websocket?backend=${encodeURIComponent(this.serverUrl)}`);
        const config = await response.json();
        
        if (config && config.socketUrl) {
          this.serverUrl = config.socketUrl;
          console.log(`[WebSocketService] Using WebSocket URL from API: ${this.serverUrl}`);
        }
      } catch (error) {
        console.warn('[WebSocketService] Failed to get WebSocket config from API, using default', error);
      }

      // Create new Socket.IO instance
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'], // Try WebSocket first, fall back to polling
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
        path: '/socket.io', // Default Socket.IO path
      });

      return new Promise((resolve) => {
        if (!this.socket) {
          resolve(false);
          return;
        }

        // Set up event handlers
        this.socket.on('connect', () => {
          console.log(`[WebSocketService] Connected (ID: ${this.socket?.id})`);
          this.connected = true;
          this.reconnectAttempts = 0;
          
          // Re-subscribe to topics
          this.resubscribeToTopics();
          
          // Notify listeners
          this.notifyEventListeners('connection', {
            type: 'connection',
            data: { connected: true, clientId: this.socket?.id }
          });
          
          resolve(true);
        });

        this.socket.on('disconnect', (reason) => {
          console.log(`[WebSocketService] Disconnected: ${reason}`);
          this.connected = false;
          
          // Notify listeners
          this.notifyEventListeners('connection', {
            type: 'connection',
            data: { connected: false, reason }
          });
        });

        this.socket.on('connect_error', (error) => {
          console.error('[WebSocketService] Connection error:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`[WebSocketService] Max reconnect attempts (${this.maxReconnectAttempts}) reached`);
            if (this.socket) {
              this.socket.disconnect();
              this.socket = null;
            }
            resolve(false);
          }
        });

        // Set up default event handlers
        this.setupDefaultEventHandlers();
      });
    } catch (error) {
      console.error('[WebSocketService] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Set the WebSocket server URL
   * @param url Server URL
   */
  public setServerUrl(url: string): void {
    if (this.serverUrl !== url) {
      this.serverUrl = url;
      
      // Reconnect if already connected
      if (this.connected) {
        this.disconnect();
        this.connect();
      }
    }
  }

  /**
   * Set up default event handlers for common events
   */
  private setupDefaultEventHandlers(): void {
    if (!this.socket) return;

    // System messages
    this.socket.on('system', (data) => {
      this.notifyEventListeners('system', {
        type: 'system',
        data,
        timestamp: data.timestamp || new Date().toISOString()
      });
    });

    // Client connected/disconnected events
    this.socket.on('client_connected', (data) => {
      this.notifyEventListeners('client_connected', {
        type: 'client_connected',
        data,
        timestamp: data.timestamp || new Date().toISOString()
      });
    });

    this.socket.on('client_disconnected', (data) => {
      this.notifyEventListeners('client_disconnected', {
        type: 'client_disconnected',
        data,
        timestamp: data.timestamp || new Date().toISOString()
      });
    });

    // Trade events
    this.socket.on('trade_executed', (data) => {
      this.notifyEventListeners('trade_executed', {
        type: 'trade_executed',
        data,
        timestamp: data.timestamp || new Date().toISOString()
      });
      // Also notify 'all' listeners
      this.notifyEventListeners('all', {
        type: 'trade_executed',
        data,
        timestamp: data.timestamp || new Date().toISOString()
      });
    });

    // Agent status events
    this.socket.on('agent_status', (data) => {
      this.notifyEventListeners('agent_status', {
        type: 'agent_status',
        data,
        timestamp: data.timestamp || new Date().toISOString()
      });
      // Also notify 'all' listeners
      this.notifyEventListeners('all', {
        type: 'agent_status',
        data,
        timestamp: data.timestamp || new Date().toISOString()
      });
    });

    // Memory events
    this.socket.on('memory_updated', (data) => {
      this.notifyEventListeners('memory_updated', {
        type: 'memory_updated',
        data,
        timestamp: data.timestamp || new Date().toISOString()
      });
      // Also notify 'all' listeners
      this.notifyEventListeners('all', {
        type: 'memory_updated',
        data,
        timestamp: data.timestamp || new Date().toISOString()
      });
    });

    // Generic message event
    this.socket.on('message', (data) => {
      this.notifyEventListeners('message', {
        type: 'message',
        data,
        timestamp: new Date().toISOString()
      });
      // Also notify 'all' listeners
      this.notifyEventListeners('all', {
        type: 'message',
        data,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Resubscribe to all topics after reconnection
   */
  private resubscribeToTopics(): void {
    if (!this.socket || !this.connected) return;
    
    // Resubscribe to all topics
    this.topics.forEach(topic => {
      console.log(`[WebSocketService] Resubscribing to topic: ${topic}`);
      this.socket?.emit('subscribe', { topic });
    });
  }

  /**
   * Send an event to the server
   * @param eventType Event type
   * @param data Event data
   */
  public sendEvent(eventType: string, data: any): void {
    if (!this.socket || !this.connected) {
      console.warn(`[WebSocketService] Cannot send event, not connected: ${eventType}`);
      return;
    }

    console.log(`[WebSocketService] Sending event: ${eventType}`, data);
    this.socket.emit(eventType, data);
  }

  /**
   * Send a message to the server
   * @param message Message to send
   */
  public sendMessage(message: string | object): void {
    if (!this.socket || !this.connected) {
      console.warn('[WebSocketService] Cannot send message, not connected');
      return;
    }

    console.log('[WebSocketService] Sending message', message);
    this.socket.emit('message', message);
  }

  /**
   * Subscribe to events of a specific type
   * @param eventType Event type to subscribe to
   * @param handler Event handler function
   */
  public subscribe(eventType: string, handler: WebSocketEventHandler): void {
    // Create set of handlers for this event type if it doesn't exist
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    // Add handler to the set
    const handlers = this.eventListeners.get(eventType);
    handlers?.add(handler);

    // If it's a custom topic (not a built-in event), subscribe on the server
    if (!['system', 'connection', 'client_connected', 'client_disconnected', 'all', 'message'].includes(eventType)) {
      if (this.socket && this.connected) {
        console.log(`[WebSocketService] Subscribing to topic: ${eventType}`);
        this.socket.emit('subscribe', { topic: eventType });
        // Track the subscription
        this.topics.add(eventType);
      }
    }
  }

  /**
   * Unsubscribe from events of a specific type
   * @param eventType Event type to unsubscribe from
   * @param handler Event handler to remove
   */
  public unsubscribe(eventType: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventListeners.get(eventType);
    if (handlers) {
      // Remove handler from the set
      handlers.delete(handler);

      // If there are no more handlers for this event type and it's a custom topic,
      // unsubscribe on the server
      if (handlers.size === 0 && 
          !['system', 'connection', 'client_connected', 'client_disconnected', 'all', 'message'].includes(eventType)) {
        if (this.socket && this.connected) {
          console.log(`[WebSocketService] Unsubscribing from topic: ${eventType}`);
          this.socket.emit('unsubscribe', { topic: eventType });
          // Remove from tracked topics
          this.topics.delete(eventType);
        }

        // Remove the event type from the map
        this.eventListeners.delete(eventType);
      }
    }
  }

  /**
   * Notify all registered event handlers for an event type
   * @param eventType Event type
   * @param event Event data
   */
  private notifyEventListeners(eventType: string, event: WebSocketEvent): void {
    // Get handlers for this event type
    const handlers = this.eventListeners.get(eventType);
    if (handlers) {
      // Call each handler with the event
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`[WebSocketService] Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (!this.socket) return;

    console.log('[WebSocketService] Disconnecting');
    this.socket.disconnect();
    this.socket = null;
    this.connected = false;
    
    // Clear all topics
    this.topics.clear();
  }

  /**
   * Check if the WebSocket is connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get the client ID if connected
   */
  public getClientId(): string | null {
    return this.socket?.id || null;
  }
}

// Singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;