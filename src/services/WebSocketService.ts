import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from './ApiClient';

// Define WebSocket event interface
export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp?: string;
  source?: string;
}

// Define WebSocketEventHandler type
export type WebSocketEventHandler = (event: WebSocketEvent) => void;

// WebSocket service singleton class
class WebSocketService {
  private socket: Socket | null = null;
  private clientId: string | null = null;
  private subscribers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private connectionPromise: Promise<boolean> | null = null;
  private wsUrl: string = API_CONFIG.BASE_URL || 'http://localhost:3222';
  
  // Get WebSocket URL based on current configuration
  private getWebSocketUrl(): string {
    // Check if we should use secure WebSocket based on HTTPS
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const url = this.wsUrl;
    
    // Return the URL, ensuring it doesn't have http/https protocol
    // Socket.io will automatically use the appropriate ws:// or wss:// protocol
    return url.replace(/^https?:\/\//, '');
  }
  
  // Connect to WebSocket server
  public async connect(): Promise<boolean> {
    // If already connected, return true
    if (this.socket?.connected) {
      return true;
    }
    
    // If connection is in progress, return the promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    // Create new connection promise
    this.connectionPromise = new Promise<boolean>((resolve) => {
      try {
        console.log(`Connecting to WebSocket at ${this.wsUrl}`);
        
        // Create new socket connection
        this.socket = io(this.wsUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          timeout: 10000,
          forceNew: true
        });
        
        // Handle connection event
        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.clientId = this.socket?.id || null;
          
          // Trigger connection event
          this.triggerEvent({
            type: 'connection',
            data: {
              connected: true,
              clientId: this.clientId
            }
          });
          
          resolve(true);
        });
        
        // Handle disconnect event
        this.socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
          
          // Trigger connection event
          this.triggerEvent({
            type: 'connection',
            data: {
              connected: false,
              clientId: this.clientId
            }
          });
        });
        
        // Handle connection error
        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          resolve(false);
        });
        
        // Handle general error
        this.socket.on('error', (error) => {
          console.error('WebSocket error:', error);
        });
        
        // Handle incoming events
        this.socket.on('event', (event: WebSocketEvent) => {
          this.handleEvent(event);
        });
        
        // Handle incoming messages (string or object)
        this.socket.on('message', (message: string | object) => {
          const data = typeof message === 'string' ? message : message;
          
          // Convert to WebSocketEvent format
          const event: WebSocketEvent = {
            type: 'message',
            data,
            timestamp: new Date().toISOString()
          };
          
          this.handleEvent(event);
        });
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        resolve(false);
      }
    });
    
    // Reset connection promise after resolution
    const result = await this.connectionPromise;
    this.connectionPromise = null;
    return result;
  }
  
  // Disconnect from WebSocket server
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.clientId = null;
    }
  }
  
  // Get client ID
  public getClientId(): string | null {
    return this.clientId;
  }
  
  // Subscribe to WebSocket events
  public subscribe(eventType: string, handler: WebSocketEventHandler): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType)?.add(handler);
  }
  
  // Unsubscribe from WebSocket events
  public unsubscribe(eventType: string, handler: WebSocketEventHandler): void {
    const handlers = this.subscribers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscribers.delete(eventType);
      }
    }
  }
  
  // Send a message to the WebSocket server
  public sendMessage(message: string | object): void {
    if (!this.socket?.connected) {
      console.warn('Cannot send message - WebSocket not connected');
      return;
    }
    
    this.socket.emit('message', message);
  }
  
  // Send an event to the WebSocket server
  public sendEvent(eventType: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('Cannot send event - WebSocket not connected');
      return;
    }
    
    const event: WebSocketEvent = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.socket.emit('event', event);
  }
  
  // Handle incoming event
  private handleEvent(event: WebSocketEvent): void {
    // Add timestamp if not present
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString();
    }
    
    // Trigger 'all' type first (for generic subscribers)
    this.triggerEvent({
      ...event,
      source: 'server'
    });
  }
  
  // Trigger event to subscribers
  private triggerEvent(event: WebSocketEvent): void {
    // Call handlers for the specific event type
    const typeHandlers = this.subscribers.get(event.type);
    if (typeHandlers) {
      typeHandlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event.type}:`, error);
        }
      });
    }
    
    // Call handlers for the 'all' event type
    const allHandlers = this.subscribers.get('all');
    if (allHandlers) {
      allHandlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in WebSocket all-event handler for ${event.type}:`, error);
        }
      });
    }
  }
}

// Export a singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
