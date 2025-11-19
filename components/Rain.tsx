import React, { useRef, useMemo } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

// Fix for missing JSX types in current environment
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface RainProps {
    speed: number;
}

export const Rain: React.FC<RainProps> = ({ speed }) => {
  const count = 2000;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 400; // x
      pos[i * 3 + 1] = Math.random() * 200 - 100; // y
      pos[i * 3 + 2] = Math.random() * 400 - 200; // z
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (!geomRef.current) return;
    
    const positions = geomRef.current.attributes.position.array as Float32Array;
    // Rain moves faster than the buildings usually to simulate wind/falling
    const rainSpeed = speed * 2 + 20;

    for (let i = 0; i < count; i++) {
      // Move y down
      positions[i * 3 + 1] -= rainSpeed * delta;
      // Move z slightly towards camera to simulate driving into rain
      positions[i * 3 + 2] += (rainSpeed * 0.5) * delta;

      // Reset if too low
      if (positions[i * 3 + 1] < -50) {
        positions[i * 3 + 1] = 100;
      }
      // Reset if passed camera
      if (positions[i * 3 + 2] > 50) {
        positions[i * 3 + 2] = -200;
      }
    }
    geomRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#aaaaaa"
        size={0.8}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};