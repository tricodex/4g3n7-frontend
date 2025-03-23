import { Suspense } from 'react';
import { AgentTerminals } from '@/components/AgentTerminals';
import { RecallMemoryViewer } from '@/components/RecallMemoryViewer';
import AttestationTerminal from '@/components/AttestationTerminal';
import SimpleAgentAvatar from '@/components/SimpleAgentAvatar';

// This is the main page component that Next.js will render at the root route
export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Top section with avatar (1/4 of page) */}
      {/* Top section with avatar (1/4 of page) */}
      {/* Only render the avatar on the dedicated agent page */}
      
      {/* Bottom section with terminals in custom layout */}
      <section className="w-full flex-grow p-4 md:p-6 bg-gray-800 overflow-auto">
        
        <div className="grid gap-6 md:grid-cols-4">
          {/* Agent Terminals (2/4 - takes 2 columns) */}
          <div className="md:col-span-2 h-[60vh] overflow-auto">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Agent Commands</h2>
            <Suspense fallback={
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-blue-400">Loading terminal...</div>
              </div>
            }>
              <AgentTerminals />
            </Suspense>
          </div>
          
          {/* TEE Attestation Terminal (1/4) */}
          <div className="h-[60vh] overflow-auto">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">TEE Attestation</h2>
            <Suspense fallback={
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-blue-400">Loading terminal...</div>
              </div>
            }>
              <AttestationTerminal />
            </Suspense>
          </div>
          
          {/* Recall Memory Viewer (1/4) */}
          <div className="h-[60vh] overflow-auto">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Recall Memory</h2>
            <Suspense fallback={
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-blue-400">Loading terminal...</div>
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