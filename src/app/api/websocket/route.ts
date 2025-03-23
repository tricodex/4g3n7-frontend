// src/app/api/websocket/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // This endpoint acts as a discovery service for WebSocket connections
  // Hardcoding the backend URL to port 3222 where the Docker container is running
  const backend = 'http://localhost:3222';
  
  // Return the configuration needed to connect to the backend WebSocket server
  return NextResponse.json({ 
    status: 'success',
    config: {
      url: backend,
      enabled: true,
      secure: false,
      version: '1.0.0'
    }
  });
}
