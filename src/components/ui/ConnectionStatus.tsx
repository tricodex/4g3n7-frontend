'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/components/WebSocketProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CircleOff,
  CircleCheck,
  ServerCrash,
  Server,
  Fingerprint,
  RefreshCw,
  Loader2
} from 'lucide-react';

type ConnectionStatusProps = {
  showTooltip?: boolean;
  showAttestationStatus?: boolean;
};

export function ConnectionStatus({ 
  showTooltip = true,
  showAttestationStatus = true
}: ConnectionStatusProps) {
  const { isConnected, sendMessage } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<{
    connected: boolean;
    attestation?: { 
      type: string;
      message: string;
    };
  }>({
    connected: false
  });

  // Fetch status from backend
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const data = await response.json();
        setBackendStatus({
          connected: data.backend.connected,
          attestation: data.attestation
        });
      } else {
        setBackendStatus({ connected: false });
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      setBackendStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
    
    // Set up interval to fetch status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchStatus();
    
    // Try to ping the WebSocket server
    if (isConnected) {
      sendMessage({ type: 'ping', timestamp: new Date().toISOString() });
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Backend Status */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              {backendStatus.connected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 py-1 flex items-center gap-1">
                  <Server className="h-3 w-3" />
                  <span>Backend</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 py-1 flex items-center gap-1">
                  <ServerCrash className="h-3 w-3" />
                  <span>Backend</span>
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          {showTooltip && (
            <TooltipContent>
              {backendStatus.connected ? 
                'Backend is connected and healthy' : 
                'Backend is disconnected or unreachable'}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      
      {/* WebSocket Status */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              {isConnected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 py-1 flex items-center gap-1">
                  <CircleCheck className="h-3 w-3" />
                  <span>WebSocket</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 py-1 flex items-center gap-1">
                  <CircleOff className="h-3 w-3" />
                  <span>WebSocket</span>
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          {showTooltip && (
            <TooltipContent>
              {isConnected ? 
                'WebSocket is connected and receiving real-time updates' : 
                'WebSocket is disconnected - real-time updates unavailable'}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      
      {/* Attestation Status */}
      {showAttestationStatus && backendStatus.attestation && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 py-1 flex items-center gap-1">
                  <Fingerprint className="h-3 w-3" />
                  <span>TEE</span>
                </Badge>
              </div>
            </TooltipTrigger>
            {showTooltip && (
              <TooltipContent>
                <div className="max-w-xs">
                  <p className="font-semibold">Attestation Type: {backendStatus.attestation.type}</p>
                  <p className="text-xs mt-1">{backendStatus.attestation.message}</p>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Refresh Button */}
      <Button 
        variant="outline" 
        size="sm"
        className="h-7 w-7 p-0"
        onClick={handleRefresh}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
        <span className="sr-only">Refresh connection status</span>
      </Button>
    </div>
  );
}
