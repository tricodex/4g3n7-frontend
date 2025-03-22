import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled for Three.js component
const AgentAvatar = dynamic(
  () => import('@/components/4g3n7Avatar'),
  { ssr: false }
);

export const metadata = {
  title: '4g3n7 AI Assistant',
  description: 'Interactive 3D AI agent visualization',
};

export default function AgentPage() {
  return (
    <div className="w-full h-screen">
      <Suspense fallback={<div className="flex h-full items-center justify-center">Loading 3D Avatar...</div>}>
        <AgentAvatar />
      </Suspense>
    </div>
  );
}
