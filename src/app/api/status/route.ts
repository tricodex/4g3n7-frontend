// src/app/api/status/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Hardcode the correct backend URL
  const apiUrl = 'http://localhost:3200';
  
  try {
    // Check backend health
    const healthResponse = await fetch(`${apiUrl}/health`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    const healthData = await healthResponse.json();
    
    // Check if WebSocket is enabled
    const wsEnabled = true; // Assuming WebSocket is enabled by default
    
    return NextResponse.json({
      success: true,
      backend: {
        connected: healthResponse.ok,
        status: healthData.status,
        version: healthData.version,
        url: apiUrl
      },
      websocket: {
        enabled: wsEnabled,
        url: apiUrl,
        status: healthResponse.ok ? 'available' : 'unavailable'
      },
      attestation: {
        type: 'local',
        message: 'Using local backend with attestation simulation'
      }
    });
  } catch (error) {
    console.error('Error connecting to backend:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to backend',
      backend: {
        connected: false,
        status: 'unavailable',
        url: apiUrl
      },
      websocket: {
        enabled: false,
        status: 'unavailable',
        url: apiUrl
      }
    }, { status: 500 });
  }
}
