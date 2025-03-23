'use client';

import React from 'react';
import AgentAvatar from './4g3n7Avatar';

type SimpleAgentAvatarProps = {
  className?: string;
  compact?: boolean;
};

// Simple wrapper component
export default function SimpleAgentAvatar({ className = '', compact = false }: SimpleAgentAvatarProps) {
  return (
    <div className={`relative h-full w-full ${className} ${compact ? 'scale-75' : ''}`}>
      <AgentAvatar />
    </div>
  );
}
