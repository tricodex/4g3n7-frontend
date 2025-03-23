'use client';

import React, { useState } from 'react';
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
