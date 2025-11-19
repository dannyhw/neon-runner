import React, { useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

// Fix for missing JSX types in current environment
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

export interface ExplosionsRef {
  explode: (position: THREE.Vector3, color: string) => void;
}

const PARTICLE_COUNT = 300;

export const Explosions = forwardRef<ExplosionsRef, {}>((_, ref) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Store particle state in a mutable array to avoid React re-renders
  const particles = useMemo(() => {
    return new Array(PARTICLE_COUNT).fill(0).map(() => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      life: 0,
      color: new THREE.Color()
    }));
  }, []);

  useImperativeHandle(ref, () => ({
    explode: (pos: THREE.Vector3, colorStr: string) => {
       const color = new THREE.Color(colorStr);
       let spawned = 0;
       // Spawn a burst of particles
       for(let i = 0; i < PARTICLE_COUNT; i++) {
          if (particles[i].life <= 0) {
             particles[i].life = 1.0 + Math.random() * 0.5; // Random life duration
             particles[i].position.copy(pos);
             
             // Random explosion velocity sphere
             const theta = Math.random() * Math.PI * 2;
             const phi = Math.acos((Math.random() * 2) - 1);
             const speed = 10 + Math.random() * 20;
             
             particles[i].velocity.set(
                speed * Math.sin(phi) * Math.cos(theta),
                speed * Math.sin(phi) * Math.sin(theta),
                speed * Math.cos(phi)
             );

             particles[i].color.copy(color);
             spawned++;
             if(spawned >= 15) break; // Particles per explosion
          }
       }
    }
  }));

  useFrame((state, delta) => {
     if (!meshRef.current) return;
     let needsUpdate = false;

     particles.forEach((p, i) => {
        if (p.life > 0) {
           p.life -= delta * 3.0; // Decay speed
           
           // Drag effect
           p.velocity.multiplyScalar(0.95);
           
           p.position.addScaledVector(p.velocity, delta);
           
           dummy.position.copy(p.position);
           // Scale down as they die
           dummy.scale.setScalar(Math.max(0, p.life)); 
           dummy.updateMatrix();
           
           meshRef.current!.setMatrixAt(i, dummy.matrix);
           meshRef.current!.setColorAt(i, p.color);
           needsUpdate = true;
        } else {
           // Hide inactive particles
           if (p.life !== -1) {
               dummy.scale.setScalar(0);
               dummy.updateMatrix();
               meshRef.current!.setMatrixAt(i, dummy.matrix);
               p.life = -1; // Mark as processed dead
               needsUpdate = true;
           }
        }
     });

     if (needsUpdate) {
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
     }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
       <dodecahedronGeometry args={[0.6, 0]} />
       <meshBasicMaterial toneMapped={false} transparent opacity={0.8} />
    </instancedMesh>
  );
});

Explosions.displayName = 'Explosions';