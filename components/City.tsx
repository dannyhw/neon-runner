import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { CITY_CONFIG } from '../constants';

// Fix for missing JSX types in current environment
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

interface CityProps {
  speed: number;
}

export const City: React.FC<CityProps> = ({ speed }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Generate static data for buildings (size, initial pos, color)
  const buildings = useMemo(() => {
    const data = [];
    for (let i = 0; i < CITY_CONFIG.BUILDING_COUNT; i++) {
      const x = (Math.random() - 0.5) * 300;
      // Keep a clear path in the middle (the "highway")
      const adjustedX = x > 0 ? x + 20 : x - 20; 
      
      const z = -Math.random() * 1000;
      const y = -50 + Math.random() * 40; // Vertical variation
      const height = 20 + Math.random() * 100;
      const width = 10 + Math.random() * 20;
      const depth = 10 + Math.random() * 20;
      
      // Pick a random neon color or dark building color
      const isNeon = Math.random() > 0.8;
      const color = isNeon 
        ? CITY_CONFIG.NEON_COLORS[Math.floor(Math.random() * CITY_CONFIG.NEON_COLORS.length)]
        : '#111111';

      data.push({ x: adjustedX, y, z, width, height, depth, color, speedOffset: Math.random() * 0.5 });
    }
    return data;
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    buildings.forEach((data, i) => {
      tempObject.position.set(data.x, data.y + data.height / 2, data.z);
      tempObject.scale.set(data.width, data.height, data.depth);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      
      // Set color
      tempColor.set(data.color);
      meshRef.current!.setColorAt(i, tempColor);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [buildings]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    for (let i = 0; i < CITY_CONFIG.BUILDING_COUNT; i++) {
      // Get current instance matrix
      meshRef.current.getMatrixAt(i, tempObject.matrix);
      tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

      // Move towards camera (positive Z)
      // Use the dynamic passed speed
      tempObject.position.z += (speed + buildings[i].speedOffset) * delta;

      // Reset if passed camera
      if (tempObject.position.z > 50) {
        tempObject.position.z = -1000;
        // Randomize X slightly on respawn for variety
        const xBase = (Math.random() - 0.5) * 300;
        tempObject.position.x = xBase > 0 ? xBase + 20 : xBase - 20;
      }

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CITY_CONFIG.BUILDING_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color="#111111" 
        emissive="#000000"
        metalness={0.8} 
        roughness={0.2} 
      />
    </instancedMesh>
  );
};