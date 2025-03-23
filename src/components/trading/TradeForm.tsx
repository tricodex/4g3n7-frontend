'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

// Define interfaces for assets and market data
interface Asset {
  symbol: string;
  name: string;
  amount: number;
  value: number;
  change24h: number;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}

// Define props for the component
interface TradeFormProps {
  assets: Asset[];
  marketData: MarketData[];
  onSubmit: (tradeData: {
    fromAsset: string;
    toAsset: string;
    amount: number;
    slippage: number;
  }) => void;
  isSubmitting: boolean;
  isConnected: boolean;
}

export const TradeForm: React.FC<TradeFormProps> = ({
  assets,
  marketData,
  onSubmit,
  isSubmitting,
  isConnected
}) => {
  // Trading form state
  const [tradeForm, setTradeForm] = useState({
    fromAsset: 'USDC',
    toAsset: 'ETH',
    amount: 100,
    slippage: 0.5
  });
  
  // Initialize form with available assets when assets change
  useEffect(() => {
    if (assets.length > 0 && marketData.length > 0) {
      setTradeForm(prev => ({
        ...prev,
        fromAsset: assets[0].symbol,
        toAsset: assets[0].symbol !== marketData[0].symbol 
          ? marketData[0].symbol 
          : (marketData.length > 1 ? marketData[1].symbol : marketData[0].symbol)
      }));
    }
  }, [assets, marketData]);
  
  // Handle form changes
  const handleFormChange = (
    field: string, 
    value: string | number
  ) => {
    setTradeForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = () => {
    onSubmit({
      fromAsset: tradeForm.fromAsset,
      toAsset: tradeForm.toAsset,
      amount: tradeForm.amount,
      slippage: tradeForm.slippage
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Execute Trade</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="space-y-2">
                <Label htmlFor="fromAsset">From Asset</Label>
                <Select 
                  value={tradeForm.fromAsset}
                  onValueChange={(value: string) => handleFormChange('fromAsset', value)}
                >
                  <SelectTrigger id="fromAsset" aria-label="Select asset to trade from">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map(asset => (
                      <SelectItem key={`from-${asset.symbol}`} value={asset.symbol}>
                        {asset.symbol} - {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <div className="space-y-2">
                <Label htmlFor="toAsset">To Asset</Label>
                <Select 
                  value={tradeForm.toAsset}
                  onValueChange={(value: string) => handleFormChange('toAsset', value)}
                >
                  <SelectTrigger id="toAsset" aria-label="Select asset to trade to">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {marketData
                      .filter(data => data.symbol !== tradeForm.fromAsset)
                      .map(data => (
                        <SelectItem key={`to-${data.symbol}`} value={data.symbol}>
                          {data.symbol}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Trade</Label>
            <div className="relative">
              <Input 
                id="amount"
                type="number"
                min={1}
                step={1}
                value={tradeForm.amount.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleFormChange('amount', parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slippage">Max Slippage (%)</Label>
            <div className="relative">
              <Input 
                id="slippage"
                type="number"
                min={0.1}
                max={5}
                step={0.1}
                value={tradeForm.slippage.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleFormChange('slippage', parseFloat(e.target.value) || 0.5)
                }
              />
            </div>
          </div>
          
          <Button
            variant="default"
            disabled={!isConnected || isSubmitting}
            onClick={handleSubmit}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Submitting Trade
              </>
            ) : (
              'Execute Trade'
            )}
          </Button>
          
          {!isConnected && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                WebSocket disconnected. Real-time updates unavailable.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};