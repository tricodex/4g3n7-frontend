import { Suspense } from 'react';
import AgentAvatarWrapper from '@/components/AgentAvatarWrapper';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="flex-grow flex items-center justify-center text-white">Loading 3D Avatar...</div>}>
        <AgentAvatarWrapper />
      </Suspense>
    </main>
  );
}
