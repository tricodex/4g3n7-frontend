'use client';

import { useEffect } from 'react';
import AgentAvatar from './4g3n7Avatar';

// Simple wrapper that doesn't use dynamic import
export default function SimpleAgentAvatar() {
  // Use client-side effect to ensure we only initialize once
  useEffect(() => {
    console.log('Rendering SimpleAgentAvatar - non-dynamic version');
  }, []);

  return <AgentAvatar />;
}
