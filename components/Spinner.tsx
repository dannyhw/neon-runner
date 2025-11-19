import React, { useRef, useEffect } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

// Fix for missing JSX types in current environment
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface SpinnerProps {
  onSpeedChange?: (speed: number) => void;
  positionRef?: React.MutableRefObject<THREE.Vector3>;
  gameActive: boolean;
  isBoosting?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ onSpeedChange, positionRef, gameActive, isBoosting = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  // Optimization: Use useRef instead of useState to avoid re-rendering on every mouse move
  const mousePos = useRef({ x: 0, y: 0 });

  // Ref for smooth FOV transition
  const fovRef = useRef(60);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Normalize -1 to 1
      mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (!gameActive) return;

    // Constrain movement to keep vehicle on screen
    const targetX = mousePos.current.x * 12; 
    const targetY = Math.max(-3, Math.min(8, mousePos.current.y * 8));

    // Smooth lerp movement
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, delta * 5);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 5);

    // Bank turn rotation
    const bankAngle = -mousePos.current.x * 0.5;
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, bankAngle, delta * 4);
    
    // Slight hover wobble
    groupRef.current.position.y += Math.sin(state.clock.getElapsedTime() * 2) * 0.05;

    // Camera FOV Warp Effect on Boost
    const targetFov = isBoosting ? 85 : 60;
    fovRef.current = THREE.MathUtils.lerp(fovRef.current, targetFov, delta * 3);
    
    if (state.camera instanceof THREE.PerspectiveCamera) {
      state.camera.fov = fovRef.current;
      state.camera.updateProjectionMatrix();
    }
    
    // Shake effect when boosting
    if (isBoosting) {
        groupRef.current.position.x += (Math.random() - 0.5) * 0.1;
        groupRef.current.position.y += (Math.random() - 0.5) * 0.1;
    }

    // Update the shared ref for collision detection
    if (positionRef) {
        positionRef.current.copy(groupRef.current.position);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -5]}>
      {/* Main Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 0.5, 4]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.4} />
      </mesh>
      
      {/* Cabin */}
      <mesh position={[0, 0.5, -0.5]}>
        <boxGeometry args={[1.5, 0.6, 2]} />
        <meshStandardMaterial color="#111" metalness={1} roughness={0.1} />
      </mesh>

      {/* Windshield Glow */}
      <mesh position={[0, 0.5, -0.5]}>
        <boxGeometry args={[1.4, 0.55, 1.9]} />
        <meshBasicMaterial color="#00ffff" opacity={0.2} transparent />
      </mesh>

      {/* Engines / Thrusters */}
      <mesh position={[-1.2, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.3, 1, 16]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[1.2, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.3, 1, 16]} />
        <meshStandardMaterial color="#444" />
      </mesh>

      {/* Engine Glow - Dynamic size on boost */}
      <mesh position={[-1.2, 0, 2.1]}>
         <circleGeometry args={[isBoosting ? 0.5 : 0.25, 16]} />
         <meshBasicMaterial color={isBoosting ? "#00aaff" : "#ff5500"} />
      </mesh>
      <mesh position={[1.2, 0, 2.1]}>
         <circleGeometry args={[isBoosting ? 0.5 : 0.25, 16]} />
         <meshBasicMaterial color={isBoosting ? "#00aaff" : "#ff5500"} />
      </mesh>

      {/* Headlights */}
      <pointLight position={[0, 0, -3]} distance={50} intensity={2} color="#ffffff" castShadow />
      <mesh position={[-0.8, -0.1, -2]}>
        <boxGeometry args={[0.3, 0.1, 0.1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.8, -0.1, -2]}>
        <boxGeometry args={[0.3, 0.1, 0.1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Police Lights Bar */}
      <mesh position={[0, 0.8, -1]}>
         <boxGeometry args={[1.2, 0.1, 0.2]} />
         <meshStandardMaterial emissive="#ff0000" emissiveIntensity={2} color="#000" />
      </mesh>
      <pointLight position={[0, 1, -1]} distance={10} intensity={1} color="#ff0000" decay={2} />
      
      {/* Gun Barrels (New) */}
      <mesh position={[-1.6, -0.2, 0]}>
        <boxGeometry args={[0.2, 0.2, 1.5]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh position={[1.6, -0.2, 0]}>
        <boxGeometry args={[0.2, 0.2, 1.5]} />
        <meshStandardMaterial color="#555" />
      </mesh>
    </group>
  );
};