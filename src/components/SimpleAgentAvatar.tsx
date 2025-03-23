'use client';

import React from 'react';
import AgentAvatar from './4g3n7Avatar';

type SimpleAgentAvatarProps = {
  className?: string;
  compact?: boolean;
};

// Simple wrapper component - direct import without suspense to avoid freezing
export default function SimpleAgentAvatar({ className = '', compact = false }: SimpleAgentAvatarProps) {
  return (
    <div className={`relative h-[calc(100%-3rem)] w-full ${className} ${compact ? 'scale-75' : ''}`}>
      <AgentAvatar />
    </div>
  );
}
