# 4g3n7 - Secure Trading Agent in TEE

This project combines a Next.js 15 frontend with a Marlin CVM (Confidential Virtual Machine) backend to create a secure, attested trading agent system. The agent runs in a Trusted Execution Environment (TEE) with cryptographic verification.

## Architecture

### Frontend (Next.js 15)
- Modern app router architecture
- 3D Avatar with audio visualization and speech synthesis
- Real-time WebSocket communication
- Trading interface with market data visualization

### Backend (Marlin CVM)
- Node.js server running in TEE environment
- WebSocket service for real-time updates
- AgentKit integration for wallet and trading operations
- Attestation verification for security guarantees

## Getting Started

First, install dependencies:

```bash
bun install
```

Then run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

### WebSocket Integration
The project includes a complete WebSocket implementation:

- `WebSocketService.ts` - Core service for Socket.IO communication
- `WebSocketProvider.tsx` - React context provider for app-wide socket access
- UI components for displaying real-time data and connection status

### 3D Avatar
A reactive Three.js-based avatar that:
- Responds to speech with mouth animations
- Visualizes audio with waveform animations
- Changes appearance based on agent mood
- Uses audio analysis for realistic movements

### Trading Interface
- Real-time market data visualization
- Trade execution form
- Position tracking
- Transaction history

## TEE Attestation

The backend runs in a Trusted Execution Environment (TEE) using Marlin CVM:

- PCR value verification ensures code integrity
- User data digest validation for application verification
- Job ID verification for instance specificity
- Signature validation with timestamp checking

## File Structure

```
src/
├── app/              # Next.js 15 app router pages
├── components/       # React components
│   ├── 4g3n7Avatar.tsx         # 3D avatar implementation
│   ├── ui/                     # UI components
│   │   ├── RealTimeTrades.tsx  # Real-time trade display
│   │   └── WebSocketStatus.tsx # Connection status indicator
│   └── providers/
│       └── WebSocketProvider.tsx # WebSocket context provider
├── services/
│   ├── ApiClient.ts            # REST API client
│   └── WebSocketService.ts     # WebSocket client service
└── lib/
    └── avatarStore.ts          # Zustand state store
```

## Development

This project uses:
- Bun 1.2 as the JavaScript runtime
- Next.js 15 with React 19
- Three.js for 3D visualization
- Socket.IO for real-time communication
- Zustand for state management

## Deployment

For production deployment:

1. Build the application:
```bash
bun run build
```

2. Deploy to the Marlin CVM environment:
```bash
./deploy-to-marlin.sh
```

3. Verify attestation:
```bash
./verify-attestation.sh
```

## Key Technologies

- **Next.js 15** - React framework with app router
- **Three.js** - 3D visualization library
- **Socket.IO** - Real-time bidirectional communication
- **Marlin CVM** - Confidential Virtual Machine for TEE
- **AgentKit** - Framework for autonomous agents
