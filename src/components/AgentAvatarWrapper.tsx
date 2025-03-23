'use client';

import SimpleAgentAvatar from './SimpleAgentAvatar';

// Redirecting to the non-dynamic version
export default function AgentAvatarWrapper() {
  console.warn('AgentAvatarWrapper is deprecated. Use SimpleAgentAvatar instead');
  return null;
}