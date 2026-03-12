'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

// Create procedural Earth texture
function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.Texture();

  // Fill with water (blue)
  ctx.fillStyle = '#1a5f8f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add oceans (darker blue)
  ctx.fillStyle = '#0f3a5f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add continents (green/brown)
  ctx.fillStyle = '#2d5f2f';

  // Simple continent positions (approximate)
  // North America
  ctx.fillRect(100, 300, 300, 250);
  // South America
  ctx.fillRect(200, 500, 150, 200);
  // Europe
  ctx.fillRect(600, 250, 150, 150);
  // Africa
  ctx.fillRect(700, 400, 200, 300);
  // Asia
  ctx.fillRect(900, 200, 500, 350);
  // Australia
  ctx.fillRect(1400, 550, 150, 120);

  // Add some land variation
  ctx.fillStyle = '#3d7a3d';
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.fillRect(x, y, 30, 30);
  }

  // Add gradual shading
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(100, 150, 200, 0.1)');
  gradient.addColorStop(1, 'rgba(50, 100, 150, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// StarField component
function StarField() {
  const starsRef = useRef<THREE.Points>(null);

  useEffect(() => {
    if (!starsRef.current) return;

    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      sizeAttenuation: true,
      fog: false,
    });

    const starsVertices = [];
    for (let i = 0; i < 3000; i++) {
      starsVertices.push(
        (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 300
      );
    }

    starsGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(starsVertices), 3)
    );
    starsRef.current.geometry = starsGeometry;
    starsRef.current.material = starsMaterial;
  }, []);

  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.x += 0.00001;
      starsRef.current.rotation.y += 0.00002;
    }
  });

  return <points ref={starsRef} />;
}



function EarthGlobe() {
  const earthRef = useRef<THREE.Mesh>(null);
  const [earthTexture] = useState(() => createEarthTexture());

  return (
    <group>
      {/* Star Field */}
      <StarField />

      {/* Earth Sphere with Procedural Texture */}
      <Sphere ref={earthRef} args={[2, 128, 128]}>
        <meshStandardMaterial
          map={earthTexture}
          metalness={0.1}
          roughness={0.7}
        />
      </Sphere>

      {/* Atmospheric Glow Layer - Inner */}
      <Sphere args={[2.08, 32, 32]} renderOrder={1}>
        <meshBasicMaterial
          color="#87ceeb"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Outer Atmosphere with glow */}
      <Sphere args={[2.15, 32, 32]} renderOrder={0}>
        <meshBasicMaterial
          color="#4c90e2"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Enhanced rim light glow */}
      <Sphere args={[2.23, 32, 32]}>
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
    </group>
  );
}

export default function Globe() {
  return (
    <div className="w-full h-96 md:h-[500px] relative bg-black/40 rounded-3xl border border-white/10 overflow-hidden group hover:border-white/20 transition-all duration-300">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        {/* Enhanced Lighting Setup */}
        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.4}
          color="#ffffff"
        />
        <directionalLight
          position={[-8, -8, -8]}
          intensity={0.5}
          color="#4c90e2"
        />
        <directionalLight
          position={[0, 10, 5]}
          intensity={0.8}
          color="#ffa500"
        />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#87ceeb" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#ff6b9d" />

        <EarthGlobe />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI - Math.PI / 4}
        />
      </Canvas>

      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />

      {/* Info Text */}
      <div className="absolute bottom-4 left-4 text-white text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-gray-400">✨ Drag to rotate • Hover over markers to explore cities</p>
      </div>

      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}