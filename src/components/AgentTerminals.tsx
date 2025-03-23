'use client';

import React, { useState, useEffect, useRef } from 'react';
import VoiceButton from './VoiceButton';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

// Correct type definition for TerminalMessage
type TerminalMessage = {
  content: string;
  type: 'system' | 'info' | 'error' | 'success' | 'user';
  timestamp: Date;
};

type TerminalProps = {
  title: string;
  messages: TerminalMessage[];
  onCommand?: (command: string) => void;
  showPrompt?: boolean;
};

export function AgentTerminals() {
  const [activeTerminalId, setActiveTerminalId] = useState<string>("logs");
  const [command, setCommand] = useState<string>("");
  const [terminals, setTerminals] = useState<{ [key: string]: TerminalMessage[] }>({
    logs: [
      { content: "System initialized", type: "system", timestamp: new Date() },
      { content: "Trading agent ready", type: "success", timestamp: new Date() }
    ],
    commands: [
      { content: "Welcome to the command terminal", type: "system", timestamp: new Date() },
      { content: "Type 'help' for available commands", type: "info", timestamp: new Date() }
    ]
  });
  
  const logsTerminalRef = useRef<HTMLDivElement>(null);
  const commandsTerminalRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll terminals when new messages arrive
  useEffect(() => {
    if (logsTerminalRef.current) {
      logsTerminalRef.current.scrollTop = logsTerminalRef.current.scrollHeight;
    }
  }, [terminals.logs]);
  
  useEffect(() => {
    if (commandsTerminalRef.current) {
      commandsTerminalRef.current.scrollTop = commandsTerminalRef.current.scrollHeight;
    }
  }, [terminals.commands]);
  
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) return;
    
    // Add user command to terminal
    const updatedMessages: TerminalMessage[] = [
      ...terminals.commands,
      { content: `> ${command}`, type: "user", timestamp: new Date() }
    ];
    
    // Process command
    if (command.toLowerCase() === "help") {
      updatedMessages.push({
        content: "Available commands: help, status, clear, trade [buy/sell] [amount]",
        type: "info",
        timestamp: new Date()
      });
    } else if (command.toLowerCase() === "status") {
      updatedMessages.push({
        content: "System status: Online | Memory usage: 128MB | Active connections: 3",
        type: "system",
        timestamp: new Date()
      });
    } else if (command.toLowerCase() === "clear") {
      setTerminals({
        ...terminals,
        commands: [{ content: "Terminal cleared", type: "system", timestamp: new Date() }]
      });
      setCommand("");
      return;
    } else if (command.toLowerCase().startsWith("trade")) {
      const parts = command.split(" ");
      if (parts.length >= 3) {
        const action = parts[1];
        const amount = parts[2];
        if (action === "buy" || action === "sell") {
          updatedMessages.push({
            content: `Executing ${action} order for ${amount} tokens...`,
            type: "success",
            timestamp: new Date()
          });
          
          // Add to logs as well
          setTerminals({
            ...terminals,
            commands: updatedMessages,
            logs: [
              ...terminals.logs,
              { 
                content: `Trade executed: ${action.toUpperCase()} ${amount} tokens`, 
                type: "info", 
                timestamp: new Date() 
              }
            ]
          });
          
          toast.success(`${action.toUpperCase()} order placed for ${amount} tokens`);
        } else {
          updatedMessages.push({
            content: `Invalid trade action. Use 'buy' or 'sell'.`,
            type: "error",
            timestamp: new Date()
          });
        }
      } else {
        updatedMessages.push({
          content: `Invalid trade command. Format: trade [buy/sell] [amount]`,
          type: "error",
          timestamp: new Date()
        });
      }
    } else {
      updatedMessages.push({
        content: `Unknown command: ${command}`,
        type: "error",
        timestamp: new Date()
      });
    }
    
    // Update terminal
    setTerminals({
      ...terminals,
      commands: updatedMessages
    });
    
    // Clear command input
    setCommand("");
  };
  
  const getMessageColorClass = (type: TerminalMessage['type']) => {
    switch (type) {
      case 'system': return 'text-gray-400';
      case 'info': return 'text-blue-400';
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'user': return 'text-yellow-300';
      default: return 'text-white';
    }
  };

  // Client-side only timestamp formatting to avoid hydration issues
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const formatTimestamp = (timestamp: Date): string => {
    if (!isClient) return "--:--:--"; // Return placeholder during server rendering
    
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    const seconds = timestamp.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };
  
  return (
    <Card className="h-full border-gray-700 bg-gray-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Agent Terminals</CardTitle>
      </CardHeader>
      
      <Tabs defaultValue="logs" onValueChange={setActiveTerminalId} className="h-[calc(100%-3rem)]">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="logs">System Logs</TabsTrigger>
            <TabsTrigger value="commands">Command Terminal</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="logs" className="flex flex-col h-full px-4 mt-0">
          <div className="h-full overflow-hidden flex flex-col bg-black/50 rounded-md">
            <ScrollArea className="flex-grow font-mono text-sm p-3">
              <div ref={logsTerminalRef}>
                {terminals.logs.map((message, index) => (
                  <div key={index} className={`mb-1 ${getMessageColorClass(message.type)}`}>
                    <span className="text-gray-500">[{formatTimestamp(message.timestamp)}]</span>{' '}
                    {message.content}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
        
        <TabsContent value="commands" className="flex flex-col h-full px-4 mt-0">
          <div className="flex flex-col h-full overflow-hidden bg-black/50 rounded-md">
            <ScrollArea className="flex-grow font-mono text-sm p-3">
              <div ref={commandsTerminalRef}>
                {terminals.commands.map((message, index) => (
                  <div key={index} className={`mb-1 flex items-start ${getMessageColorClass(message.type)}`}>
                    <div className="flex-grow">
                      {message.type !== 'user' && (
                        <span className="text-gray-500">[{formatTimestamp(message.timestamp)}]</span>
                      )}{' '}
                      {message.content}
                    </div>
                    {message.type !== 'user' && (
                      <VoiceButton text={message.content} className="ml-2 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t border-gray-800 bg-black/30">
              <form onSubmit={handleCommandSubmit} className="flex space-x-2">
                <Textarea
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Enter command..."
                  className="flex-1 font-mono h-[3rem] min-h-[3rem] px-3 py-2 bg-black/30 border-0 focus-visible:ring-1 focus-visible:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCommandSubmit(e);
                    }
                  }}
                />
                <Button type="submit" className="h-[3rem]">
                  Send
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}