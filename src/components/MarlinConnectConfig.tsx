'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import apiClient from '../services/ApiClient';
import { useWebSocket } from './WebSocketProvider';

/**
 * Component that allows changing the API and WebSocket connection to a Marlin CVM instance
 */
const MarlinConnectConfig: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [marlinIp, setMarlinIp] = useState<string>('');
  const [port, setPort] = useState<string>('3222');
  const { setSocketUrl } = useWebSocket();
  
  // Connect to the Marlin CVM
  const handleConnect = async () => {
    if (!marlinIp) {
      toast.error('Please enter the Marlin CVM IP address');
      return;
    }

    // Format the URL
    const baseUrl = `http://${marlinIp}:${port}`;
    
    try {
      // Update the API client base URL
      apiClient.setBaseUrl(baseUrl);
      
      // Update the WebSocket URL
      setSocketUrl(baseUrl);
      
      // Test the connection
      const healthResponse = await apiClient.getHealth();
      
      toast.success(`Connected to ${baseUrl} - ${healthResponse.status} (v${healthResponse.version})`);
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect to Marlin CVM');
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-teal-400 border-teal-400 hover:bg-teal-900">
          Connect to Marlin CVM
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to Marlin CVM</DialogTitle>
          <DialogDescription>
            Enter the Marlin CVM IP address to connect the frontend to your deployed backend.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="marlin-ip" className="text-right">
              Marlin CVM IP
            </Label>
            <Input
              id="marlin-ip"
              placeholder="123.45.67.89"
              value={marlinIp}
              onChange={(e) => setMarlinIp(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="port" className="text-right">
              Port
            </Label>
            <Input
              id="port"
              placeholder="3222"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleConnect} className="bg-teal-600 hover:bg-teal-700">
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarlinConnectConfig;