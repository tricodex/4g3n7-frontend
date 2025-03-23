export const metadata = {
  title: '4g3n7 AI Assistant',
  description: 'Interactive 3D AI agent visualization',
};

import { Suspense } from 'react';
import SimpleAgentAvatar from '@/components/SimpleAgentAvatar';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="flex-grow flex items-center justify-center text-white">Loading 3D Avatar...</div>}>
        <SimpleAgentAvatar />
      </Suspense>
    </main>
  );
}
