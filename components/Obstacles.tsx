import React, { useRef, useMemo } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { LaserData } from '../types';

// Fix for missing JSX types in current environment
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface ObstaclesProps {
  spinnerPosition: React.MutableRefObject<THREE.Vector3>;
  lasersRef: React.MutableRefObject<LaserData[]>;
  onHit: (position: THREE.Vector3, type: 'player' | 'obstacle') => void;
  gameActive: boolean;
  speed: number;
  score: number;
}

export const Obstacles: React.FC<ObstaclesProps> = ({ spinnerPosition, lasersRef, onHit, gameActive, speed, score }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 100; // Max pool size
  
  // Optimization: Memoize tempObj to avoid recreation on re-renders
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  const obstacles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 35, // X range matches playable area
        (Math.random() - 0.5) * 15, // Y range matches playable area
        -100 - Math.random() * 800 // Spread out start positions
      ),
      rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
      scale: 0.8 + Math.random() * 0.5,
      rotationSpeed: { x: Math.random() * 2, y: Math.random() * 2 },
      active: true
    }));
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Difficulty Logic: 
    // 1. Increase active mines based on score
    // Base 20. Increase by 1 every 50 points. Maxes out at 4000 points.
    const activeLimit = Math.min(count, 20 + Math.floor(score / 50));

    // 2. Increase speed multiplier based on score
    // Caps at reasonable speed factor
    const speedMultiplier = 1 + (score / 5000); 
    const mineSpeed = (speed * speedMultiplier) + 30; 

    const spinnerPos = spinnerPosition.current;

    obstacles.forEach((obstacle, i) => {
      if (!gameActive) return;

      // If this mine is beyond the current difficulty limit, hide it and keep it in reserve
      if (i >= activeLimit) {
          obstacle.position.z = -1000 - Math.random() * 500;
          obstacle.active = false;
          
          tempObj.position.copy(obstacle.position);
          tempObj.scale.setScalar(0);
          tempObj.updateMatrix();
          meshRef.current!.setMatrixAt(i, tempObj.matrix);
          return;
      }

      // Move obstacle
      obstacle.position.z += mineSpeed * delta;
      obstacle.rotation.x += obstacle.rotationSpeed.x * delta;
      obstacle.rotation.y += obstacle.rotationSpeed.y * delta;

      if (obstacle.active) {
        // 1. Check Player Collision
        const dz = obstacle.position.z - spinnerPos.z;
        
        // If within Z-range slice
        if (Math.abs(dz) < 2.0) { 
          const dx = obstacle.position.x - spinnerPos.x;
          const dy = obstacle.position.y - spinnerPos.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          // Hit radius
          if (dist < 2.5) {
             onHit(obstacle.position.clone(), 'player');
             obstacle.active = false; // "Explode" (hide)
          }
        }

        // 2. Check Laser Collision
        if (lasersRef && lasersRef.current) {
            for (const laser of lasersRef.current) {
                if (laser.active) {
                    const ldz = obstacle.position.z - laser.position.z;
                    // Laser travels fast, allow slightly larger Z window
                    if (Math.abs(ldz) < 5.0) {
                        const ldx = obstacle.position.x - laser.position.x;
                        const ldy = obstacle.position.y - laser.position.y;
                        const ldist = Math.sqrt(ldx*ldx + ldy*ldy);
                        
                        if (ldist < 3.0) {
                            // Trigger hit effect at obstacle position
                            onHit(obstacle.position.clone(), 'obstacle');
                            
                            obstacle.active = false; // Destroy mine
                            laser.active = false; // Destroy laser
                        }
                    }
                }
            }
        }
      }

      // Respawn
      // Standard respawn or initial spawn if it was previously inactive but now within limit
      if (obstacle.position.z > 20 || (!obstacle.active && obstacle.position.z > -5)) {
        obstacle.position.z = -600 - Math.random() * 400;
        obstacle.position.x = (Math.random() - 0.5) * 30; // Randomize lane
        obstacle.position.y = Math.max(-2, Math.min(6, (Math.random() - 0.5) * 15));
        obstacle.active = true;
      }

      // Update Instance
      tempObj.position.copy(obstacle.position);
      tempObj.rotation.copy(obstacle.rotation);
      
      // Scale 0 if hit/inactive
      const currentScale = obstacle.active ? obstacle.scale : 0;
      tempObj.scale.setScalar(currentScale);
      
      tempObj.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObj.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color="#ff0000" 
        emissive="#ff3300" 
        emissiveIntensity={3} 
        wireframe={true}
      />
    </instancedMesh>
  );
};