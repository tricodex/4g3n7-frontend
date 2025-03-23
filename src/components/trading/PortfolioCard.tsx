'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

// Define asset interface
interface Asset {
  symbol: string;
  name: string;
  amount: number;
  value: number;
  change24h: number;
}

// Define props for the component
interface PortfolioCardProps {
  assets: Asset[];
  totalValue: number;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ 
  assets, 
  totalValue, 
  onAnalyze,
  isAnalyzing
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">Portfolio Overview</CardTitle>
        <Button 
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="h-8 px-3"
        >
          {isAnalyzing ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            'Analyze Portfolio'
          )}
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap mb-6 gap-6">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Total Value</h4>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <div className="flex items-center text-sm text-green-500">
              <ArrowUpIcon size={16} className="mr-1" />
              1.2%
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Assets</h4>
            <div className="text-2xl font-bold">{assets.length}</div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Last Updated</h4>
            <div className="text-md">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Value (USD)</TableHead>
              <TableHead className="text-right">24h Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map(asset => (
              <TableRow key={asset.symbol}>
                <TableCell>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">{asset.symbol}</span>
                    <span className="text-sm text-muted-foreground">{asset.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{asset.amount.toLocaleString()}</TableCell>
                <TableCell className="text-right">${asset.value.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <span className={asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};