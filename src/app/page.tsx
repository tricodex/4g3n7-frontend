import { Suspense } from 'react';
import { AgentTerminals } from '@/components/AgentTerminals';
import { RecallMemoryViewer } from '@/components/RecallMemoryViewer';
import AttestationTerminal from '@/components/AttestationTerminal';
import SimpleAgentAvatar from '@/components/SimpleAgentAvatar';

// This is the main page component that Next.js will render at the root route
export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Bottom section with terminals in custom layout */}
      <section className="w-full flex-grow p-4 md:p-6 bg-gray-800 overflow-auto">
        <h1 className="text-2xl font-bold mb-6 text-blue-400">4g3n7 Control Terminal</h1>
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
          {/* Agent Terminals (3/4 - takes 3 columns) */}
          <div className="md:col-span-3 h-[60vh] overflow-auto order-1">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Agent Commands</h2>
            <Suspense fallback={
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-blue-400">Loading terminal...</div>
              </div>
            }>
              <AgentTerminals />
            </Suspense>
          </div>
          
          {/* Avatar (1/4 - right side) */}
          <div className="h-[60vh] order-2 bg-gray-900 rounded-lg overflow-hidden relative">
            <SimpleAgentAvatar />
          </div>
          
          {/* TEE Attestation Terminal (1/4) and Recall Memory (3/4) */}
          <div className="md:col-span-1 h-[60vh] overflow-auto order-4">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">TEE Attestation</h2>
            <Suspense fallback={
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-blue-400">Loading terminal...</div>
              </div>
            }>
              <AttestationTerminal />
            </Suspense>
          </div>
          
          <div className="md:col-span-3 h-[60vh] overflow-auto order-3">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Recall Memory</h2>
            <Suspense fallback={
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-blue-400">Loading memory viewer...</div>
              </div>
            }>
              <RecallMemoryViewer />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}