'use client';

import React, { useState, useEffect } from 'react';
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

// Import any additional components or icons needed
import { CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useWebSocket } from './WebSocketProvider';
import apiClient from '../services/ApiClient';

// Define types
type TradeType = 'swap' | 'liquidity' | 'stake' | 'limit';
type Position = {
  id: string;
  asset: string;
  amount: number;
  valueUSD: number;
  entryPrice: number;
  currentPrice: number;
  profit: number;
  profitPercent: number;
  timestamp: string;
};

type Trade = {
  id: string;
  type: TradeType;
  from: string;
  to: string;
  fromAmount: number;
  toAmount: number;
  priceImpact: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  txHash?: string;
  errors?: string[];
};

type Message = {
  type: 'info' | 'success' | 'error' | 'warning';
  content: string;
  timestamp: Date;
};

export function TradingInterface() {
  // State for form
  const [asset, setAsset] = useState<string>('ETH');
  const [targetAsset, setTargetAsset] = useState<string>('USDC');
  const [amount, setAmount] = useState<string>('0.1');
  const [tradeType, setTradeType] = useState<TradeType>('swap');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // State for data
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { 
      type: 'info', 
      content: 'Trading interface initialized. Ready to trade.', 
      timestamp: new Date() 
    }
  ]);
  
  // WebSocket connection
  const { isConnected, lastMessage } = useWebSocket();
  
  // Available assets
  const availableAssets = ['ETH', 'USDC', 'BTC', 'SOL', 'AVAX'];
  
  // Load initial data
  useEffect(() => {
    fetchPositions();
    fetchTrades();
    
    // Add welcome message
    addMessage('info', 'Welcome to the 4g3n7 Auto Trader interface.');
    
    // Fetch data periodically
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // Simulate occasional updates
        fetchPositions();
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        
        if (data.type === 'trade_update') {
          addMessage('info', `Trade update: ${data.message}`);
          fetchTrades();
          fetchPositions();
        } else if (data.type === 'system') {
          addMessage('info', `System: ${data.message}`);
        } else if (data.type === 'alert') {
          addMessage('warning', `Alert: ${data.message}`);
        }
      } catch (e) {
        console.log('Error parsing WebSocket message', e);
      }
    }
  }, [lastMessage]);
  
  // Add a message to the message list
  const addMessage = (type: 'info' | 'success' | 'error' | 'warning', content: string) => {
    setMessages(prev => [
      ...prev,
      { type, content, timestamp: new Date() }
    ]);
  };
  
  // Fetch positions data
  const fetchPositions = async () => {
    try {
      // In a real app, you would fetch from an API
      const mockPositions: Position[] = [
        {
          id: 'pos-1',
          asset: 'ETH',
          amount: 0.5,
          valueUSD: 1500,
          entryPrice: 2800,
          currentPrice: 3000,
          profit: 100,
          profitPercent: 7.14,
          timestamp: new Date().toISOString()
        },
        {
          id: 'pos-2',
          asset: 'USDC',
          amount: 1000,
          valueUSD: 1000,
          entryPrice: 1,
          currentPrice: 1,
          profit: 0,
          profitPercent: 0,
          timestamp: new Date().toISOString()
        },
        {
          id: 'pos-3',
          asset: 'BTC',
          amount: 0.01,
          valueUSD: 600,
          entryPrice: 63000,
          currentPrice: 60000,
          profit: -30,
          profitPercent: -5,
          timestamp: new Date().toISOString()
        }
      ];
      
      setPositions(mockPositions);
    } catch (error) {
      addMessage('error', 'Failed to fetch positions');
      console.error('Error fetching positions:', error);
    }
  };
  
  // Fetch trades data
  const fetchTrades = async () => {
    try {
      // In a real app, you would fetch from an API
      const mockTrades: Trade[] = [
        {
          id: 'trade-1',
          type: 'swap',
          from: 'ETH',
          to: 'USDC',
          fromAmount: 0.1,
          toAmount: 300,
          priceImpact: 0.1,
          status: 'completed',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          txHash: '0x123abc...'
        },
        {
          id: 'trade-2',
          type: 'swap',
          from: 'USDC',
          to: 'BTC',
          fromAmount: 500,
          toAmount: 0.01,
          priceImpact: 0.2,
          status: 'completed',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          txHash: '0x456def...'
        },
        {
          id: 'trade-3',
          type: 'liquidity',
          from: 'ETH',
          to: 'USDC',
          fromAmount: 0.05,
          toAmount: 150,
          priceImpact: 0.05,
          status: 'failed',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          errors: ['Insufficient liquidity']
        }
      ];
      
      setTrades(mockTrades);
    } catch (error) {
      addMessage('error', 'Failed to fetch trades');
      console.error('Error fetching trades:', error);
    }
  };
  
  // Execute trade
  const handleTrade = async () => {
    if (!asset || !targetAsset || !amount || isNaN(parseFloat(amount))) {
      addMessage('error', 'Please fill all fields with valid values');
      toast.error('Please fill all fields with valid values');
      return;
    }
    
    if (asset === targetAsset) {
      addMessage('error', 'Source and target assets cannot be the same');
      toast.error('Source and target assets cannot be the same');
      return;
    }
    
    setIsLoading(true);
    addMessage('info', `Initiating ${tradeType} of ${amount} ${asset} to ${targetAsset}...`);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, you would call your API
      // const response = await apiClient.executeTrade({
      //   type: tradeType,
      //   from: asset,
      //   to: targetAsset,
      //   amount: parseFloat(amount)
      // });
      
      // Simulate successful response
      const mockTradeId = `trade-${Date.now()}`;
      const mockToAmount = parseFloat(amount) * (asset === 'ETH' ? 3000 : asset === 'BTC' ? 60000 : 1) / 
                           (targetAsset === 'ETH' ? 3000 : targetAsset === 'BTC' ? 60000 : 1);
      
      const newTrade: Trade = {
        id: mockTradeId,
        type: tradeType,
        from: asset,
        to: targetAsset,
        fromAmount: parseFloat(amount),
        toAmount: parseFloat(mockToAmount.toFixed(6)),
        priceImpact: 0.1,
        status: 'completed',
        timestamp: new Date().toISOString(),
        txHash: `0x${Math.random().toString(16).substring(2, 10)}...`
      };
      
      // Update trades list
      setTrades(prev => [newTrade, ...prev]);
      
      // Update positions (in a real app this would come from the API)
      fetchPositions();
      
      // Show success message
      addMessage('success', `Successfully executed ${tradeType} of ${amount} ${asset} to ${targetAsset}`);
      toast.success(`Trade executed successfully`);
    } catch (error) {
      addMessage('error', `Failed to execute trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error(`Trade failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Get status badge
  const getStatusBadge = (status: Trade['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  // Get profit/loss badge
  const getProfitBadge = (profit: number) => {
    if (profit > 0) {
      return <Badge className="bg-green-500">+${profit.toFixed(2)} (+{profit.toFixed(2)}%)</Badge>;
    } else if (profit < 0) {
      return <Badge className="bg-red-500">${profit.toFixed(2)} ({profit.toFixed(2)}%)</Badge>;
    } else {
      return <Badge className="bg-gray-500">$0.00 (0.00%)</Badge>;
    }
  };
  
  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="text-2xl font-bold mb-4">4g3n7 Trading Interface</h1>
      
      {!isConnected && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            Unable to connect to trading backend. Check your network connection or server status.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Trading Form */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Execute Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleTrade(); }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="trade-type">Trade Type</Label>
                  <Select
                    value={tradeType}
                    onValueChange={(value: TradeType) => setTradeType(value)}
                  >
                    <SelectTrigger id="trade-type">
                      <SelectValue placeholder="Select trade type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="swap">Swap</SelectItem>
                      <SelectItem value="liquidity">Add Liquidity</SelectItem>
                      <SelectItem value="stake">Stake</SelectItem>
                      <SelectItem value="limit">Limit Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from-asset">From Asset</Label>
                    <Select
                      value={asset}
                      onValueChange={setAsset}
                    >
                      <SelectTrigger id="from-asset">
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAssets.map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="to-asset">To Asset</Label>
                    <Select
                      value={targetAsset}
                      onValueChange={setTargetAsset}
                    >
                      <SelectTrigger id="to-asset">
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAssets.map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="0.0"
                  />
                  {asset === 'ETH' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ≈ ${(parseFloat(amount || '0') * 3000).toFixed(2)} USD
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : `Execute ${tradeType}`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Portfolio Positions */}
        <Card className="md:col-span-8">
          <CardHeader>
            <CardTitle>Portfolio Positions</CardTitle>
          </CardHeader>
          <CardContent>
            {positions.length === 0 ? (
              <div className="text-center py-4">
                <p>No positions found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Value (USD)</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>Profit/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">{position.asset}</TableCell>
                      <TableCell>{position.amount.toFixed(6)}</TableCell>
                      <TableCell>${position.valueUSD.toFixed(2)}</TableCell>
                      <TableCell>${position.currentPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        {getProfitBadge(position.profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Total Portfolio Value: ${positions.reduce((sum, pos) => sum + pos.valueUSD, 0).toFixed(2)}
                </TableCaption>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Trades */}
        <Card className="md:col-span-6">
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {trades.length === 0 ? (
              <div className="text-center py-4">
                <p>No recent trades</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="capitalize">{trade.type}</TableCell>
                      <TableCell>{trade.fromAmount} {trade.from}</TableCell>
                      <TableCell>{trade.toAmount} {trade.to}</TableCell>
                      <TableCell>{getStatusBadge(trade.status)}</TableCell>
                      <TableCell className="text-xs">{formatTimestamp(trade.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Messages Log */}
        <Card className="md:col-span-6">
          <CardHeader>
            <CardTitle>System Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              {messages.map((message, index) => (
                <div key={index} className="mb-2 flex items-start">
                  {message.type === 'info' && <Info className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />}
                  {message.type === 'success' && <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />}
                  {message.type === 'warning' && <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-yellow-500" />}
                  {message.type === 'error' && <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-red-500" />}
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}