'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import SimpleAgentAvatar from './SimpleAgentAvatar';

export default function AvatarCard() {
  return (
    <Card className="h-full w-full bg-black border-gray-800 overflow-hidden">
      <CardContent className="p-0 h-full">
        <div className="h-full w-full flex items-center justify-center bg-black/40 relative">
          <SimpleAgentAvatar compact={true} />
        </div>
      </CardContent>
    </Card>
  );
}
