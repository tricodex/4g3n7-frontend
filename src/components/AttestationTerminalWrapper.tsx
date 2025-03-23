'use client';

import dynamic from 'next/dynamic';

// Dynamically import AttestationTerminal to prevent any server-side issues
const AttestationTerminal = dynamic(() => import('./AttestationTerminal'), {
  ssr: false,
});

export default function AttestationTerminalWrapper() {
  return <AttestationTerminal />;
}
