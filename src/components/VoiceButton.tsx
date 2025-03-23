'use client';

import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, StopCircle } from "lucide-react";
import { useSpeechSynthes } from '@lobehub/tts/react';

type VoiceButtonProps = {
  text: string;
  className?: string;
};

export default function VoiceButton({ text, className = '' }: VoiceButtonProps) {
  const ttsOptions = {
    voice: 'en-US-JennyNeural' // Default voice
  };
  
  const { isLoading, start, stop } = useSpeechSynthes(text, ttsOptions);
  
  // Emit custom events for avatar to listen to
  useEffect(() => {
    if (isLoading) {
      // Dispatch event when speech starts using both approaches
      const startEvent = new Event('speechstart');
      window.dispatchEvent(startEvent);
      window.postMessage('speechstart', '*');
      console.log('VoiceButton: Dispatched speechstart event');
    } else {
      // Dispatch event when speech ends using both approaches
      const endEvent = new Event('speechend');
      window.dispatchEvent(endEvent);
      window.postMessage('speechend', '*');
      console.log('VoiceButton: Dispatched speechend event');
    }
  }, [isLoading]);
  
  return (
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
  );
}
