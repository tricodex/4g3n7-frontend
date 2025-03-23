'use client';

import React from 'react';
import AgentAvatar from './4g3n7Avatar';

type SimpleAgentAvatarProps = {
  className?: string;
  compact?: boolean;
};

// Simple wrapper component - direct import without suspense to avoid freezing
export default function SimpleAgentAvatar({ className = '', compact = false }: SimpleAgentAvatarProps) {
  // Add debugging buttons to manually trigger speech events for testing
  const triggerSpeechStart = () => {
    console.log('Manually triggering speech start');
    window.dispatchEvent(new Event('speechstart'));
    window.postMessage('speechstart', '*');
  };
  
  const triggerSpeechEnd = () => {
    console.log('Manually triggering speech end');
    window.dispatchEvent(new Event('speechend'));
    window.postMessage('speechend', '*');
  };

  return (
    <div className={`relative h-[calc(100%-3rem)] w-full ${className} ${compact ? 'scale-75' : ''}`}>
      <AgentAvatar />
      
      {/* Small debug controls - only visible during development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 right-2 flex space-x-2 opacity-50 hover:opacity-100 z-10">
          <button 
            onClick={triggerSpeechStart}
            className="bg-green-700 text-white px-2 py-1 rounded text-xs"
          >
            Talk
          </button>
          <button 
            onClick={triggerSpeechEnd}
            className="bg-red-700 text-white px-2 py-1 rounded text-xs"
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );
}
