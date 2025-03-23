import './globals.css';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { WebSocketProvider } from '@/components/WebSocketProvider';
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: '4g3n7 - Secure AI Trading Agent',
  description: 'AI trading agent running in a trusted execution environment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        <WebSocketProvider>
          <header className="w-full bg-black p-4 sticky top-0 z-50 border-b border-gray-800 flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image 
                src="/437.png" 
                alt="4g3n7 Logo" 
                width={32} 
                height={32} 
                className="" 
              />
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/" className="hover:text-blue-400 transition-colors">Dashboard</Link>
              <Link href="/agent" className="hover:text-blue-400 transition-colors">Avatar</Link>
              <Link href="/trade" className="hover:text-blue-400 transition-colors">Trade</Link>
            </nav>
          </header>
          {children}
          <Toaster />
        </WebSocketProvider>
      </body>
    </html>
  );
}
