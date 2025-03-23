'use client';

import React, { useEffect } from 'react';
import { useAvatarStore } from '@/lib/avatarStore';
import { Button } from "@/components/ui/button";
import { Volume2, StopCircle } from "lucide-react";
import { useSpeechSynthes } from '@lobehub/tts/react';

type VoiceButtonProps = {
  text: string;
  className?: string;
};

export default function VoiceButton({ text, className = '' }: VoiceButtonProps) {
  // Get avatar store state and actions
  const { isSpeaking, setIsSpeaking } = useAvatarStore();
  const ttsOptions = {
    voice: 'en-US-JennyNeural' // Default voice
  };
  
  const { isLoading, start, stop } = useSpeechSynthes(text, ttsOptions);
  
  // Force the avatar to speak via Zustand store - enhanced with visual feedback
  const forceSpeaking = () => {
    const newState = !isSpeaking;
    
    console.log(`🎤 VoiceButton: Toggling speaking state to ${newState}`);
    
    // Use our centralized store
    setIsSpeaking(newState);
    
    // Visual user feedback that state changed (flash button)
    const btn = document.activeElement;
    if (btn && btn instanceof HTMLElement) {
      btn.style.transform = 'scale(1.2)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 200);
    }
    
    // Legacy support - still dispatch events for components that might not be using the store
    if (typeof window !== 'undefined') {
      // Set all global flags we're aware of for backward compatibility
      // @ts-ignore
      window.isSpeaking = newState;
      // @ts-ignore
      window.__AVATAR_SPEAKING_STATE__ = newState;
      
      // Method 1: Custom event
      window.dispatchEvent(new Event(newState ? 'speechstart' : 'speechend'));
      
      // Method 2: Post message
      window.postMessage(newState ? 'speechstart' : 'speechend', '*');
      
      // Method 3: Direct control if possible
      try {
        if (newState) {
          start();
        } else {
          stop();
        }
      } catch (err) {
        console.error('Could not directly control speech state:', err);
      }
      
      // Method 4: Direct animation via debug function (MOST RELIABLE)
      if ('debugAnimateMouth' in window) {
        console.log(`🎤 Using direct debug animation method with ${newState}`);
        // @ts-ignore
        window.debugAnimateMouth(newState);
      }
      
      // Double attempt with timeout as a failsafe
      setTimeout(() => {
        if ('debugAnimateMouth' in window) {
          console.log(`🎤 Delayed retry animation with ${newState}`);
          // @ts-ignore
          window.debugAnimateMouth(newState);
        }
      }, 100);
    }
  };
  
  // Update Zustand store when speech state changes - one way binding only!
  useEffect(() => {
    // This is important: DO NOT check or compare with isSpeaking here, as that creates a cycle
    console.log(`🎤 VoiceButton: Speech state changed to ${isLoading ? 'speaking' : 'not speaking'}`);
    
    // Update the store directly from the speech synthesis state
    setIsSpeaking(isLoading);
    
    // Legacy support for non-store components
    if (typeof window !== 'undefined') {
      // Set global flags for backward compatibility
      // @ts-ignore
      window.isSpeaking = isLoading;
      // @ts-ignore
      window.__AVATAR_SPEAKING_STATE__ = isLoading;
      
      // Dispatch events for components still listening
      const eventName = isLoading ? 'speechstart' : 'speechend';
      window.dispatchEvent(new Event(eventName));
      window.postMessage(eventName, '*');
      
      // Direct animation via debug function (MOST RELIABLE)
      if ('debugAnimateMouth' in window) {
        console.log(`🎤 Using direct debug function with ${isLoading}`);
        // @ts-ignore
        window.debugAnimateMouth(isLoading);
      }
      
      // Double attempt with timeout as a failsafe
      setTimeout(() => {
        if ('debugAnimateMouth' in window) {
          console.log(`🎤 Delayed retry animation with ${isLoading}`);
          // @ts-ignore
          window.debugAnimateMouth(isLoading);
        }
      }, 100);
    }
  }, [isLoading, setIsSpeaking]); // IMPORTANT: Remove isSpeaking from dependencies!
  
  return (
    <div className="inline-flex gap-1">
      <Button 
        variant="ghost" 
        size="icon"
        className={`p-0 w-7 h-7 ${className}`}
        onClick={isLoading ? stop : start}
        title={isLoading ? "Stop speaking" : "Speak this message"}
      >
        {isLoading ? (
          <StopCircle className="h-5 w-5 text-red-400" />
        ) : (
          <Volume2 className="h-5 w-5 text-blue-400" />
        )}
      </Button>
      
      {/* Hidden debug button - only visible during development */}
      {process.env.NODE_ENV === 'development' && (
        <Button 
          variant="ghost" 
          size="icon"
          className="p-0 w-7 h-7 opacity-50 hover:opacity-100"
          onClick={forceSpeaking}
          title="Force avatar mouth"
        >
          <span className="text-xs font-bold">🛠️</span>
        </Button>
      )}
    </div>
  );
}
