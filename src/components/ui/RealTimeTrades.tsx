// src/components/ui/RealtimeTrades.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useWebSocket } from '@/providers/WebSocketProvider';
import type { WebSocketEvent } from '@/services/WebSocketService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, AlertTriangle, RotateCw } from 'lucide-react';

// Define Trade type
type Trade = {
  id: string;
  type: string;
  fromAsset: string;
  toAsset: string;
  amount: number;
  status: string;
  timestamp: string;
  hash?: string;
};

/**
 * RealtimeTrades Component
 * 
 * Displays real-time trades received via WebSocket
 */
export function RealtimeTrades({ 
  maxTrades = 10,
  showHeader = true
}: { 
  maxTrades?: number;
  showHeader?: boolean;
}) {
  const { subscribe, unsubscribe, isConnected } = useWebSocket();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [animate, setAnimate] = useState<string | null>(null);

  // Subscribe to trade events
  useEffect(() => {
    // Handle trade event
    const handleTradeEvent = (event: WebSocketEvent) => {
      if (event.type === 'trade_executed' && event.data) {
        // Add new trade to the list
        setTrades(prev => {
          const newTrade = {
            id: event.data.id || `trade-${Date.now()}`,
            type: event.data.type || 'unknown',
            fromAsset: event.data.fromAsset || event.data.from || '',
            toAsset: event.data.toAsset || event.data.to || '',
            amount: event.data.amount || 0,
            status: event.data.status || 'completed',
            timestamp: event.data.timestamp || new Date().toISOString(),
            hash: event.data.hash || undefined
          };
          
          // Check for duplicate trade
          if (prev.some(t => t.id === newTrade.id)) {
            return prev;
          }
          
          // Set animate to highlight new trade
          setAnimate(newTrade.id);
          setTimeout(() => setAnimate(null), 3000);
          
          // Add new trade and limit to maxTrades
          return [newTrade, ...prev].slice(0, maxTrades);
        });
      }
    };

    // Subscribe to trade events
    subscribe('trade_executed', handleTradeEvent);

    // Clean up on unmount
    return () => {
      unsubscribe('trade_executed', handleTradeEvent);
    };
  }, [subscribe, unsubscribe, maxTrades]);
  
  // Get status color for badge
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return timestamp;
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      {showHeader && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Recent Trades</span>
            {!isConnected && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>Offline</span>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="px-2 py-1 flex-grow">
        {trades.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground space-y-2">
            <RotateCw className="h-8 w-8 opacity-50" />
            <p className="text-sm">Waiting for trades</p>
            {!isConnected && (
              <p className="text-xs">WebSocket disconnected, reconnect to see trades</p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[calc(100%-1rem)] pr-2">
            <div className="space-y-2 py-1">
              {trades.map((trade) => (
                <div 
                  key={trade.id} 
                  className={`p-2 border rounded-md transition-all ${
                    animate === trade.id 
                      ? 'animate-pulse border-blue-300 bg-blue-50' 
                      : 'bg-card'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2">
                        {trade.type}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(trade.status)}>
                        {trade.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(trade.timestamp)}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-1 text-sm">
                    <span>{trade.amount} {trade.fromAsset}</span>
                    <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground" />
                    <span>{trade.toAsset}</span>
                  </div>
                  
                  {trade.hash && (
                    <div className="mt-1">
                      <a 
                        href={`https://basescan.org/tx/${trade.hash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline truncate block"
                      >
                        {trade.hash.slice(0, 8)}...{trade.hash.slice(-6)}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}