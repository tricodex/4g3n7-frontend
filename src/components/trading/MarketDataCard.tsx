'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

// Define price data interface
interface TokenPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
}

// Define props for the component
interface MarketDataCardProps {
  prices: TokenPrice[];
  lastUpdated: Date;
}

export const MarketDataCard: React.FC<MarketDataCardProps> = ({ 
  prices, 
  lastUpdated 
}) => {
  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">Market Data</CardTitle>
        <span className="text-sm text-muted-foreground">Updated: {lastUpdated.toLocaleTimeString()}</span>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {prices.map(token => (
            <div key={token.symbol} className="flex justify-between items-center pb-2 border-b last:border-b-0">
              <div>
                <div className="font-semibold">{token.symbol}</div>
                <div className="text-sm text-muted-foreground">{token.name}</div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold">${token.price.toLocaleString()}</div>
                <div className="flex items-center justify-end">
                  {token.change24h >= 0 ? (
                    <ArrowUpIcon size={16} className="text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon size={16} className="text-red-500 mr-1" />
                  )}
                  <span 
                    className={token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}
                  >
                    {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold">24h Volume: </span>
            ${prices.reduce((sum, token) => sum + token.volume24h, 0).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};