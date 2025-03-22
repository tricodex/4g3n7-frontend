'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Define types for audio data and refs
type AudioData = {
  volume: number;
  bass: number;
  mid: number;
  treble: number;
  volumeHistory: number[];
};

// Avatar component
const AgentAvatar = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode & {
    frequencyData?: Uint8Array;
    timeDomainData?: Uint8Array;
  }>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileReaderRef = useRef<FileReader | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
  const numberParticlesRef = useRef<THREE.Points | null>(null);
  
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  
  const [isUsingMicrophone, setIsUsingMicrophone] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState('System ready');
  const [isError, setIsError] = useState(false);
  const [mood, setMood] = useState<'neutral' | 'confident' | 'analytical' | 'alert'>('confident');
  const [mode, setMode] = useState<'default' | 'trading'>('default');
  
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

  useEffect(() => {
    let animationFrameId: number = 0;
    
    // Initialize the scene
    const initialize = () => {
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
      
      // Setup audio visualizer
      setupVisualizer();
      
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
        animationFrameId = requestAnimationFrame(animate);
        
        if (cameraRef.current && rendererRef.current && sceneRef.current) {
          const delta = clockRef.current.getDelta();
          const elapsedTime = clockRef.current.getElapsedTime();
          
          // Update avatar animations
          updateAvatarAnimation(delta, elapsedTime);
          
          // Update audio analysis
          updateAudioAnalysis();
          
          // Render the scene
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      
      animate();
      
      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        if (mountRef.current && rendererRef.current) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
      };
    };
    
    initialize();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && rendererRef.current) {
        try {
          mountRef.current.removeChild(rendererRef.current.domElement);
        } catch (error) {
          console.error("Error during cleanup:", error);
        }
      }
      
      // Clean up audio resources
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Effect to handle mode changes
  useEffect(() => {
    if (mode === 'trading') {
      setStatus('Trading mode activated');
      // Trading mode is handled in updateMoodAnimations
      
      // Move camera out slightly for better view of particles
      if (cameraRef.current) {
        // Animate camera position
        const targetZ = 6.5;
        let currentZ = cameraRef.current.position.z;
        const animate = () => {
          currentZ = currentZ + (targetZ - currentZ) * 0.05;
          if (cameraRef.current) {
            cameraRef.current.position.z = currentZ;
          }
          
          if (Math.abs(currentZ - targetZ) > 0.01) {
            requestAnimationFrame(animate);
          }
        };
        animate();
      }
    } else {
      // Default mode
      setStatus('Default mode');
      
      // Reset camera position
      if (cameraRef.current) {
        const targetZ = 5;
        let currentZ = cameraRef.current.position.z;
        const animate = () => {
          currentZ = currentZ + (targetZ - currentZ) * 0.05;
          if (cameraRef.current) {
            cameraRef.current.position.z = currentZ;
          }
          
          if (Math.abs(currentZ - targetZ) > 0.01) {
            requestAnimationFrame(animate);
          }
        };
        animate();
      }
      
      // If we have number particles, they'll be cleaned up in updateMoodAnimations
    }
  }, [mode]);
  
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
  
  // Create energy field around the avatar
  const createEnergyField = (avatar: THREE.Group) => {
    const energyCount = 300;
    const energyGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(energyCount * 3);
    const energySizes = new Float32Array(energyCount);
    
    for (let i = 0; i < energyCount; i++) {
      const i3 = i * 3;
      const radius = 1.5 + Math.random() * 1.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) - 1;  // Center around body
      positions[i3 + 2] = radius * Math.cos(phi);
      
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
      
      setStatus('Audio system initialized');
    } catch (error) {
      console.error('Web Audio API is not supported in this browser', error);
      setStatus('Audio not supported in this browser');
      setIsError(true);
    }
  };
  
  // Setup audio visualizer
  const setupVisualizer = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set canvas size
    canvas.width = 350;
    canvas.height = 60;
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
    if (avatarRef.current) {
      const avatar = avatarRef.current;
      
      // Base hover animation
      avatar.position.y = 0.2 + Math.sin(time * 0.8) * 0.05;
      
      // Head idle rotation if not speaking
      if (!isUsingMicrophone && !isPlaying) {
        if (headRef.current) {
          const headTiltX = Math.sin(time * 0.4) * 0.03;
          const headTiltY = Math.sin(time * 0.3) * 0.03;
          
          headRef.current.rotation.x = headTiltX;
          headRef.current.rotation.y = headTiltY;
        }
      }
      
      // Mouth idle animation when not speaking
      if (!isUsingMicrophone && !isPlaying) {
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
  
  // Update energy field animation
  const updateEnergyField = (delta: number, time: number) => {
    if (energyFieldRef.current && energyFieldRef.current.userData) {
      const energyField = energyFieldRef.current;
      energyField.userData.animationTime += delta;
      
      const positions = energyField.geometry.attributes.position.array;
      const originalPositions = energyField.userData.originalPositions;
      const sizes = energyField.geometry.attributes.size.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const i3 = i;
        
        // Calculate distance from center
        const x = originalPositions[i3];
        const y = originalPositions[i3 + 1];
        const z = originalPositions[i3 + 2];
        const radius = Math.sqrt(x*x + y*y + z*z);
        
        // Apply spherical wave motion
        const waveOffset = Math.sin(radius * 2 - energyField.userData.animationTime * 3) * 0.2;
        const scaleFactor = 1 + waveOffset;
        
        positions[i3] = originalPositions[i3] * scaleFactor;
        positions[i3 + 1] = originalPositions[i3 + 1] * scaleFactor;
        positions[i3 + 2] = originalPositions[i3 + 2] * scaleFactor;
        
        // Audio reactivity for particle sizes
        if (isUsingMicrophone || isPlaying) {
          sizes[i/3] = energyField.userData.sizes[i/3] * (1 + audioData.bass * 3);
        } else {
          sizes[i/3] = energyField.userData.sizes[i/3] * (1 + Math.sin(time * 2 + i) * 0.2);
        }
      }
      
      energyField.geometry.attributes.position.needsUpdate = true;
      energyField.geometry.attributes.size.needsUpdate = true;
      
      // Mood-specific energy field adjustments
      if (mood === 'confident') {
        (energyField.material as THREE.PointsMaterial).opacity = 0.7 + Math.sin(time * 2) * 0.2;
      } else if (mood === 'alert') {
        (energyField.material as THREE.PointsMaterial).opacity = 0.5 + Math.abs(Math.sin(time * 4)) * 0.5;
      }
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
    
    // Update visualizer
    updateVisualizer(analyser, newAudioData);
    
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
  
  // Update audio visualizer
  const updateVisualizer = (analyser: AnalyserNode & { 
    frequencyData?: Uint8Array; 
    timeDomainData?: Uint8Array 
  }, audioData: AudioData) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    context.clearRect(0, 0, width, height);
    
    // Get data
    const frequencyData = analyser.frequencyData as Uint8Array;
    const timeDomainData = analyser.timeDomainData as Uint8Array;
    
    // Define colors based on current mood
    const moodVisualColors = {
      neutral: { primary: '#00aaff', secondary: '#003366' },
      confident: { primary: '#00ff88', secondary: '#004422' },
      analytical: { primary: '#ff00ff', secondary: '#330033' },
      alert: { primary: '#ff5500', secondary: '#331100' }
    };
    
    const colors = moodVisualColors[mood] || moodVisualColors.neutral;
    
    // Create gradient for bars
    const gradient = context.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, colors.secondary);
    gradient.addColorStop(1, colors.primary);
    
    // Create frequency visualization
    const bufferLength = frequencyData.length;
    const barWidth = width / (bufferLength * 0.5); // Use only 50% of frequencies for better visualization
    
    // Draw frequency bars
    context.fillStyle = gradient;
    
    for (let i = 0; i < bufferLength * 0.5; i++) {
      const value = frequencyData[i];
      const percent = value / 256;
      const barHeight = height * percent * 0.9; // 90% of height max
      
      // Add a bit of horizontal blur for smoother visualization
      context.globalAlpha = 0.7;
      context.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
      
      // Add a brighter center to each bar
      context.globalAlpha = 0.9;
      context.fillRect(i * barWidth + barWidth * 0.25, height - barHeight, barWidth * 0.5, barHeight);
    }
    
    // Reset global alpha
    context.globalAlpha = 1.0;
    
    // Add waveform on top
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = colors.primary;
    
    // Draw time domain waveform
    const sliceWidth = width / timeDomainData.length;
    let x = 0;
    
    for (let i = 0; i < timeDomainData.length; i++) {
      const v = timeDomainData[i] / 128.0;
      const y = (v * height / 4) + (height / 2);
      
      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    context.lineTo(width, height / 2);
    context.stroke();
    
    // Add visualization glow effect
    context.shadowBlur = 10;
    context.shadowColor = colors.primary;
    context.stroke();
    context.shadowBlur = 0;
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
    
    // Animate mouth based on volume and speech patterns (with enhanced movement)
    animateMouth(volume, speechIntensity);
    
    // Eyes no longer move based on sound - static subtle glow instead
    if (leftEyeRef.current && rightEyeRef.current) {
      if (leftEyeRef.current.children[0] && rightEyeRef.current.children[0]) {
        // Just a subtle constant glow
        (leftEyeRef.current.children[0] as THREE.Mesh).scale.setScalar(1.1);
        (rightEyeRef.current.children[0] as THREE.Mesh).scale.setScalar(1.1);
      }
    }
    
    // Head movements based on speech
    if (headRef.current && speechIntensity > 0.05) {
      const headTurnFactor = 0.12 * speechIntensity;
      const headTiltFactor = 0.06 * speechIntensity;
      
      const time = Date.now() * 0.001;
      headRef.current.rotation.y = Math.sin(time * (0.002 + speechCadence * 0.001)) * headTurnFactor;
      headRef.current.rotation.x = Math.cos(time * (0.0015 + speechCadence * 0.0005)) * headTiltFactor;
    }
    
    // If in trading mode, animate number particles based on audio
    if (mode === 'trading' && numberParticlesRef.current) {
      const animateTradeNumbers = (audioData: AudioData) => {
        // This function is not implemented in the original code
        // Add implementation if needed
      };
      
      animateTradeNumbers(audioData);
    }
  };
  
  // Animate mouth based on audio with enhanced responsiveness
  const animateMouth = (volume: number, speechIntensity: number) => {
    if (!mouthRef.current || !upperLipRef.current || !lowerLipRef.current || !innerMouthRef.current) {
      return;
    }
    
    // Combined intensity with higher emphasis on speech patterns
    const combinedIntensity = volume * 0.25 + speechIntensity * 0.85;
    
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
    if (speechIntensity > 0.05) { // Lower threshold for more movement
      const lipXOffset = Math.sin(Date.now() * 0.015) * 0.03 * speechIntensity;
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
  
  // Handle audio file upload
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setStatus(`Loading audio file: ${file.name}`);
    
    // Reset current audio if any
    if (audioSourceRef.current) {
      stopAudio();
    }
    
    const reader = new FileReader();
    fileReaderRef.current = reader;
    
    reader.onload = (event) => {
      const audioContext = audioContextRef.current;
      
      if (!audioContext) {
        setStatus('Audio system not initialized');
        setIsError(true);
        return;
      }
      
      if (event.target && event.target.result) {
        audioContext.decodeAudioData(event.target.result as ArrayBuffer)
          .then(buffer => {
            // Create buffer source
            const audioSource = audioContext.createBufferSource();
            audioSource.buffer = buffer;
            
            // Connect to analyzer
            if (analyserRef.current) {
              audioSource.connect(analyserRef.current);
            }
            audioSourceRef.current = audioSource;
            
            // Show file details
            const duration = buffer.duration.toFixed(2);
            const channels = buffer.numberOfChannels;
            setStatus(`Loaded: ${file.name} (${duration}s, ${channels} channels)`);
            setAudioLoaded(true);
            setIsError(false);
          })
          .catch(error => {
            console.error('Error decoding audio data', error);
            setStatus('Error decoding audio file - unsupported format');
            setIsError(true);
          });
      }
    };
    
    reader.onerror = () => {
      setStatus('Error reading audio file');
      setIsError(true);
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  // Play audio
  const playAudio = () => {
    if (!audioSourceRef.current || !audioContextRef.current) {
      setStatus('No audio loaded');
      return;
    }
    
    // Resume audio context if suspended
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    // Create a new source if the previous one was already played
    if (audioSourceRef.current.buffer && !isPlaying) {
      const audioContext = audioContextRef.current;
      const buffer = audioSourceRef.current.buffer;
      
      const newSource = audioContext.createBufferSource();
      newSource.buffer = buffer;
      if (analyserRef.current) {
        newSource.connect(analyserRef.current);
      }
      audioSourceRef.current = newSource;
    }
    
    // Play audio
    audioSourceRef.current.start(0);
    setIsPlaying(true);
    setStatus('Playing audio');
    
    // Handle completion
    audioSourceRef.current.onended = () => {
      setStatus('Audio playback completed');
      setIsPlaying(false);
    };
  };
  
  // Stop audio playback
  const stopAudio = () => {
    if (audioSourceRef.current && isPlaying) {
      try {
        audioSourceRef.current.stop();
        setIsPlaying(false);
      } catch (e) {
        // Source might have already stopped
      }
    }
  };
  
  // Start microphone input
  const startMicrophone = () => {
    if (isUsingMicrophone) {
      stopMicrophone();
      return;
    }
    
    setStatus('Requesting microphone access...');
    
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then((stream) => {
        const audioContext = audioContextRef.current;
        
        if (!audioContext) {
          setStatus('Audio system not initialized');
          setIsError(true);
          return;
        }
        
        mediaStreamRef.current = stream;
        
        // Create microphone source
        const micSource = audioContext.createMediaStreamSource(stream);
        if (analyserRef.current) {
          micSource.connect(analyserRef.current);
        }
        
        setIsUsingMicrophone(true);
        setStatus('Microphone active - speak to interact');
        setIsError(false);
      })
      .catch((err) => {
        console.error('Error accessing microphone:', err);
        setStatus('Error accessing microphone - check permissions');
        setIsError(true);
      });
  };
  
  // Stop microphone input
  const stopMicrophone = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      mediaStreamRef.current = null;
      setIsUsingMicrophone(false);
      setStatus('Microphone stopped');
    }
  };

  return (
    <div className="flex w-full h-screen bg-gray-900 text-white">
      <div className="flex flex-col w-full h-full">
        <div className="flex-grow relative" ref={mountRef}></div>
        
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-blue-400">4g3n7 Interactive Avatar</h2>
              <p className={`text-sm ${isError ? 'text-red-400' : 'text-gray-300'}`}>{status}</p>
            </div>
            
            <div className="flex gap-2">
              <select 
                className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                value={mood}
                onChange={(e) => applyMood(e.target.value as 'neutral' | 'confident' | 'analytical' | 'alert')}
              >
                <option value="neutral">Neutral</option>
                <option value="confident">Confident</option>
                <option value="analytical">Analytical</option>
                <option value="alert">Alert</option>
              </select>
              
              <select
                className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                value={mode}
                onChange={(e) => setMode(e.target.value as 'default' | 'trading')}
              >
                <option value="default">Default</option>
                <option value="trading">Trading</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <canvas 
                ref={canvasRef} 
                className="w-full h-16 bg-gray-900 rounded"
              ></canvas>
            </div>
            
            <div className="flex flex-col gap-2 md:w-64">
              <input 
                type="file"
                accept="audio/*"
                className="hidden"
                id="audio-file"
                onChange={handleAudioUpload}
              />
              <label 
                htmlFor="audio-file"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-center cursor-pointer"
              >
                Upload Audio
              </label>
              
              <button 
                className={`py-2 px-4 rounded text-center ${audioLoaded && !isPlaying ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600'}`}
                onClick={playAudio}
                disabled={!audioLoaded || isPlaying}
              >
                Play Audio
              </button>
              
              <button 
                className={`py-2 px-4 rounded text-center ${isUsingMicrophone ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                onClick={startMicrophone}
              >
                {isUsingMicrophone ? 'Stop Microphone' : 'Use Microphone'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentAvatar;