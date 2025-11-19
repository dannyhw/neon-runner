import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { LaserData } from '../types';

// Fix for missing JSX types in current environment
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface LasersProps {
  spinnerPosition: React.MutableRefObject<THREE.Vector3>;
  lasersRef: React.MutableRefObject<LaserData[]>;
  gameActive: boolean;
  onShoot: () => void;
}

export const Lasers: React.FC<LasersProps> = ({ spinnerPosition, lasersRef, gameActive, onShoot }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  // Optimization: Memoize tempObj to avoid recreation on re-renders
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  // Initialize pool of lasers
  const count = 20;
  useMemo(() => {
    lasersRef.current = new Array(count).fill(0).map(() => ({
      position: new THREE.Vector3(0, 0, 0),
      active: false
    }));
  }, []);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!gameActive) return;
      if (e.button === 0) { // Left Click
        // Find first inactive laser
        const laser = lasersRef.current.find(l => !l.active);
        if (laser) {
          laser.active = true;
          // Spawn at current spinner position
          laser.position.copy(spinnerPosition.current);
          // Offset slightly below and forward
          laser.position.y -= 0.5;
          laser.position.z -= 2.0;
          
          onShoot();
        }
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [gameActive, spinnerPosition, onShoot]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (!gameActive) return;

    const speed = 250; // Laser speed

    lasersRef.current.forEach((laser, i) => {
      if (laser.active) {
        laser.position.z -= speed * delta;

        // Despawn if too far
        if (laser.position.z < -800) {
          laser.active = false;
        }

        tempObj.position.copy(laser.position);
        tempObj.scale.set(1, 1, 10); // Stretch effect
        tempObj.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObj.matrix);
      } else {
        // Hide inactive
        tempObj.scale.set(0, 0, 0);
        tempObj.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObj.matrix);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.1, 0.1, 1]} />
      <meshBasicMaterial color="#00ff00" toneMapped={false} />
    </instancedMesh>
  );
};