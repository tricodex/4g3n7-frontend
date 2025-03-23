// src/components/ui/WebSocketStatus.tsx
'use client';

import React from 'react';
import { Badge } from './badge';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { Button } from './button';

type WebSocketStatusProps = {
  showReconnect?: boolean;
  compact?: boolean;
  className?: string;
};

export function WebSocketStatus({ 
  showReconnect = true, 
  compact = false,
  className = ''
}: WebSocketStatusProps) {
  const { isConnected, clientId, connect } = useWebSocket();
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={isConnected ? 'outline' : 'destructive'}
              className={`
                flex items-center gap-1 
                ${isConnected 
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}
                ${compact ? 'px-2 py-0' : 'px-3 py-1'}
              `}
            >
              {isConnected ? (
                <>
                  <Wifi className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-green-500`} />
                  {!compact && <span>Connected</span>}
                </>
              ) : (
                <>
                  <WifiOff className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-red-500`} />
                  {!compact && <span>Offline</span>}
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isConnected 
                ? `WebSocket connected (ID: ${clientId?.substring(0, 6)}...)` 
                : 'WebSocket disconnected'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {!isConnected && showReconnect && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="px-2 h-7 text-xs"
          onClick={() => connect()}
        >
          Reconnect
        </Button>
      )}
    </div>
  );
}