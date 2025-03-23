'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';

type SimpleAgentAvatarProps = {
  className?: string;
  compact?: boolean;
};

// Use dynamic import for the avatar to prevent SSR issues
const AgentAvatar = dynamic(
  () => import('./4g3n7Avatar'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-pulse text-blue-400">Loading Agent Avatar...</div>
      </div>
    )
  }
);

// Simple wrapper component
export default function SimpleAgentAvatar({ className = '', compact = false }: SimpleAgentAvatarProps) {
  // Use client-side effect to ensure we only initialize once
  useEffect(() => {
    console.log('Rendering SimpleAgentAvatar with dynamic import');
  }, []);

  return (
    <div className={`relative h-full w-full ${className} ${compact ? 'scale-75' : ''}`}>
      <AgentAvatar />
    </div>
  );
}
