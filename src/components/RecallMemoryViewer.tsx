'use client';

import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define types for memory entries
type MemoryEntry = {
  id: string;
  type: string;
  content: any;
  timestamp: string;
  agentId?: string;
  tags?: string[];
};

export function RecallMemoryViewer() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Memory types based on what we know about the system
  const memoryTypes = [
    'all',
    'portfolio-analysis',
    'trade_analysis', 
    'trade_execution',
    'web_search',
    'coordinated-analysis',
    'coordinated-trade',
    'llm_prompt',
    'llm_response'
  ];

  // Simulate fetching memories on component mount
  useEffect(() => {
    fetchMemories();
  }, []);

  // Apply filters when filter values change
  useEffect(() => {
    applyFilters();
  }, [selectedType, searchTerm, memories]);

  // Function to fetch memories from the API
  const fetchMemories = async () => {
    setLoading(true);
    try {
      // In a real app, fetch from API instead of using mock data
      // const response = await fetch('/api/memories');
      // const data = await response.json();
      // setMemories(data.memories);
      
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockMemories = generateMockMemories();
      setMemories(mockMemories);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unknown error fetching memories');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to the memories
  const applyFilters = () => {
    let filtered = [...memories];
    
    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(memory => memory.type === selectedType);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(memory => 
        memory.id.toLowerCase().includes(term) ||
        JSON.stringify(memory.content).toLowerCase().includes(term) ||
        (memory.agentId && memory.agentId.toLowerCase().includes(term)) ||
        (memory.tags && memory.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }
    
    // Sort by timestamp (newest first)
    filtered = filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    setFilteredMemories(filtered);
  };
  
  // Generate color for memory type badge
  const getMemoryTypeColor = (type: string): string => {
    switch (type) {
      case 'portfolio-analysis': return 'bg-blue-500';
      case 'trade_analysis': return 'bg-purple-500';
      case 'trade_execution': return 'bg-green-500';
      case 'web_search': return 'bg-orange-500';
      case 'coordinated-analysis': return 'bg-teal-500';
      case 'coordinated-trade': return 'bg-cyan-500';
      case 'llm_prompt': return 'bg-pink-500';
      case 'llm_response': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };
  
  // Format content for display
  const formatContent = (content: any): string => {
    if (typeof content === 'string') {
      return content;
    }
    try {
      return JSON.stringify(content, null, 2);
    } catch (e) {
      return String(content);
    }
  };
  
  // Generate mock memory entries for demonstration
  const generateMockMemories = (): MemoryEntry[] => {
    return [
      {
        id: '247fe25b-975e-49f9-91e7-277c16bd11c9',
        type: 'portfolio-analysis',
        content: {
          portfolio: {
            assets: {
              ETH: { amount: 0.5, value: 1500 },
              USDC: { amount: 1000, value: 1000 }
            },
            totalValue: 2500,
            riskScore: 'medium'
          },
          recommendations: [
            'Consider diversifying beyond ETH',
            'Add BTC exposure for better diversification',
            'Maintain USDC as a reserve for opportunities'
          ]
        },
        timestamp: new Date(Date.now() - 300000).toISOString(),
        agentId: 'trading-agent-main',
        tags: ['analysis', 'portfolio']
      },
      {
        id: 'agentkit-analysis-77i',
        type: 'portfolio-analysis',
        content: {
          portfolio: {
            assets: {
              ETH: { amount: 0.5, value: 1500 },
              USDC: { amount: 1000, value: 1000 }
            },
            totalValue: 2500,
            riskScore: 'medium-high'
          },
          marketSentiment: 'bullish',
          recommendations: [
            'ETH showing strong momentum',
            'Consider increasing ETH allocation',
            'Use USDC to buy dips'
          ]
        },
        timestamp: new Date(Date.now() - 280000).toISOString(),
        agentId: 'trading-agent-agentkit',
        tags: ['analysis', 'portfolio', 'agentkit']
      },
      {
        id: '41991e13-6add-4139-9b8b-73670b892521',
        type: 'coordinated-analysis',
        content: {
          combinedAnalysis: {
            primaryAgent: '247fe25b-975e-49f9-91e7-277c16bd11c9',
            agentKitAgent: 'agentkit-analysis-77i',
            consensus: 'partial',
            finalRecommendation: 'Maintain current allocation but watch ETH for potential increase'
          }
        },
        timestamp: new Date(Date.now() - 260000).toISOString(),
        agentId: 'coordinated-agent',
        tags: ['analysis', 'portfolio', 'coordinated']
      },
      {
        id: '6d1ee063-d6e4-432c-9f30-fe1e56e43d94',
        type: 'trade_analysis',
        content: {
          tradeType: 'swap',
          fromAsset: 'ETH',
          toAsset: 'USDC',
          amount: 0.1,
          reasoning: 'Taking partial profits on ETH position after recent price increase',
          expectedValue: 300
        },
        timestamp: new Date(Date.now() - 200000).toISOString(),
        agentId: 'trading-agent-main',
        tags: ['trade', 'analysis']
      },
      {
        id: '8e0c1ad2-dd5e-4ca0-aac2-565a22678c81',
        type: 'trade_execution',
        content: {
          tradeId: 'e79efb2c',
          tradeType: 'swap',
          fromAsset: 'ETH',
          toAsset: 'USDC',
          amount: 0.1,
          executionPrice: 3050,
          executionTime: new Date(Date.now() - 150000).toISOString(),
          status: 'completed',
          hash: '0x8e311a70e8424b85b10c538a456335db'
        },
        timestamp: new Date(Date.now() - 150000).toISOString(),
        agentId: 'trading-agent-main',
        tags: ['trade', 'execution']
      },
      {
        id: '1b2e7392-1145-4bdb-ae47-29b75009313a',
        type: 'coordinated-trade',
        content: {
          primaryAgent: 'trading-agent-main',
          agentKitAgent: 'trading-agent-agentkit',
          agreementStatus: 'full',
          tradeId: 'e79efb2c',
          tradeSummary: 'Both agents agreed to swap 0.1 ETH to USDC to secure profits',
          executionResult: '8e0c1ad2-dd5e-4ca0-aac2-565a22678c81'
        },
        timestamp: new Date(Date.now() - 140000).toISOString(),
        agentId: 'coordinated-agent',
        tags: ['trade', 'execution', 'coordinated']
      }
    ];
  };

  return (
    <div className="w-full">
      {/* <h2 className="text-xl font-bold mb-4">Recall Network Memory Explorer</h2> */}
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Select
          value={selectedType}
          onValueChange={(value: string) => setSelectedType(value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select memory type" />
          </SelectTrigger>
          <SelectContent>
            {memoryTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input 
          placeholder="Search memories..." 
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        
        <Button 
          onClick={fetchMemories} 
          disabled={loading}
          variant="default"
        >
          {loading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Fetching...
            </>
          ) : 'Refresh'}
        </Button>
      </div>
      
      {/* Memory list */}
      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            <p>Loading memory entries...</p>
          </div>
        </div>
      ) : filteredMemories.length === 0 ? (
        <Card className="p-8 text-center bg-muted">
          <CardContent className="pt-6">
            <p className="text-lg">No memory entries found</p>
            <p className="text-muted-foreground">Try changing your filters or refresh</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {filteredMemories.map((memory) => (
            <AccordionItem key={memory.id} value={memory.id} className="border rounded-md overflow-hidden">
              <AccordionTrigger className="hover:no-underline p-4 hover:bg-muted/50">
                <div className="flex flex-wrap items-center gap-2 text-left">
                  <Badge className={`${getMemoryTypeColor(memory.type)} text-white`}>
                    {memory.type}
                  </Badge>
                  <span className="font-bold text-sm">{memory.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(memory.timestamp)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-muted/30">
                <div className="p-4 space-y-3">
                  {memory.agentId && (
                    <div className="flex gap-2">
                      <span className="font-bold">Agent:</span>
                      <span>{memory.agentId}</span>
                    </div>
                  )}
                  
                  {memory.tags && memory.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      <span className="font-bold">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {memory.tags.map(tag => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <p className="font-bold mb-1">Content:</p>
                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      <pre className="text-xs whitespace-pre-wrap font-mono">
                        {formatContent(memory.content)}
                      </pre>
                    </ScrollArea>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}