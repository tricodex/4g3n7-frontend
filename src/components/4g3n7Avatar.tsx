'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useAvatarStore } from '@/lib/avatarStore';
import * as THREE from 'three';

// Use a global flag for the singleton pattern instead of module-level
// This ensures it persists across hot reloads during development
if (typeof window !== 'undefined') {
  if (!window.hasOwnProperty('avatarInstanceMounted')) {
    Object.defineProperty(window, 'avatarInstanceMounted', {
      value: false,
      writable: true,
      configurable: true
    });
  }
  
  // Also store refs globally to persist them across hot reloads
  if (!window.hasOwnProperty('avatarRefs')) {
    Object.defineProperty(window, 'avatarRefs', {
      value: {
        scene: null,
        camera: null,
        renderer: null,
        animationFrame: null
      },
      writable: true,
      configurable: true
    });
  }
}

// Define types for audio data and refs
type AudioData = {
  volume: number;
  bass: number;
  mid: number;
  treble: number;
  volumeHistory: number[];
};

// Add global declaration for TypeScript
declare global {
  interface Window {
    avatarInstanceMounted: boolean;
    avatarRefs: {
      scene: THREE.Scene | null;
      camera: THREE.PerspectiveCamera | null;
      renderer: THREE.WebGLRenderer | null;
      animationFrame: number | null;
    };
  }
}

// Add global debug method for direct manipulation
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.debugAnimateMouth = (open: boolean) => {
    console.log('Debug mouth animation called:', open);
    // Will be populated by the component
  };
}

// Avatar component
const AgentAvatar = () => {
  // Use Zustand store for state management
  const { isSpeaking } = useAvatarStore();
  const mountRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode & {
    frequencyData?: Uint8Array;
    timeDomainData?: Uint8Array;
  }>(null);
  
  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const avatarRef = useRef<THREE.Group | null>(null);
  const mouthRef = useRef<THREE.Group | null>(null);
  const headRef = useRef<THREE.Mesh | null>(null);
  const upperLipRef = useRef<THREE.Mesh | null>(null);
  const lowerLipRef = useRef<THREE.Mesh | null>(null);
  const innerMouthRef = useRef<THREE.Mesh | null>(null);
  const leftEyeRef = useRef<THREE.Mesh | null>(null);
  const rightEyeRef = useRef<THREE.Mesh | null>(null);
  const energyFieldRef = useRef<THREE.Points | null>(null);
  const holoRingsRef = useRef<THREE.Group | null>(null);
  
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  
  // Local state (used in addition to Zustand store)
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  
  // Effect to sync local state with Zustand store (one-way only)
  useEffect(() => {
    console.log('4g3n7Avatar: Zustand store isSpeaking changed to', isSpeaking);
    // Only update local state from Zustand store, not vice versa
    setLocalIsPlaying(isSpeaking);
  }, [isSpeaking]); // Only depend on isSpeaking, not localIsPlaying
  const [mood, setMood] = useState<'neutral' | 'confident' | 'analytical' | 'alert'>('confident');
  
  // Sound frequency bands
  const frequencyBands = {
    bass: { from: 20, to: 250 },
    lowMid: { from: 250, to: 500 },
    mid: { from: 500, to: 2000 },
    highMid: { from: 2000, to: 4000 },
    treble: { from: 4000, to: 16000 }
  };
  
  // Audio data state
  const [audioData, setAudioData] = useState<AudioData>({
    volume: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    volumeHistory: Array(30).fill(0)
  });
  
  // Colors for different moods
  const moodColors = {
    neutral: {
      primary: 0x00aaff,
      secondary: 0x0077dd,
      emissive: 0x003366,
      particles: 0x00aaff
    },
    confident: {
      primary: 0x00ff88,
      secondary: 0x00cc66,
      emissive: 0x004422,
      particles: 0x00ff88
    },
    analytical: {
      primary: 0xff00ff,
      secondary: 0xcc00cc,
      emissive: 0x330033,
      particles: 0xff44ff
    },
    alert: {
      primary: 0xff5500,
      secondary: 0xdd4400,
      emissive: 0x331100,
      particles: 0xff7700
    }
  };

  // Connect our global debug function to directly manipulate mouth with more robust error handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Define a more robust debug function that will work even before refs are set
      // @ts-ignore
      window.debugAnimateMouth = (open: boolean) => {
        console.log('🔴 Manual mouth animation triggered:', open);
        
        // Store the state - this helps with debugging
        if (typeof window !== 'undefined') {
          // @ts-ignore
          window.__AVATAR_SPEAKING_STATE__ = open;
        }
        
        // Update Zustand store
        // This is the proper way to control the mouth through state
        if (useAvatarStore.getState().isSpeaking !== open) {
          useAvatarStore.setState({ isSpeaking: open });
        }
        
        // Also update local component state as a fallback
        setLocalIsPlaying(open);
        
        // Direct manipulation of mouth components (extreme values for visibility)
        // This is a fallback direct manipulation that bypasses state
        if (upperLipRef.current && lowerLipRef.current && innerMouthRef.current) {
          try {
            if (open) {
              // Extreme opening for visibility during testing
              upperLipRef.current.position.y = 0.3;  // More pronounced
              lowerLipRef.current.position.y = -0.4; // More pronounced
              innerMouthRef.current.scale.y = 8.0;   // More pronounced
              
              // Force the material to update
              (innerMouthRef.current.material as THREE.MeshBasicMaterial).opacity = 1.0;
              (innerMouthRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
            } else {
              upperLipRef.current.position.y = 0.05;
              lowerLipRef.current.position.y = -0.05;
              innerMouthRef.current.scale.y = 1.0;
              
              // Force the material to update
              (innerMouthRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6;
              (innerMouthRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
            }
            
            // Force the matrices to update
            upperLipRef.current.updateMatrix();
            lowerLipRef.current.updateMatrix();
            innerMouthRef.current.updateMatrix();
            
            // Log the current positions for debugging
            console.log('Mouth positions set to:', {
              upperLip: upperLipRef.current.position.y,
              lowerLip: lowerLipRef.current.position.y,
              innerMouth: innerMouthRef.current.scale.y
            });
          } catch (err) {
            console.error('Error manipulating mouth directly:', err);
          }
        } else {
          console.warn('Mouth components not yet initialized');
        }
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        window.debugAnimateMouth = () => console.log('Debug function detached');
      }
    };
  }, []);

  useEffect(() => {
    // Cancel any existing animation frames from previous renders
    if (window.avatarRefs.animationFrame) {
      cancelAnimationFrame(window.avatarRefs.animationFrame);
      window.avatarRefs.animationFrame = null;
    }
    
    // Prevent multiple instances using global flag
    if (window.avatarInstanceMounted) {
      console.warn('Avatar instance already exists. Prevented duplicate rendering.');
      return () => {};
    }
    
    // Mark instance as mounted
    window.avatarInstanceMounted = true;
    console.log('Initializing 3D Avatar - this should only happen once');
    console.log('Avatar singleton status: Instance mounting, avatarInstanceMounted =', window.avatarInstanceMounted);
    
    // Initialize the scene
    const initialize = () => {
      console.log('Initializing 4g3n7 Avatar - Agent ready to respond to VoiceButton events');
      // Setup scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050510);
      scene.fog = new THREE.FogExp2(0x050510, 0.001);
      sceneRef.current = scene;
      
      // Setup camera - using non-null assertion since we check mountRef.current exists
      if (!mountRef.current) return;
      
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 5;
      camera.position.y = 0.5;
      cameraRef.current = camera;
      
      // Setup renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      
      // Add grid for spatial awareness
      const grid = new THREE.GridHelper(20, 20, 0x004488, 0x002244);
      grid.position.y = -2.5;
      (grid.material as THREE.Material).opacity = 0.15;
      (grid.material as THREE.Material).transparent = true;
      scene.add(grid);
      
      // Setup lighting
      setupLights();
      
      // Create avatar
      createAvatar();
      
      // Set up audio
      setupAudio();
      
      // Apply initial mood
      applyMood('confident');
      
      // Setup resize handler
      const handleResize = () => {
        if (mountRef.current && cameraRef.current && rendererRef.current) {
          const width = mountRef.current.clientWidth;
          const height = mountRef.current.clientHeight;
          
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Animation loop
      const animate = () => {
        window.avatarRefs.animationFrame = requestAnimationFrame(animate);
        
        if (cameraRef.current && rendererRef.current && sceneRef.current) {
          const delta = clockRef.current.getDelta();
          const elapsedTime = clockRef.current.getElapsedTime();
          
          // Debug animation frame
          if (elapsedTime % 5 < 0.1) { // Log every ~5 seconds
            console.log('4g3n7Avatar: Animation frame running, time:', elapsedTime.toFixed(2));
            console.log('4g3n7Avatar: isPlaying states:', { zustand: isSpeaking, local: localIsPlaying });
          }
          
          // Update avatar animations
          updateAvatarAnimation(delta, elapsedTime);
          
          // Update audio analysis if available
          if (analyserRef.current) {
            updateAudioAnalysis();
          }
          
          // Render the scene
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        } else {
          console.warn('4g3n7Avatar: Missing required refs for animation');
        }
      };
      
      // Start animation loop
      console.log('4g3n7Avatar: Starting animation loop');
      animate();
    };
    
    initialize();
    
    return () => {
      console.log('Avatar cleanup triggered');
      
      // Cancel animation frame
      if (window.avatarRefs.animationFrame) {
        cancelAnimationFrame(window.avatarRefs.animationFrame);
        window.avatarRefs.animationFrame = null;
      }
      
      // Remove renderer from DOM
      if (mountRef.current && rendererRef.current) {
        try {
          mountRef.current.removeChild(rendererRef.current.domElement);
        } catch (error) {
          console.error("Error during cleanup:", error);
        }
      }
      
      // Reset the singleton flag when unmounted
      window.avatarInstanceMounted = false;
      console.log('Avatar singleton status: Instance unmounted, avatarInstanceMounted =', window.avatarInstanceMounted);
      
      // Reset all global refs
      window.avatarRefs.scene = null;
      window.avatarRefs.camera = null;
      window.avatarRefs.renderer = null;
      
      // Clean up audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Legacy event listeners to handle events for backward compatibility
  // without triggering updates to the Zustand store
  useEffect(() => {
    console.log('4g3n7Avatar: Setting up legacy speech event listeners');
    
    // Keep state flag to prevent duplicate events
    let legacyIsPlaying = false;
    
    const handleSpeechStart = (e) => {
      console.log('4g3n7Avatar: Received speechstart event from legacy system', e);
      if (!legacyIsPlaying) {
        legacyIsPlaying = true;
        // Only update local component state, not Zustand (to avoid cycles)
        setLocalIsPlaying(true);
        
        // Manually simulate audio analysis since we might not get real audio data
        setAudioData(prev => ({
          ...prev,
          volume: 0.4 + Math.random() * 0.3,
          bass: 0.5 + Math.random() * 0.3,
          mid: 0.4 + Math.random() * 0.3,
          treble: 0.3 + Math.random() * 0.2
        }));
      }
    };
    
    const handleSpeechEnd = () => {
      console.log('4g3n7Avatar: Received speechend event from legacy system');
      if (legacyIsPlaying) {
        legacyIsPlaying = false;
        // Only update local component state, not Zustand (to avoid cycles)
        setLocalIsPlaying(false);
      }
    };
    
    // Listen for legacy event types for backward compatibility
    window.addEventListener('speechstart', handleSpeechStart);
    window.addEventListener('speechend', handleSpeechEnd);
    
    // Also listen for message events
    const handleMessage = (event) => {
      if (event.data === 'speechstart') {
        handleSpeechStart(event);
      } else if (event.data === 'speechend') {
        handleSpeechEnd();
      }
    };
    window.addEventListener('message', handleMessage);
    
    return () => {
      console.log('4g3n7Avatar: Removing speech event listeners');
      window.removeEventListener('speechstart', handleSpeechStart);
      window.removeEventListener('speechend', handleSpeechEnd);
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  // Setup lighting system
  const setupLights = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x111122, 0.5);
    scene.add(ambientLight);
    
    // Main directional light with shadows
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.bias = -0.0001;
    
    // Adjust shadow camera frustum
    const shadowSize = 10;
    mainLight.shadow.camera.left = -shadowSize;
    mainLight.shadow.camera.right = shadowSize;
    mainLight.shadow.camera.top = shadowSize;
    mainLight.shadow.camera.bottom = -shadowSize;
    
    scene.add(mainLight);
    
    // Front light for better facial visibility
    const frontLight = new THREE.SpotLight(0x3498db, 0.8);
    frontLight.position.set(0, 1, 8);
    frontLight.angle = Math.PI / 6;
    frontLight.penumbra = 0.2;
    frontLight.distance = 20;
    frontLight.decay = 2;
    scene.add(frontLight);
    
    // Rim light for edge definition
    const rimLight = new THREE.PointLight(0x00aaff, 0.6, 20);
    rimLight.position.set(-5, 2, -5);
    rimLight.castShadow = true;
    rimLight.shadow.mapSize.width = 1024;
    rimLight.shadow.mapSize.height = 1024;
    scene.add(rimLight);
    
    // Bottom light for subtle upward illumination
    const bottomLight = new THREE.PointLight(0x001133, 0.3, 10);
    bottomLight.position.set(0, -3, 2);
    scene.add(bottomLight);
  };
  
  // Create the avatar model
  const createAvatar = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    // Create avatar group
    const avatar = new THREE.Group();
    scene.add(avatar);
    avatarRef.current = avatar;
    
    // Create head
    const headGeometry = new THREE.SphereGeometry(1, 64, 64);
    
    // Add subtle noise displacement to the head
    const vertexDisplacement = new Float32Array(headGeometry.attributes.position.count);
    for (let i = 0; i < vertexDisplacement.length; i++) {
      vertexDisplacement[i] = 0.02 * (Math.random() - 0.5);
    }
    headGeometry.setAttribute('displacement', new THREE.BufferAttribute(vertexDisplacement, 1));
    
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x111122,
      metalness: 0.9,
      roughness: 0.3,
      emissive: 0x111122,
      envMapIntensity: 1.0
    });
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.castShadow = true;
    head.receiveShadow = true;
    avatar.add(head);
    headRef.current = head;
    
    // Create body
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 1.2, 2.5, 32, 8, true);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a1a,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x080816,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = -1.8;
    body.castShadow = true;
    body.receiveShadow = true;
    avatar.add(body);
    
    // Add inner core to the body for glow effect
    const coreGeometry = new THREE.CylinderGeometry(0.6, 1.0, 2.3, 32, 8, true);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      emissive: 0x00aaff,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 0;
    body.add(core);
    
    // Create eyes
    const eyeGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const eyeMaterial = new THREE.MeshPhongMaterial({
      color: 0x00aaff,
      emissive: 0x003366,
      specular: 0xffffff,
      shininess: 100
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.35, 0.15, 0.85);
    avatar.add(leftEye);
    leftEyeRef.current = leftEye;
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.35, 0.15, 0.85);
    avatar.add(rightEye);
    rightEyeRef.current = rightEye;
    
    // Inner eye glow
    const eyeGlowGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.7
    });
    
    const leftEyeGlow = new THREE.Mesh(eyeGlowGeometry, eyeGlowMaterial);
    leftEyeGlow.position.set(0, 0, 0.05);
    leftEye.add(leftEyeGlow);
    
    const rightEyeGlow = new THREE.Mesh(eyeGlowGeometry, eyeGlowMaterial);
    rightEyeGlow.position.set(0, 0, 0.05);
    rightEye.add(rightEyeGlow);
    
    // Create eyebrows
    createEyebrows(avatar);
    
    // Create mouth
    createMouth(avatar);
    
    // Create holographic rings
    createHolographicRings(avatar);
    
    // Create energy field
    createEnergyField(avatar);
    
    // Create shoulder pieces
    createShoulderPieces(avatar);
    
    // Add initial position offset
    avatar.position.y = 0.2;
  };
  
  // Create eyebrows for the avatar
  const createEyebrows = (avatar: THREE.Group) => {
    // Eyebrow geometry - thin, slightly curved boxes
    const eyebrowGeometry = new THREE.BoxGeometry(0.25, 0.04, 0.06);
    
    // Slightly curve the eyebrows by manipulating vertices
    for (let i = 0; i < eyebrowGeometry.attributes.position.count; i++) {
      const x = eyebrowGeometry.attributes.position.getX(i);
      // Unused but preserved for future use
      // const z = eyebrowGeometry.attributes.position.getZ(i);
      
      // Apply subtle curve
      if (eyebrowGeometry.attributes.position.getZ(i) > 0) {
        eyebrowGeometry.attributes.position.setZ(i, eyebrowGeometry.attributes.position.getZ(i) + 0.01);
      }
    }
    
    const eyebrowMaterial = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      emissive: 0x003366,
      emissiveIntensity: 0.3,
    });
    
    // Left eyebrow
    const leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    leftEyebrow.position.set(-0.35, 0.4, 0.85);
    leftEyebrow.rotation.z = 0.1; // Slight tilt
    avatar.add(leftEyebrow);
    
    // Right eyebrow
    const rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    rightEyebrow.position.set(0.35, 0.4, 0.85);
    rightEyebrow.rotation.z = -0.1; // Slight tilt in opposite direction
    avatar.add(rightEyebrow);
    
    // Store original positions for animations
    leftEyebrow.userData = {
      originalPosition: {
        y: leftEyebrow.position.y,
        rotationZ: leftEyebrow.rotation.z
      }
    };
    
    rightEyebrow.userData = {
      originalPosition: {
        y: rightEyebrow.position.y,
        rotationZ: rightEyebrow.rotation.z
      }
    };
  };
  
  // Create the mouth with advanced features
  const createMouth = (avatar: THREE.Group) => {
    // Main mouth group
    const mouth = new THREE.Group();
    mouth.position.set(0, -0.4, 0.85);
    avatar.add(mouth);
    mouthRef.current = mouth;
    
    // Upper lip
    const upperLipGeometry = new THREE.BoxGeometry(0.5, 0.08, 0.1);
    const lowerLipGeometry = new THREE.BoxGeometry(0.5, 0.08, 0.1);
    
    const lipMaterial = new THREE.MeshPhongMaterial({
      color: 0x00aaff,
      emissive: 0x003366,
      specular: 0x006699
    });
    
    const upperLip = new THREE.Mesh(upperLipGeometry, lipMaterial);
    upperLip.position.y = 0.05;
    mouth.add(upperLip);
    upperLipRef.current = upperLip;
    
    const lowerLip = new THREE.Mesh(lowerLipGeometry, lipMaterial);
    lowerLip.position.y = -0.05;
    mouth.add(lowerLip);
    lowerLipRef.current = lowerLip;
    
    // Inner mouth glow
    const innerMouthGeometry = new THREE.PlaneGeometry(0.45, 0.1);
    const innerMouthMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    
    const innerMouth = new THREE.Mesh(innerMouthGeometry, innerMouthMaterial);
    innerMouth.position.z = 0.01;
    mouth.add(innerMouth);
    innerMouthRef.current = innerMouth;
  };
  
  // Create energy field ABOVE the avatar (sound waves)
  const createEnergyField = (avatar: THREE.Group) => {
    const energyCount = 300;
    const energyGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(energyCount * 3);
    const energySizes = new Float32Array(energyCount);
    
    for (let i = 0; i < energyCount; i++) {
      const i3 = i * 3;
      // New distribution for particles positioned mostly above the head
      // Use disc-shaped distribution above the head
      const radius = 0.5 + Math.random() * 2.0; // Horizontal spread
      const theta = Math.random() * Math.PI * 2; // Around the head
      const height = 1.5 + Math.random() * 1.5; // Above the head
      
      positions[i3] = radius * Math.cos(theta); // X position
      positions[i3 + 1] = height; // Y position - now above the head
      positions[i3 + 2] = radius * Math.sin(theta); // Z position
      
      energySizes[i] = 0.1 + Math.random() * 0.15;
    }
    
    energyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    energyGeometry.setAttribute('size', new THREE.BufferAttribute(energySizes, 1));
    
    const energyMaterial = new THREE.PointsMaterial({
      color: 0x00ddff,
      size: 0.15,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    const energyField = new THREE.Points(energyGeometry, energyMaterial);
    avatar.add(energyField);
    energyFieldRef.current = energyField;
    
    // Store original positions for animations
    energyField.userData = {
      originalPositions: positions.slice(),
      sizes: energySizes.slice(),
      animationTime: 0
    };
  };

  // Create holographic rings animation
  const createHolographicRings = (avatar: THREE.Group) => {
    // Create container group for all rings
    const holoRings = new THREE.Group();
    avatar.add(holoRings);
    holoRingsRef.current = holoRings;
    
    // Create multiple rings with different properties
    for (let i = 0; i < 5; i++) {
      const radius = 1.2 + i * 0.35;
      const ringGeometry = new THREE.TorusGeometry(radius, 0.03, 16, 100);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0x00aaff,
        emissive: 0x003366,
        transparent: true,
        opacity: 0.2 + (5-i) * 0.1,
        side: THREE.DoubleSide
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -1.5;
      holoRings.add(ring);
      
      // Store animation properties
      ring.userData = {
        rotationSpeed: 0.002 + i * 0.001,
        pulseSpeed: 0.01 + i * 0.005,
        pulseTime: Math.random() * Math.PI * 2,
        baseOpacity: 0.2 + (5-i) * 0.1,
        initialRotation: {
          x: Math.PI / 2,
          y: 0,
          z: Math.random() * Math.PI * 2
        }
      };
    }
    
    // Add data ring
    createDataRing(avatar);
  };
  
  // Create a spinning data ring with markers
  const createDataRing = (avatar: THREE.Group) => {
    const dataRing = new THREE.Group();
    dataRing.position.y = -1.7;
    avatar.add(dataRing);
    
    // Main ring
    const ringGeometry = new THREE.TorusGeometry(2.2, 0.05, 8, 128);
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: 0x00aaff,
      emissive: 0x003366,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    dataRing.add(ring);
    
    // Add data markers around the ring
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const markerGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const markerMaterial = new THREE.MeshPhongMaterial({
        color: i % 3 === 0 ? 0x00ffff : 0x0088cc,
        emissive: i % 3 === 0 ? 0x00aaaa : 0x005577
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.x = 2.2 * Math.cos(angle);
      marker.position.z = 2.2 * Math.sin(angle);
      marker.scale.y = 0.5 + Math.random() * 1.5; // Varying heights
      
      dataRing.add(marker);
      
      // Store animation data
      marker.userData = {
        pulseSpeed: 0.05 + Math.random() * 0.1,
        pulseTime: Math.random() * Math.PI * 2,
        originalScale: marker.scale.y
      };
    }
    
    // Add animation properties
    dataRing.userData = {
      rotationSpeed: 0.005
    };
  };
  
  // Create shoulder pieces for more complex body shape
  const createShoulderPieces = (avatar: THREE.Group) => {
    const shoulderGeometry = new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const shoulderMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a1a,
      metalness: 0.9,
      roughness: 0.2
    });
    
    // Left shoulder
    const leftShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
    leftShoulder.position.set(-0.8, -1.0, 0);
    leftShoulder.rotation.z = -Math.PI / 2;
    leftShoulder.scale.z = 1.2;
    leftShoulder.castShadow = true;
    avatar.add(leftShoulder);
    
    // Right shoulder
    const rightShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
    rightShoulder.position.set(0.8, -1.0, 0);
    rightShoulder.rotation.z = Math.PI / 2;
    rightShoulder.scale.z = 1.2;
    rightShoulder.castShadow = true;
    avatar.add(rightShoulder);
    
    // Add glowing shoulder accents
    const accentGeometry = new THREE.CircleGeometry(0.15, 16);
    const accentMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const leftAccent = new THREE.Mesh(accentGeometry, accentMaterial);
    leftAccent.position.set(-0.1, 0, 0.25);
    leftAccent.rotation.y = Math.PI / 2;
    leftShoulder.add(leftAccent);
    
    const rightAccent = new THREE.Mesh(accentGeometry, accentMaterial);
    rightAccent.position.set(0.1, 0, 0.25);
    rightAccent.rotation.y = -Math.PI / 2;
    rightShoulder.add(rightAccent);
  };
  
  // Setup audio system
  const setupAudio = () => {
    try {
      const audioContext = new (window.AudioContext || window.AudioContext)();
      audioContextRef.current = audioContext;
      
      // Create analyzer node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048; // for detailed frequency analysis
      analyser.smoothingTimeConstant = 0.8;
      
      // Connect analyzer to destination
      analyser.connect(audioContext.destination);
      analyserRef.current = analyser;
      
      // Set up event listeners to react to speech from the VoiceButton component
      // The TTS library should output to the default audio destination, which our analyzer is connected to
      
      console.log('Audio system initialized for 4g3n7 avatar');
    } catch (error) {
      console.error('Web Audio API is not supported in this browser', error);
    }
  };
  
  // Apply mood to avatar
  const applyMood = (mood: 'neutral' | 'confident' | 'analytical' | 'alert') => {
    // Get colors for the new mood
    const colors = moodColors[mood] || moodColors.neutral;
    
    // Apply to eyes
    if (leftEyeRef.current && rightEyeRef.current) {
      (leftEyeRef.current.material as THREE.MeshPhongMaterial).color.setHex(colors.primary);
      (leftEyeRef.current.material as THREE.MeshPhongMaterial).emissive.setHex(colors.emissive);
      (rightEyeRef.current.material as THREE.MeshPhongMaterial).color.setHex(colors.primary);
      (rightEyeRef.current.material as THREE.MeshPhongMaterial).emissive.setHex(colors.emissive);
      
      // Apply to eye glows
      if (leftEyeRef.current.children[0]) {
        ((leftEyeRef.current.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).color.setHex(colors.primary);
      }
      if (rightEyeRef.current.children[0]) {
        ((rightEyeRef.current.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).color.setHex(colors.primary);
      }
    }
    
    // Apply to mouth parts
    if (upperLipRef.current && lowerLipRef.current && innerMouthRef.current) {
      (upperLipRef.current.material as THREE.MeshPhongMaterial).color.setHex(colors.primary);
      (upperLipRef.current.material as THREE.MeshPhongMaterial).emissive.setHex(colors.emissive);
      (lowerLipRef.current.material as THREE.MeshPhongMaterial).color.setHex(colors.primary);
      (lowerLipRef.current.material as THREE.MeshPhongMaterial).emissive.setHex(colors.emissive);
      (innerMouthRef.current.material as THREE.MeshBasicMaterial).color.setHex(colors.primary);
    }
    
    // Apply to energy field
    if (energyFieldRef.current) {
      (energyFieldRef.current.material as THREE.PointsMaterial).color.setHex(colors.primary);
    }
    
    // Apply to holographic rings
    if (holoRingsRef.current) {
      holoRingsRef.current.children.forEach(ring => {
        if ((ring as THREE.Mesh).material) {
          ((ring as THREE.Mesh).material as THREE.MeshPhongMaterial).color.setHex(colors.primary);
          ((ring as THREE.Mesh).material as THREE.MeshPhongMaterial).emissive.setHex(colors.emissive);
        }
      });
    }
    
    setMood(mood);
  };
  
  // Update avatar animations
  const updateAvatarAnimation = (delta: number, time: number) => {
    // Only log speaking state on changes to reduce console spam
    if (time % 30 < 0.01) { // Reduced to every 30 seconds to avoid log flooding
      console.log('Animation frame check - speaking states:', { isSpeaking, localIsPlaying });
      
      // Force animation in animation frame if we're supposed to be speaking
      if ((isSpeaking || localIsPlaying) && upperLipRef.current && lowerLipRef.current && innerMouthRef.current) {
        console.log('Animation frame: forcing mouth animation in update loop');
        const lipPosition = 0.05 + Math.sin(time * 10) * 0.2;
        upperLipRef.current.position.y = lipPosition;
        lowerLipRef.current.position.y = -lipPosition;
        innerMouthRef.current.scale.y = 1 + Math.abs(Math.sin(time * 10)) * 4;
      }
    }
    if (avatarRef.current) {
      const avatar = avatarRef.current;
      
      // Base hover animation
      avatar.position.y = 0.2 + Math.sin(time * 0.8) * 0.05;
      
      // Head idle rotation if not speaking
      if (!(isSpeaking || localIsPlaying)) {
        if (headRef.current) {
          const headTiltX = Math.sin(time * 0.4) * 0.03;
          const headTiltY = Math.sin(time * 0.3) * 0.03;
          
          headRef.current.rotation.x = headTiltX;
          headRef.current.rotation.y = headTiltY;
        }
      }
      
      // Mouth idle animation when not speaking
      if (!(isSpeaking || localIsPlaying)) {
        if (upperLipRef.current && lowerLipRef.current && innerMouthRef.current) {
          const mouthGap = Math.sin(time * 2) * 0.02;
          if (mouthGap > 0) {
            upperLipRef.current.position.y = 0.05 + mouthGap * 0.3;
            lowerLipRef.current.position.y = -0.05 - mouthGap * 0.7;
            innerMouthRef.current.scale.y = mouthGap * 10 + 1;
          }
        }
      }
      
      // Update holographic rings
      updateHolographicRings(delta, time);
      
      // Update energy field
      updateEnergyField(delta, time);
      
      // Mood-specific animations
      updateMoodAnimations(delta, time);
    }
  };
  
  // Update holographic rings animation
  const updateHolographicRings = (delta: number, time: number) => {
    if (holoRingsRef.current) {
      // Animate main rings
      holoRingsRef.current.children.forEach((ring: THREE.Object3D) => {
        if (ring.userData) {
          // Rotate rings at different speeds
          ring.rotation.z += ring.userData.rotationSpeed;
          
          // Pulse animation
          ring.userData.pulseTime += ring.userData.pulseSpeed;
          const pulseFactor = Math.sin(ring.userData.pulseTime);
          
          // Scale and opacity variation
          const scale = 1 + pulseFactor * 0.1;
          ring.scale.set(scale, scale, 1);
          
          // Adjust opacity based on mood
          if (mood === 'alert') {
            ((ring as THREE.Mesh).material as THREE.MeshPhongMaterial).opacity = 
              ring.userData.baseOpacity * (0.7 + Math.abs(pulseFactor) * 0.5);
          } else {
            ((ring as THREE.Mesh).material as THREE.MeshPhongMaterial).opacity = 
              ring.userData.baseOpacity * (0.7 + pulseFactor * 0.3);
          }
        }
      });
    }
  };
  
  // Update energy field animation - sound waves above the avatar
  const updateEnergyField = (delta: number, time: number) => {
    if (energyFieldRef.current && energyFieldRef.current.userData) {
      const energyField = energyFieldRef.current;
      energyField.userData.animationTime += delta;
      
      const positions = energyField.geometry.attributes.position.array;
      const originalPositions = energyField.userData.originalPositions;
      const sizes = energyField.geometry.attributes.size.array;
      
      // Use different animation behavior based on speaking state
      const isSpeakingNow = isSpeaking || localIsPlaying;
      
      for (let i = 0; i < positions.length; i += 3) {
        const i3 = i;
        
        // Get original position
        const x = originalPositions[i3];
        const y = originalPositions[i3 + 1];
        const z = originalPositions[i3 + 2];
        
        // Calculate horizontal distance (for wave effect)
        const horizontalRadius = Math.sqrt(x*x + z*z);
        
        if (isSpeakingNow) {
          // More active waves when speaking
          // Create sound wave visualization that emanates from center
          // Higher frequency waves based on audio properties
          const waveOffset = Math.sin(horizontalRadius * 3 - time * 6) * 0.2;
          const verticalOffset = Math.sin(time * 8 + horizontalRadius * 4) * 0.2;
          
          // Apply wave effect mostly to Y (up/down) for sound waves
          positions[i3] = originalPositions[i3] * (1 + waveOffset * 0.2);
          positions[i3 + 1] = originalPositions[i3 + 1] + verticalOffset; // Up-down motion
          positions[i3 + 2] = originalPositions[i3 + 2] * (1 + waveOffset * 0.2);
          
          // Make sizes more reactive when speaking
          sizes[i/3] = energyField.userData.sizes[i/3] * (
            1.5 + audioData.bass * 2 + 
            Math.sin(time * 10 + i * 0.1) * 0.5
          );
        } else {
          // Gentle idle animation when not speaking
          const idleWave = Math.sin(horizontalRadius * 1.5 - time * 1.5) * 0.1;
          const idleVertical = Math.sin(time * 2 + horizontalRadius * 2) * 0.05;
          
          positions[i3] = originalPositions[i3] * (1 + idleWave * 0.1);
          positions[i3 + 1] = originalPositions[i3 + 1] + idleVertical; // Subtle up-down motion
          positions[i3 + 2] = originalPositions[i3 + 2] * (1 + idleWave * 0.1);
          
          // Regular sizes when not speaking
          sizes[i/3] = energyField.userData.sizes[i/3] * (0.7 + Math.sin(time * 2 + i) * 0.15);
        }
      }
      
      energyField.geometry.attributes.position.needsUpdate = true;
      energyField.geometry.attributes.size.needsUpdate = true;
      
      // Adjust opacity based on speaking state and mood
      let targetOpacity = 0.5; // Base opacity
      
      if (isSpeakingNow) {
        // Higher opacity when speaking
        targetOpacity = 0.8 + Math.sin(time * 4) * 0.15;
      } else {
        // Lower opacity when idle
        targetOpacity = 0.3 + Math.sin(time * 2) * 0.1;
      }
      
      // Mood-specific adjustments
      if (mood === 'confident') {
        targetOpacity *= 1.2; // Brighter for confident mood
      } else if (mood === 'alert') {
        targetOpacity = 0.7 + Math.abs(Math.sin(time * 6)) * 0.3; // Pulsing for alert mood
      }
      
      // Apply opacity with smooth transition
      const currentOpacity = (energyField.material as THREE.PointsMaterial).opacity;
      (energyField.material as THREE.PointsMaterial).opacity = 
        THREE.MathUtils.lerp(currentOpacity, targetOpacity, 0.1);
    }
  };
  
  // Update mood-specific animations
  const updateMoodAnimations = (delta: number, time: number) => {
    switch(mood) {
      case 'confident':
        // Subtle upward tilt and smooth rotation
        if (headRef.current) {
          const confidentTilt = Math.sin(time * 0.5) * 0.02 - 0.01;
          headRef.current.rotation.x = confidentTilt;
        }
        
        // Enhanced energy field animation
        if (energyFieldRef.current) {
          (energyFieldRef.current.material as THREE.PointsMaterial).size = 0.15 + Math.sin(time * 2) * 0.05;
        }
        break;
        
      case 'analytical':
        // Eye pulsing for analytical mood
        if (leftEyeRef.current && rightEyeRef.current) {
          const analyticScale = 1 + Math.sin(time * 5) * 0.1;
          if (leftEyeRef.current.children[0]) {
            (leftEyeRef.current.children[0] as THREE.Mesh).scale.setScalar(analyticScale);
          }
          if (rightEyeRef.current.children[0]) {
            (rightEyeRef.current.children[0] as THREE.Mesh).scale.setScalar(analyticScale);
          }
        }
        
        // Head slightly tilted
        if (headRef.current) {
          headRef.current.rotation.z = Math.sin(time * 0.3) * 0.01 + 0.02;
        }
        break;
        
      case 'alert':
        // Quick movements and occasional "blinks"
        if (leftEyeRef.current && rightEyeRef.current) {
          if (Math.sin(time * 3) > 0.97) {
            leftEyeRef.current.scale.y = 0.2;
            rightEyeRef.current.scale.y = 0.2;
          } else {
            leftEyeRef.current.scale.y = 1;
            rightEyeRef.current.scale.y = 1;
          }
        }
        
        // Alert head movement - more jittery
        if (headRef.current) {
          headRef.current.rotation.y = Math.sin(time * 2) * 0.05;
          headRef.current.rotation.x = Math.sin(time * 2.2) * 0.03;
        }
        break;
        
      case 'neutral':
      default:
        // Subtle eye glow pulsing
        if (leftEyeRef.current && rightEyeRef.current) {
          const neutralPulse = 1 + Math.sin(time * 2) * 0.1;
          if (leftEyeRef.current.children[0]) {
            (leftEyeRef.current.children[0] as THREE.Mesh).scale.setScalar(neutralPulse);
          }
          if (rightEyeRef.current.children[0]) {
            (rightEyeRef.current.children[0] as THREE.Mesh).scale.setScalar(neutralPulse);
          }
        }
        break;
    }
  };
  
  // Process audio data and update visuals
  const updateAudioAnalysis = () => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    
    // Create data arrays if they don't exist
    if (!analyser.frequencyData) {
      analyser.frequencyData = new Uint8Array(analyser.frequencyBinCount);
    }
    
    if (!analyser.timeDomainData) {
      analyser.timeDomainData = new Uint8Array(analyser.frequencyBinCount);
    }
    
    // Get frequency and time domain data
    analyser.getByteFrequencyData(analyser.frequencyData);
    analyser.getByteTimeDomainData(analyser.timeDomainData);
    
    // Calculate audio metrics
    const metrics = calculateAudioMetrics(analyser);
    
    // Update audio data with smoothing
    const smoothingFactor = 0.2;
    const newAudioData = {
      volume: (1 - smoothingFactor) * audioData.volume + smoothingFactor * metrics.volume,
      bass: (1 - smoothingFactor) * audioData.bass + smoothingFactor * metrics.bass,
      mid: (1 - smoothingFactor) * audioData.mid + smoothingFactor * metrics.mid,
      treble: (1 - smoothingFactor) * audioData.treble + smoothingFactor * metrics.treble,
      volumeHistory: [...audioData.volumeHistory, metrics.volume].slice(-30) // Keep last 30 values
    };
    
    setAudioData(newAudioData);
    
    // Animate avatar based on audio
    animateAvatarWithAudio(analyser, newAudioData);
  };
  
  // Calculate detailed audio metrics
  const calculateAudioMetrics = (analyser: AnalyserNode & { frequencyData?: Uint8Array }) => {
    const frequencyData = analyser.frequencyData as Uint8Array;
    const bufferLength = frequencyData.length;
    
    // Calculate overall volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += frequencyData[i];
    }
    const volume = sum / (bufferLength * 256); // Normalize to 0-1
    
    // Calculate frequency bands
    const sampleRate = audioContextRef.current!.sampleRate;
    const fftSize = analyser.fftSize;
    const getBandValue = (low: number, high: number) => {
      const lowIndex = Math.floor(low * fftSize / sampleRate);
      const highIndex = Math.ceil(high * fftSize / sampleRate);
      
      let bandSum = 0;
      let count = 0;
      
      for (let i = lowIndex; i <= highIndex && i < bufferLength; i++) {
        bandSum += frequencyData[i];
        count++;
      }
      
      return count > 0 ? bandSum / (count * 256) : 0; // Normalize to 0-1
    };
    
    // Return all metrics
    return {
      volume: volume,
      bass: getBandValue(frequencyBands.bass.from, frequencyBands.bass.to),
      mid: getBandValue(frequencyBands.mid.from, frequencyBands.mid.to),
      treble: getBandValue(frequencyBands.treble.from, frequencyBands.treble.to)
    };
  };
  
  // Update audio visualizer - this function is no longer needed but we'll keep an empty version
  // in case it's still called somewhere
  const updateVisualizer = (analyser: AnalyserNode & { 
    frequencyData?: Uint8Array; 
    timeDomainData?: Uint8Array 
  }, audioData: AudioData) => {
    // We don't need canvas visualization anymore
    return;
  };
  
  // Animate avatar based on audio input
  const animateAvatarWithAudio = (analyser: AnalyserNode & { 
    timeDomainData?: Uint8Array 
  }, audioData: AudioData) => {
    const { volume, bass, mid, treble } = audioData;
    
    // Get time domain data for speech pattern analysis
    const timeDomainData = analyser.timeDomainData as Uint8Array;
    
    // Calculate speech intensity from waveform
    let speechIntensity = 0;
    let speechCadence = 0;
    
    if (timeDomainData) {
      let sum = 0;
      let changes = 0;
      let lastValue = 128;
      
      for (let i = 0; i < timeDomainData.length; i += 2) {
        const value = timeDomainData[i];
        // Calculate deviation from center (128)
        const deviation = Math.abs(value - 128);
        sum += deviation;
        
        // Count zero crossings for cadence detection
        if ((lastValue < 128 && value >= 128) || (lastValue > 128 && value <= 128)) {
          changes++;
        }
        lastValue = value;
      }
      
      // Normalize and amplify
      speechIntensity = sum / (timeDomainData.length / 2) / 128;
      speechCadence = changes / (timeDomainData.length / 100);
    }
    
    // Animate mouth based on volume and speech patterns or isPlaying state
    animateMouth(volume, speechIntensity);
    
    // Eyes with subtle constant glow
    if (leftEyeRef.current && rightEyeRef.current) {
      if (leftEyeRef.current.children[0] && rightEyeRef.current.children[0]) {
        // Just a subtle constant glow
        (leftEyeRef.current.children[0] as THREE.Mesh).scale.setScalar(1.1);
        (rightEyeRef.current.children[0] as THREE.Mesh).scale.setScalar(1.1);
      }
    }
    
    // Head movements based on speech state
    if (headRef.current) {
      // Use a simulated speechIntensity if we're playing but don't have audio data
      const effectiveIntensity = (isSpeaking || localIsPlaying) && speechIntensity < 0.05 ? 0.08 : speechIntensity;
      
      if (effectiveIntensity > 0.05) {
        const headTurnFactor = 0.12 * effectiveIntensity;
        const headTiltFactor = 0.06 * effectiveIntensity;
        
        const time = Date.now() * 0.001;
        headRef.current.rotation.y = Math.sin(time * (0.002 + speechCadence * 0.001)) * headTurnFactor;
        headRef.current.rotation.x = Math.cos(time * (0.0015 + speechCadence * 0.0005)) * headTiltFactor;
      }
    }
  };
  
  // Animate mouth based on audio with enhanced responsiveness
  const animateMouth = (volume: number, speechIntensity: number) => {
    if (!mouthRef.current || !upperLipRef.current || !lowerLipRef.current || !innerMouthRef.current) {
      return;
    }
    
    // Only log animation calls when speaking state changes to reduce spam
    if (isSpeaking || localIsPlaying) {
      console.log('Animate mouth - speaking:', { volume, speechIntensity, isSpeaking, localIsPlaying });
    }
    
    // Use the Zustand store or local state to control mouth animation
    let effectiveIntensity = speechIntensity;
    
    // If we're supposed to be speaking but don't have audio data yet, simulate it
    if (isSpeaking || localIsPlaying) {
      // Simulate a more dynamic talking motion
      const time = Date.now() * 0.001;
      // Use a combination of sine waves at different frequencies for more natural movement
      effectiveIntensity = Math.max(0.2, 
        0.3 + Math.sin(time * 15) * 0.15 + 
        Math.sin(time * 7.3) * 0.12 + 
        Math.sin(time * 3.7) * 0.08
      );
    }
    
    // Combined intensity with higher emphasis on speech patterns
    const combinedIntensity = volume * 0.25 + effectiveIntensity * 0.85;
    
    // Apply enhanced logarithmic scaling for more pronounced movement
    const mouthOpenValue = combinedIntensity > 0.01 ? (Math.log10(1 + combinedIntensity * 20) * 1.2) : 0;
    
    // Set distance parameters with increased range
    const minDistance = 0.02;
    const maxDistance = 0.55; // Increased for more pronounced movement
    
    // Calculate lip positions with more separation
    const lipsDistance = minDistance + (maxDistance - minDistance) * mouthOpenValue;
    const upperPos = 0.05 + lipsDistance * 0.45; // Increased upper lip movement
    const lowerPos = -0.05 - lipsDistance * 0.85; // Increased lower lip movement
    
    // Apply faster responsiveness with higher lerp factor
    upperLipRef.current.position.y = THREE.MathUtils.lerp(upperLipRef.current.position.y, upperPos, 0.7);
    lowerLipRef.current.position.y = THREE.MathUtils.lerp(lowerLipRef.current.position.y, lowerPos, 0.7);
    
    // Enhanced horizontal lip movement for more expressive speech
    if (effectiveIntensity > 0.05 || isSpeaking || localIsPlaying) { // Lower threshold for more movement
      const lipXOffset = Math.sin(Date.now() * 0.015) * 0.03 * Math.max(0.3, effectiveIntensity);
      upperLipRef.current.position.x = lipXOffset * 0.7;
      lowerLipRef.current.position.x = lipXOffset;
    } else {
      // Return to center when not speaking
      upperLipRef.current.position.x = THREE.MathUtils.lerp(upperLipRef.current.position.x, 0, 0.2);
      lowerLipRef.current.position.x = THREE.MathUtils.lerp(lowerLipRef.current.position.x, 0, 0.2);
    }
    
    // Inner mouth scale based on opening - more pronounced
    const mouthHeight = Math.max(0.02, lipsDistance * 15); // Increased scaling
    innerMouthRef.current.scale.y = THREE.MathUtils.lerp(innerMouthRef.current.scale.y, mouthHeight, 0.7);
    
    // Make inner mouth wider during speech - more pronounced
    innerMouthRef.current.scale.x = 1 + mouthOpenValue * 0.5; // Increased width scaling
    
    // Center the inner mouth between the lips
    innerMouthRef.current.position.y = (upperLipRef.current.position.y + lowerLipRef.current.position.y) / 2;
    
    // Enhance inner mouth visibility during speech
    (innerMouthRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + mouthOpenValue * 0.6;
  };
  
  return (
    <div className="flex w-full h-full">
      <div className="w-full h-full">
        <div className="w-full h-full" ref={mountRef}></div>
      </div>
    </div>
  );
};

// Export a memoized version to prevent unnecessary re-renders
export default React.memo(AgentAvatar);
