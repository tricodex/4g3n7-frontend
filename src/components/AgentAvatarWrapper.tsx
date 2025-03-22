'use client';

import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled for Three.js component
const AgentAvatar = dynamic(
  () => import('./4g3n7Avatar'),
  { ssr: false }
);

export default function AgentAvatarWrapper() {
  return <AgentAvatar />;
}
