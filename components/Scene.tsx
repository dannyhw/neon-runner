import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, ThreeElements, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { City } from './City';
import { Spinner } from './Spinner';
import { Rain } from './Rain';
import { Obstacles } from './Obstacles';
import { Lasers } from './Lasers';
import { Explosions, ExplosionsRef } from './Explosions';
import { CITY_CONFIG } from '../constants';
import { LaserData } from '../types';

// Fix for missing JSX types in current environment
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// Simple FPS Tracker that updates a DOM element directly to avoid react re-renders
const FpsTracker = () => {
  const fpsRef = useRef(0);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    fpsRef.current++;
    
    // Update every 0.5 seconds
    if (timeRef.current >= 0.5) {
      const fps = Math.round(fpsRef.current / timeRef.current);
      const el = document.getElementById('fps-display');
      if (el) el.innerText = `FPS: ${fps}`;
      
      timeRef.current = 0;
      fpsRef.current = 0;
    }
  });
  return null;
};

interface SceneProps {
  gameActive: boolean;
  onDamage: () => void;
  score: number;
  sfxEnabled: boolean;
}

export const Scene: React.FC<SceneProps> = ({ gameActive, onDamage, score, sfxEnabled }) => {
  // Shared ref for Spinner position so obstacles can check collision
  const spinnerPosRef = useRef(new THREE.Vector3(0, 0, -5));
  
  // Shared ref for active lasers
  const lasersRef = useRef<LaserData[]>([]);
  
  // Ref for triggering explosions
  const explosionsRef = useRef<ExplosionsRef>(null);

  // --- PROCEDURAL AUDIO ENGINE ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    // Initialize Audio Context
    const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new CtxClass();
    audioCtxRef.current = ctx;

    // Create White Noise Buffer for Explosions
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBufferRef.current = buffer;

    // Resume context on any user interaction to bypass browser autoplay policies
    const resumeAudio = () => {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    };
    window.addEventListener('click', resumeAudio);
    window.addEventListener('keydown', resumeAudio);

    return () => {
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
      ctx.close();
    };
  }, []);

  const playLaserSound = useCallback(() => {
    if (!sfxEnabled) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Pew Pew sound
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }, [sfxEnabled]);

  const playExplosionSound = useCallback(() => {
    if (!sfxEnabled) return;
    const ctx = audioCtxRef.current;
    if (!ctx || !noiseBufferRef.current) return;

    const source = ctx.createBufferSource();
    source.buffer = noiseBufferRef.current;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = ctx.createGain();
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Boom envelope
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    source.start();
    source.stop(ctx.currentTime + 0.5);
  }, [sfxEnabled]);

  const playCrashSound = useCallback(() => {
     if (!sfxEnabled) return;
     const ctx = audioCtxRef.current;
     if (!ctx || !noiseBufferRef.current) return;
 
     const source = ctx.createBufferSource();
     source.buffer = noiseBufferRef.current;
     
     const osc = ctx.createOscillator();
     osc.type = 'sawtooth';
     osc.frequency.setValueAtTime(100, ctx.currentTime);
     osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.5);
 
     const gain = ctx.createGain();
     const oscGain = ctx.createGain();

     source.connect(gain);
     osc.connect(oscGain);
     oscGain.connect(gain);

     gain.connect(ctx.destination);
 
     // Heavy impact envelope
     gain.gain.setValueAtTime(0.5, ctx.currentTime);
     gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
     
     oscGain.gain.setValueAtTime(0.5, ctx.currentTime);

     source.start();
     osc.start();
     source.stop(ctx.currentTime + 0.8);
     osc.stop(ctx.currentTime + 0.8);
  }, [sfxEnabled]);

  const handleShoot = () => {
    if (gameActive) {
        playLaserSound();
    }
  };

  const handleHit = (position: THREE.Vector3, type: 'player' | 'obstacle') => {
      // Visual Effect
      const color = type === 'player' ? '#ff0000' : '#ffaa00';
      explosionsRef.current?.explode(position, color);

      // Sound Effect
      if (type === 'player') {
          playCrashSound();
          onDamage();
      } else {
          playExplosionSound();
      }
  };

  // Boost Logic
  const [isBoosting, setIsBoosting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsBoosting(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsBoosting(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Calculate world speed based on boost and pause state
  // If gameActive is false (paused), speed is 0.
  const currentSpeed = gameActive 
    ? (isBoosting ? CITY_CONFIG.SPEED * 2.5 : CITY_CONFIG.SPEED)
    : 0;

  return (
    <div className="w-full h-screen relative bg-black">
      <Canvas
        camera={{ position: [0, 2, 10], fov: 60 }}
        gl={{ antialias: false }} 
        dpr={[1, 1.5]} 
      >
        <FpsTracker />
        <fog attach="fog" args={[CITY_CONFIG.FOG_COLOR, 5, 90]} />
        <color attach="background" args={[CITY_CONFIG.FOG_COLOR]} />

        <ambientLight intensity={0.2} />
        <pointLight position={[0, 20, -50]} intensity={2} color="#ff00ff" distance={100} />
        <pointLight position={[-50, 10, -20]} intensity={2} color="#00ffff" distance={100} />

        <Suspense fallback={null}>
          <group>
            <City speed={currentSpeed} />
            <Spinner 
                positionRef={spinnerPosRef} 
                gameActive={gameActive} 
                isBoosting={isBoosting} 
            />
            <Obstacles 
                spinnerPosition={spinnerPosRef} 
                lasersRef={lasersRef}
                onHit={handleHit}
                gameActive={gameActive} 
                speed={currentSpeed}
                score={score}
            />
            <Lasers 
                spinnerPosition={spinnerPosRef} 
                lasersRef={lasersRef}
                gameActive={gameActive}
                onShoot={handleShoot}
            />
            <Explosions ref={explosionsRef} />
            <Rain speed={currentSpeed} />
          </group>
        </Suspense>

        <EffectComposer enableNormalPass={false}>
          <Bloom 
            luminanceThreshold={0.2} 
            luminanceSmoothing={0.9} 
            intensity={1.5} 
            radius={0.6}
            mipmapBlur
          />
          <Noise opacity={0.15} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};