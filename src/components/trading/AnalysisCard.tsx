'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUpIcon, ArrowDownIcon, AlertTriangleIcon } from 'lucide-react';

// Define sentiment type
type Sentiment = 'bullish' | 'bearish' | 'neutral';

// Define recommendation structure
interface Recommendation {
  action: string;
  confidence: number;
  rationale: string;
}

// Define props for the component
interface AnalysisCardProps {
  analysisDate: Date;
  marketSentiment: Sentiment;
  sentiment: number; // -100 to 100
  recommendations: Recommendation[];
  riskScore: number; // 0 to 100
  timeHorizon: string;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ 
  analysisDate,
  marketSentiment,
  sentiment,
  recommendations,
  riskScore,
  timeHorizon
}) => {
  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">AI Portfolio Analysis</CardTitle>
        <Badge
          className={
            marketSentiment === 'bullish' ? 'bg-green-500' :
            marketSentiment === 'bearish' ? 'bg-red-500' : 
            'bg-blue-500'
          }
        >
          {marketSentiment.toUpperCase()}
        </Badge>
      </CardHeader>
      
      <CardContent>
        {/* Loading state would go here */}
        <Progress value={80} className="mb-4" />
        
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Analysis as of {analysisDate.toLocaleString()}
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Market Sentiment Section */}
          <div>
            <h3 className="font-medium mb-2">Market Sentiment</h3>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${sentiment > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.abs(sentiment)}%`, marginLeft: sentiment > 0 ? '50%' : `${50 - Math.abs(sentiment/2)}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm">{sentiment > 0 ? '+' : ''}{sentiment}%</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Recommendations Section */}
          <div>
            <h3 className="font-medium mb-2">Recommendations</h3>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{rec.action}</span>
                    <Badge variant="outline">
                      {rec.confidence}% Confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{rec.rationale}</p>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* Risk Assessment Section */}
          <div>
            <h3 className="font-medium mb-2">Risk Assessment</h3>
            <div className="space-y-2">
              <div className="flex justify-between mb-1">
                <span>Risk Score</span>
                <span 
                  className={
                    riskScore > 75 ? 'text-red-500' : 
                    riskScore > 50 ? 'text-yellow-500' : 
                    'text-green-500'
                  }
                >
                  {riskScore}/100
                </span>
              </div>
              <Progress 
                value={riskScore} 
                className={
                  riskScore > 75 ? 'text-red-500' : 
                  riskScore > 50 ? 'text-yellow-500' : 
                  'text-green-500'
                }
              />
              <div className="flex items-center">
                <AlertTriangleIcon size={16} className="mr-1 text-yellow-500" />
                <span className="text-sm">
                  {riskScore > 75 ? 'High risk portfolio! Consider rebalancing.' : 
                   riskScore > 50 ? 'Moderate risk. Monitor closely.' : 
                   'Low risk portfolio. Well balanced.'}
                </span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Time Horizon Section */}
          <div>
            <h3 className="font-medium mb-2">Investment Horizon</h3>
            <div className="space-y-2">
              <p>{timeHorizon} strategy recommended based on market conditions and portfolio composition</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};