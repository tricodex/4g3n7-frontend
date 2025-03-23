'use client';

import React, { useState, useEffect } from 'react';

// Import Shadcn UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";

// Import our components
import { AgentTerminals } from './AgentTerminals';
import { RecallMemoryViewer } from './RecallMemoryViewer';
import AttestationTerminal from './AttestationTerminal';
import { WebSocketProvider, useWebSocket } from './WebSocketProvider';
import apiClient from '../services/ApiClient';
import MarlinConnectConfig from './MarlinConnectConfig';

export function DashboardLayout() {
  const [agentStatus, setAgentStatus] = useState<{
    status: string;
    type: string;
    walletAddress?: string;
  } | null>(null);
  
  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    version: string;
  } | null>(null);
  
  const [isApiError, setIsApiError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Access WebSocket context
  const { isConnected } = useWebSocket();
  
  // Fetch initial data on component mount
  useEffect(() => {
    fetchAgentStatus();
    fetchHealthStatus();
    
    // Set up polling for status updates every 30 seconds
    const statusInterval = setInterval(() => {
      fetchAgentStatus();
      fetchHealthStatus();
    }, 30000);
    
    return () => clearInterval(statusInterval);
  }, []);
  
  // Fetch agent status
  const fetchAgentStatus = async () => {
    try {
      const response = await apiClient.getAgentStatus();
      setAgentStatus(response);
      setIsApiError(false);
    } catch (error) {
      console.error('Error fetching agent status:', error);
      setIsApiError(true);
      
      // Only show toast on first error
      if (!isApiError) {
        toast.error('Failed to connect to Auto Trader API. Check backend server status.');
      }
    }
  };
  
  // Fetch health status
  const fetchHealthStatus = async () => {
    try {
      const response = await apiClient.getHealth();
      setHealthStatus(response);
      setIsApiError(false);
    } catch (error) {
      console.error('Error fetching health status:', error);
      setIsApiError(true);
    }
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'operational':
      case 'connected':
        return "bg-green-500";
      case 'degraded':
      case 'partial':
        return "bg-yellow-500";
      case 'maintenance':
        return "bg-blue-500";
      case 'unavailable':
      case 'disconnected':
      case 'error':
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  
  // Get agent type display
  const getAgentTypeDisplay = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'standard':
        return 'Standard Trading Agent';
      case 'agentkit':
        return 'AgentKit Trading Agent';
      case 'coordinated':
        return 'Coordinated Trading Agents';
      default:
        return type || 'Unknown';
    }
  };
  
  return (
    <div className="p-4">
      {/* Header with status indicators */}
      <div 
        className="flex justify-between items-center mb-6 pb-3 border-b"
      >
        <div>
          <h1 className="text-2xl font-bold">4g3n7 Auto Trader</h1>
          <p className="text-gray-500">Coordinated AI Trading Agents with Transparent Memory</p>
        </div>
        
        <div className="flex gap-4">
          {/* API Status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={isApiError ? "destructive" : "default"} className="p-2">
                  API: {isApiError ? 'Unavailable' : 'Connected'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {isApiError ? 'API Unavailable' : 'API Connected'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* WebSocket Status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={isConnected ? "default" : "destructive"} className="p-2">
                  WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Agent Status */}
          {agentStatus && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`p-2 ${getStatusColor(agentStatus.status)}`}>
                    Agent: {agentStatus.status}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Agent is {agentStatus.status}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Version Info */}
          {healthStatus && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="p-2">
                    v{healthStatus.version}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Backend v{healthStatus.version}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Marlin CVM Connect Button */}
          <MarlinConnectConfig />
          
          {/* System Info Button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">System Info</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>System Information</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="font-semibold">Agent Type:</div>
                <div>{agentStatus ? getAgentTypeDisplay(agentStatus.type) : 'Unknown'}</div>
                
                <div className="font-semibold">Wallet Address:</div>
                <div>{agentStatus?.walletAddress || 'Not available'}</div>
                
                <div className="font-semibold">API Status:</div>
                <div>
                  <Badge className={healthStatus ? getStatusColor(healthStatus.status) : 'bg-gray-500'}>
                    {healthStatus?.status || 'Unknown'}
                  </Badge>
                </div>
                
                <div className="font-semibold">WebSocket:</div>
                <div>
                  <Badge variant={isConnected ? "default" : "destructive"}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                
                <div className="font-semibold">Server Version:</div>
                <div>{healthStatus?.version || 'Unknown'}</div>
                
                <div className="font-semibold">Running in CVM:</div>
                <div>
                  <Badge className="bg-purple-500">Yes - Marlin Oyster CVM</Badge>
                </div>
                
                <div className="font-semibold">Recall Network:</div>
                <div>
                  <Badge className="bg-blue-500">Connected - 24 Memory Entries</Badge>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Main dashboard with tabs for different views */}
      <Tabs defaultValue="terminals" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="terminals">Agent Terminals</TabsTrigger>
          <TabsTrigger value="memory">Recall Memory</TabsTrigger>
          <TabsTrigger value="attestation">Attestation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="terminals" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <AgentTerminals />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="memory" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <RecallMemoryViewer />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attestation" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <AttestationTerminal />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function Dashboard() {
  return (
    <WebSocketProvider>
      <DashboardLayout />
    </WebSocketProvider>
  );
}