'use client';

import React from 'react';
import { useAvatarStore } from '@/lib/avatarStore';
import AgentAvatar from './4g3n7Avatar';

type SimpleAgentAvatarProps = {
  className?: string;
  compact?: boolean;
};

// Simple wrapper component - direct import without suspense to avoid freezing
export default function SimpleAgentAvatar({ className = '', compact = false }: SimpleAgentAvatarProps) {
  // Get avatar store state and actions
  const { isSpeaking, setIsSpeaking, toggleSpeaking } = useAvatarStore();
  // Enhanced debugging buttons with more reliable animation control
  const triggerSpeechStart = () => {
    console.log('\ud83d\udc7e SimpleAgentAvatar: Manually triggering speech start');
    
    // Show visual feedback for the button press
    const container = document.querySelector('.avatar-container');
    if (container) {
      container.classList.add('is-debug-active');
      setTimeout(() => container.classList.remove('is-debug-active'), 300);
    }
    
    // 1. Use Zustand store first (proper state management)
    setIsSpeaking(true);
    
    // 2. Legacy support via events
    window.dispatchEvent(new Event('speechstart'));
    window.postMessage('speechstart', '*');
    
    // 3. Direct manipulation - most reliable, bypasses all layers
    if (typeof window !== 'undefined') {
      // Set all global flags
      // @ts-ignore
      window.isSpeaking = true;
      // @ts-ignore
      window.__AVATAR_SPEAKING_STATE__ = true;
      
      // Direct debug manipulation (the most reliable method)
      if ('debugAnimateMouth' in window) {
        // @ts-ignore
        window.debugAnimateMouth(true);
        
        // Double attempt with timeout for reliability
        setTimeout(() => {
          // @ts-ignore
          window.debugAnimateMouth(true);
          console.log('\ud83d\udc7e Repeated mouth animation trigger (Talk)');
        }, 100);
      }
    }
    
    // 4. Visual feedback class
    document.querySelector('.avatar-container')?.classList.add('is-speaking');
  };
  
  const triggerSpeechEnd = () => {
    console.log('\ud83d\udc7e SimpleAgentAvatar: Manually triggering speech end');
    
    // Show visual feedback for the button press
    const container = document.querySelector('.avatar-container');
    if (container) {
      container.classList.add('is-debug-active');
      setTimeout(() => container.classList.remove('is-debug-active'), 300);
    }
    
    // 1. Use Zustand store first
    setIsSpeaking(false);
    
    // 2. Legacy support via events
    window.dispatchEvent(new Event('speechend'));
    window.postMessage('speechend', '*');
    
    // 3. Direct manipulation - most reliable
    if (typeof window !== 'undefined') {
      // Set all global flags
      // @ts-ignore
      window.isSpeaking = false;
      // @ts-ignore
      window.__AVATAR_SPEAKING_STATE__ = false;
      
      // Direct debug manipulation (the most reliable)
      if ('debugAnimateMouth' in window) {
        // @ts-ignore
        window.debugAnimateMouth(false);
        
        // Double attempt with timeout
        setTimeout(() => {
          // @ts-ignore
          window.debugAnimateMouth(false);
          console.log('\ud83d\udc7e Repeated mouth animation trigger (Stop)');
        }, 100);
      }
    }
    
    // 4. Visual feedback class
    document.querySelector('.avatar-container')?.classList.remove('is-speaking');
  };

  return (
    <div className={`avatar-container relative h-[calc(100%-3rem)] w-full ${className} ${compact ? 'scale-75' : ''}`}>
      <style jsx global>{`
        /* Add animation classes that can be directly manipulated via DOM as a fallback */
        .avatar-container.is-speaking .mouth-animate {
          animation: mouthTalk 0.3s infinite alternate;
        }
        
        @keyframes mouthTalk {
          0% { transform: scaleY(1); }
          100% { transform: scaleY(2.5); }
        }
        
        /* Debug feedback for button presses */
        .avatar-container.is-debug-active {
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
        }
        
        /* Add debug styles to make mouth animation visible */
        .avatar-container.is-speaking:after {
          content: "🔊";
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 24px;
          animation: pulse 0.5s infinite alternate;
        }
        
        @keyframes pulse {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.2); }
        }
        
        /* Style the audio visualizer to appear behind the avatar */
        #audio-visualizer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          opacity: 0.3;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        
        .avatar-container.is-speaking #audio-visualizer {
          opacity: 0.6; /* Increase visibility when speaking */
        }
        
        @media (prefers-reduced-motion) {
          #audio-visualizer {
            opacity: 0.2;
          }
        }
      `}</style>
      
      <AgentAvatar />
      
      {/* Small debug controls - only visible during development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 right-2 flex space-x-2 opacity-50 hover:opacity-100 z-10">
          <button 
            onClick={() => {
              console.log('\ud83d\udca5 TEST MOUTH button pressed - manual animation override');
              
              // Flash the button to show it was clicked
              const btn = document.activeElement;
              if (btn instanceof HTMLElement) {
                btn.style.transform = 'scale(1.2)';
                setTimeout(() => { btn.style.transform = ''; }, 200);
              }
              
              // Use multiple approaches to ensure animation
              if (typeof window !== 'undefined') {
                // 1. Use Zustand store
                setIsSpeaking(true);
                
                // 2. Set global flags
                // @ts-ignore
                window.isSpeaking = true;
                // @ts-ignore
                window.__AVATAR_SPEAKING_STATE__ = true;
                
                // 3. Direct animation (most reliable)
                if ('debugAnimateMouth' in window) {
                  try {
                    // @ts-ignore
                    window.debugAnimateMouth(true);
                    console.log('\ud83d\udca5 Direct mouth animation called with: true');
                    
                    // Add visual feedback
                    document.querySelector('.avatar-container')?.classList.add('is-speaking');
                    
                    // Delay closing mouth to make animation visible
                    setTimeout(() => {
                      console.log('\ud83d\udca5 Closing mouth after delay');
                      // @ts-ignore
                      window.debugAnimateMouth(false);
                      setIsSpeaking(false);
                      document.querySelector('.avatar-container')?.classList.remove('is-speaking');
                      // @ts-ignore
                      window.isSpeaking = false;
                      // @ts-ignore
                      window.__AVATAR_SPEAKING_STATE__ = false;
                    }, 3000); // Longer delay for visibility
                  } catch (err) {
                    console.error('Error during test mouth animation:', err);
                  }
                }
              }
            }}
            className="bg-purple-700 text-white px-2 py-1 rounded text-xs font-bold animate-pulse"
          >
            Test Mouth
          </button>
          <button 
            onClick={triggerSpeechStart}
            className="bg-green-700 text-white px-2 py-1 rounded text-xs animate-pulse"
          >
            Talk
          </button>
          <button 
            onClick={triggerSpeechEnd}
            className="bg-red-700 text-white px-2 py-1 rounded text-xs"
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );
}
