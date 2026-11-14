import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PhysicsVisionState } from './PhysicsVisionControls';
import { ANATOMY_NODES } from './FlameAnatomyInspector';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Compass,
  Wind,
  Info,
  Layers,
  Thermometer,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Sparkles,
  Sliders
} from 'lucide-react';
import { CanvasErrorBoundary } from '../CanvasErrorBoundary';

interface CompareChamber3DProps {
  vision: PhysicsVisionState;
  selectedAnatomyId: string | null;
  onSelectAnatomy: (id: string | null) => void;
  isDark?: boolean;
  hideIllustrative?: boolean;
}

// ─────────────────────────────────────────────────────────────
// CHAMBER RIG (Common apparatus for both Earth and Space)
// ─────────────────────────────────────────────────────────────

function ExperimentalChamberRig({ isDark }: { isDark: boolean }) {
  const metalColor = isDark ? '#334155' : '#94a3b8';
  const plateColor = isDark ? '#1e293b' : '#cbd5e1';

  return (
    <group>
      {/* Cylindrical Quartz Glass Chamber (0.24m radius, 0.52m height in scaled units) */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.52, 36, 1, true]} />
        <meshPhysicalMaterial
          color={isDark ? '#60a5fa' : '#93c5fd'}
          metalness={0.1}
          roughness={0.05}
          transmission={0.92}
          thickness={0.02}
          transparent
          opacity={isDark ? 0.12 : 0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Top Plate (Anodized Aluminum with Exhaust / Pressure Port) */}
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.02, 36]} />
        <meshStandardMaterial color={plateColor} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Top Vent Port */}
      <mesh position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 24]} />
        <meshStandardMaterial color={metalColor} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Base Plate */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.02, 36]} />
        <meshStandardMaterial color={plateColor} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Center Droplet Mount: Silicon Carbide Support Fiber (14 µm) & Stanchion */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.0015, 0.0015, 0.16, 8]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>
      {/* Base Needle Collar */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.03, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// EARTH FLAME (1g: Buoyancy-dominated, Teardrop, Yellow Soot, Convective Plume)
// ─────────────────────────────────────────────────────────────

function EarthFlame({
  simTime,
  vision,
  isDark,
  hideIllustrative = false
}: {
  simTime: number;
  vision: PhysicsVisionState;
  isDark: boolean;
  hideIllustrative?: boolean;
}) {
  const flameMeshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const smokeParticlesRef = useRef<THREE.Points>(null);

  // Droplet burn rate in 1g is faster due to convective oxygen delivery (K ≈ 1.35 mm²/s)
  const D0 = 3.5;
  const K_earth = 1.35;
  const D2 = Math.max(0.1, D0 * D0 - K_earth * simTime);
  const D = Math.sqrt(D2);
  const dropletR = Math.max(0.004, (D / D0) * 0.032);
  const isExtinguished = D2 <= 0.15;

  // Smoke & Upward Convection Particles
  const SMOKE_COUNT = 180;
  const { smokePos, smokeVel } = useMemo(() => {
    const pos = new Float32Array(SMOKE_COUNT * 3);
    const vel = new Float32Array(SMOKE_COUNT * 3);
    for (let i = 0; i < SMOKE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.04;
      pos[i * 3 + 1] = 0.1 + Math.random() * 0.28;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.04;

      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = 0.15 + Math.random() * 0.25; // High upward convective velocity
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return { smokePos: pos, smokeVel: vel };
  }, []);

  useFrame((_, delta) => {
    const t = simTime;
    // Buoyant flicker: Natural flame flicker in 1g occurs at f ≈ 1.5 * sqrt(g / D_flame) ~ 10-14 Hz
    const flicker = 1 + Math.sin(t * 18) * 0.06 + Math.sin(t * 31) * 0.03;
    const flickerX = 1 + Math.sin(t * 22) * 0.03;

    if (flameMeshRef.current && !isExtinguished) {
      flameMeshRef.current.scale.set(0.045 * flickerX, 0.12 * flicker, 0.045 * flickerX);
      flameMeshRef.current.position.y = 0.09 + (flameMeshRef.current.scale.y * 0.35);
    }

    if (glowRef.current && !isExtinguished) {
      glowRef.current.scale.set(0.07 * flickerX, 0.16 * flicker, 0.07 * flickerX);
      glowRef.current.position.y = 0.1 + (glowRef.current.scale.y * 0.35);
    }

    // Animate upward smoke / convection particles
    if (smokeParticlesRef.current && !isExtinguished) {
      const geo = smokeParticlesRef.current.geometry;
      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < SMOKE_COUNT; i++) {
        arr[i * 3 + 1] += smokeVel[i * 3 + 1] * delta;
        arr[i * 3] += smokeVel[i * 3] * delta;
        arr[i * 3 + 2] += smokeVel[i * 3 + 2] * delta;

        // Reset when reaching top of chamber
        if (arr[i * 3 + 1] > 0.42) {
          arr[i * 3 + 1] = 0.12 + Math.random() * 0.03;
          arr[i * 3] = (Math.random() - 0.5) * 0.03;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Liquid Hydrocarbon Droplet */}
      <mesh position={[0, 0.09, 0]}>
        <sphereGeometry args={[dropletR, 24, 24]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          transmission={0.4}
          roughness={0.1}
          metalness={0.1}
          transparent
          opacity={isExtinguished ? 0.2 : 0.9}
        />
      </mesh>

      {/* 2. Earth Flame Envelope (Elongated Teardrop: Blue base, bright yellow luminous tip) */}
      {!isExtinguished && (
        <>
          {/* Main Flame Body (Tapered teardrop cone/sphere hybrid) */}
          <mesh ref={flameMeshRef} position={[0, 0.15, 0]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#ea580c"
              emissiveIntensity={2.5}
              transparent
              opacity={0.85}
              depthWrite={false}
            />
          </mesh>

          {/* Blue Chemiluminescent Flame Base (CH* / C₂* emission where fresh air enters) */}
          <mesh position={[0, 0.10, 0]} scale={[0.046, 0.02, 0.046]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color="#3b82f6"
              emissive="#1d4ed8"
              emissiveIntensity={2.0}
              transparent
              opacity={0.7}
              depthWrite={false}
            />
          </mesh>

          {/* Ambient Flame Glow */}
          <mesh ref={glowRef} position={[0, 0.16, 0]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial
              color="#f97316"
              transparent
              opacity={0.15}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </>
      )}

      {/* 3. Physics Vision: Buoyancy Vectors (Upward orange arrows) */}
      {vision.buoyancy && !isExtinguished && (
        <group position={[0, 0.12, 0]}>
          {[-0.05, 0, 0.05].map((x, idx) => (
            <group key={idx} position={[x, 0.05 + idx * 0.02, 0]}>
              <mesh position={[0, 0.04, 0]}>
                <cylinderGeometry args={[0.002, 0.002, 0.08, 8]} />
                <meshBasicMaterial color="#f97316" />
              </mesh>
              <mesh position={[0, 0.085, 0]}>
                <coneGeometry args={[0.007, 0.015, 8]} />
                <meshBasicMaterial color="#f97316" />
              </mesh>
            </group>
          ))}
          <Text
            position={[0.1, 0.18, 0]}
            fontSize={0.018}
            color="#f97316"
            anchorX="left"
            outlineWidth={0.002}
            outlineColor="#000"
          >
            {'↑ g·Δρ (Buoyant Lift)'}
          </Text>
        </group>
      )}

      {/* 4. Physics Vision: Airflow & Streamlines (Convective Draft - Illustrative) */}
      {vision.airflow && !hideIllustrative && !isExtinguished && (
        <points ref={smokeParticlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={SMOKE_COUNT}
              array={smokePos}
              itemSize={3}
              args={[smokePos, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.008}
            color="#06b6d4"
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}

      {/* 5. Physics Vision: Oxygen Inflow (Blue arrows feeding into the flame base) */}
      {vision.oxygenTransport && !isExtinguished && (
        <group position={[0, 0.08, 0]}>
          {[-0.1, 0.1].map((x, idx) => (
            <group key={idx} position={[x, 0, 0]} rotation={[0, 0, x > 0 ? Math.PI / 2 : -Math.PI / 2]}>
              <mesh position={[0, 0.03, 0]}>
                <cylinderGeometry args={[0.002, 0.002, 0.05, 8]} />
                <meshBasicMaterial color="#3b82f6" />
              </mesh>
              <mesh position={[0, 0.06, 0]}>
                <coneGeometry args={[0.006, 0.014, 8]} />
                <meshBasicMaterial color="#3b82f6" />
              </mesh>
            </group>
          ))}
          <Text
            position={[0, 0.05, 0.08]}
            fontSize={0.014}
            color="#60a5fa"
            anchorX="center"
            outlineWidth={0.002}
            outlineColor="#000"
          >
            {'→ Convective O₂ Supply ←'}
          </Text>
        </group>
      )}

      {/* 6. Physics Vision: Heat Transfer (Upward red convective plume) */}
      {vision.heatTransfer && !isExtinguished && (
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.05, 0.02, 0.22, 16, 1, true]} />
          <meshBasicMaterial
            color="#ef4444"
            wireframe
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 7. Physics Vision: Fuel Vapour (Tight upward sheath) */}
      {vision.fuelVapour && !isExtinguished && (
        <mesh position={[0, 0.11, 0]} scale={[0.025, 0.05, 0.025]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color="#eab308"
            transparent
            opacity={0.35}
            wireframe
          />
        </mesh>
      )}

      {/* 8. Physics Vision: Combustion Products (Soot & CO2 plume) */}
      {vision.combustionProducts && !isExtinguished && (
        <mesh position={[0, 0.32, 0]} scale={[0.04, 0.12, 0.04]}>
          <cylinderGeometry args={[1, 0.5, 1, 16]} />
          <meshStandardMaterial
            color="#7e22ce"
            transparent
            opacity={0.25}
            roughness={0.9}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// ISS MICROGRAVITY FLAME (0g: Diffusion-dominated, Spherical, Cool Flame)
// ─────────────────────────────────────────────────────────────

function MicrogravityFlame({
  simTime,
  vision,
  selectedAnatomyId,
  onSelectAnatomy,
  isDark,
  env = 'iss',
  mlState,
  D0 = 3.5,
  hideIllustrative = false
}: {
  simTime: number;
  vision: PhysicsVisionState;
  selectedAnatomyId: string | null;
  onSelectAnatomy: (id: string | null) => void;
  isDark: boolean;
  env?: 'iss' | 'moon' | 'mars';
  mlState?: any;
  D0?: number;
  hideIllustrative?: boolean;
}) {
  const flameGroupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const coolGlowRef = useRef<THREE.Mesh>(null);
  const diffusionParticlesRef = useRef<THREE.Points>(null);

  // Droplet diameter & burning state: dynamically driven by PIML model when available
  const currentD = mlState
    ? mlState.d_mm
    : Math.sqrt(Math.max(0.05, D0 * D0 - (env === 'iss' ? 0.72 : env === 'moon' ? 0.95 : 1.15) * simTime));
  const dropletR = Math.max(0.005, (currentD / D0) * 0.032);

  const hasHotFlame = mlState
    ? (mlState.phase === 'HOT_FLAME' || mlState.phase === 'IGNITING')
    : (env === 'iss' ? simTime < 7.5 : simTime < (D0 * D0 / (env === 'moon' ? 0.95 : 1.15)));

  const hasCoolFlame = mlState
    ? mlState.is_cool
    : (env === 'iss' && simTime >= 7.5 && simTime < 13.5);

  const isExtinguished = mlState
    ? mlState.is_extinguished
    : (env === 'iss' ? simTime >= 13.5 : simTime >= (D0 * D0 / (env === 'moon' ? 0.95 : 1.15)));

  const aspectY = env === 'iss' ? 1.05 : env === 'moon' ? 1.40 : 1.85;

  // Diffusion particles (Radial isotropic drift)
  const DIFF_COUNT = 180;
  const { diffPos, diffDirs } = useMemo(() => {
    const pos = new Float32Array(DIFF_COUNT * 3);
    const dirs = new Float32Array(DIFF_COUNT * 3);
    for (let i = 0; i < DIFF_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.08 + Math.random() * 0.08;

      dirs[i * 3] = Math.sin(phi) * Math.cos(theta);
      dirs[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      dirs[i * 3 + 2] = Math.cos(phi);

      pos[i * 3] = r * dirs[i * 3];
      pos[i * 3 + 1] = 0.09 + r * dirs[i * 3 + 1];
      pos[i * 3 + 2] = r * dirs[i * 3 + 2];
    }
    return { diffPos: pos, diffDirs: dirs };
  }, []);

  useFrame((_, delta) => {
    const t = simTime;

    // Natural flame flicker rate increases with gravity
    const flickerFreq = env === 'iss' ? 2 : env === 'moon' ? 6 : 10;
    const flickerAmp = env === 'iss' ? 0.015 : env === 'moon' ? 0.03 : 0.045;
    const steadyPulse = 1 + Math.sin(t * flickerFreq) * flickerAmp;

    if (flameGroupRef.current && hasHotFlame) {
      const s = 0.065 * steadyPulse;
      flameGroupRef.current.scale.set(s, s * aspectY, s);
      flameGroupRef.current.position.y = 0.09 + (env !== 'iss' ? (aspectY - 1) * 0.025 : 0);
    }

    if (coolGlowRef.current && hasCoolFlame) {
      const s = 0.05 * (1 + Math.sin(t * 3) * 0.02);
      coolGlowRef.current.scale.setScalar(s);
    }

    // Oxygen diffusion inward towards the droplet
    if (diffusionParticlesRef.current && (hasHotFlame || hasCoolFlame)) {
      const geo = diffusionParticlesRef.current.geometry;
      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < DIFF_COUNT; i++) {
        // Drift slowly inward (Fickian diffusion towards reaction sink)
        const dx = diffDirs[i * 3] * delta * 0.015;
        const dy = diffDirs[i * 3 + 1] * delta * 0.015;
        const dz = diffDirs[i * 3 + 2] * delta * 0.015;

        arr[i * 3] -= dx;
        arr[i * 3 + 1] -= dy;
        arr[i * 3 + 2] -= dz;

        // Reset if reached droplet
        const distFromCenter = Math.sqrt(
          arr[i * 3] ** 2 +
          (arr[i * 3 + 1] - 0.09) ** 2 +
          arr[i * 3 + 2] ** 2
        );

        if (distFromCenter < 0.035) {
          const r = 0.16 + Math.random() * 0.04;
          arr[i * 3] = r * diffDirs[i * 3];
          arr[i * 3 + 1] = 0.09 + r * diffDirs[i * 3 + 1];
          arr[i * 3 + 2] = r * diffDirs[i * 3 + 2];
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Liquid Fuel Droplet (Near-perfect sphere, capillary forces dominate) */}
      <mesh
        position={[0, 0.09, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectAnatomy('liquid_droplet');
        }}
      >
        <sphereGeometry args={[dropletR, 32, 32]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          transmission={0.5}
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={isExtinguished ? 0.25 : 0.9}
        />
      </mesh>

      {/* 2. Hot Spherical Flame Shell (ISS Microgravity Hot Flame) */}
      {hasHotFlame && (
        <group ref={flameGroupRef} position={[0, 0.09, 0]}>
          {/* Reaction Zone Sphere: Translucent with blue-orange gradient */}
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onSelectAnatomy('reaction_zone');
            }}
          >
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial
              color="#fb923c"
              emissive="#ea580c"
              emissiveIntensity={1.8}
              transparent
              opacity={0.45}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Pale Blue Chemiluminescent Shell */}
          <mesh scale={[1.05, 1.05, 1.05]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial
              color="#60a5fa"
              emissive="#2563eb"
              emissiveIntensity={1.5}
              transparent
              opacity={0.35}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Diffuse Outer Glow */}
          <mesh scale={[1.2, 1.2, 1.2]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshBasicMaterial
              color="#f97316"
              transparent
              opacity={0.12}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      )}

      {/* 3. NASA Cool Flame Shell (Ghostly Pale Blue Low-Temperature Combustion) */}
      {hasCoolFlame && (
        <group position={[0, 0.09, 0]}>
          <mesh
            ref={coolGlowRef}
            onClick={(e) => {
              e.stopPropagation();
              onSelectAnatomy('cool_flame');
            }}
          >
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={2.2}
              transparent
              opacity={0.38}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Cool Flame Label in 3D */}
          <Text
            position={[0, 0.07, 0]}
            fontSize={0.018}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.002}
            outlineColor="#000"
          >
            {'COOL FLAME (T ≈ 800 K)'}
          </Text>
        </group>
      )}

      {/* 4. Physics Vision: Buoyancy Force */}
      {vision.buoyancy && (
        <group position={[0, 0.22, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.016}
            color={env === 'iss' ? '#94a3b8' : '#c084fc'}
            anchorX="center"
            outlineWidth={0.002}
            outlineColor="#000"
          >
            {env === 'iss'
              ? 'g ≈ 10⁻⁶ g (Buoyancy Suppressed)'
              : env === 'moon'
              ? 'g = 0.166g (1.62 m/s² • Gr ≈ 4.0×10³)'
              : 'g = 0.38g (3.72 m/s² • Gr ≈ 9.2×10³)'}
          </Text>
        </group>
      )}

      {/* 5. Physics Vision: Oxygen Transport (Isotropic 360° Radial Inward Diffusion - Illustrative particles) */}
      {vision.oxygenTransport && !hideIllustrative && (hasHotFlame || hasCoolFlame) && (
        <points ref={diffusionParticlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={DIFF_COUNT}
              array={diffPos}
              itemSize={3}
              args={[diffPos, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.007}
            color="#3b82f6"
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}

      {/* 6. Physics Vision: Heat Transfer (360° Radial Radiation Shell) */}
      {vision.heatTransfer && (hasHotFlame || hasCoolFlame) && (
        <mesh position={[0, 0.09, 0]}>
          <sphereGeometry args={[0.11, 24, 24]} />
          <meshBasicMaterial
            color="#ef4444"
            wireframe
            transparent
            opacity={0.25}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 7. Physics Vision: Fuel Vapour Zone (Wide Spherical Vapor Dome) */}
      {vision.fuelVapour && (hasHotFlame || hasCoolFlame) && (
        <mesh position={[0, 0.09, 0]}>
          <sphereGeometry args={[0.045, 24, 24]} />
          <meshBasicMaterial
            color="#eab308"
            wireframe
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 8. Physics Vision: Combustion Products (Spherical Lingering Shell) */}
      {vision.combustionProducts && (hasHotFlame || hasCoolFlame) && (
        <mesh position={[0, 0.09, 0]}>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshStandardMaterial
            color="#a855f7"
            transparent
            opacity={0.16}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 9. Interactive 3D Anatomical Pins */}
      {hasHotFlame && (
        <group>
          {/* Reaction Zone Pin */}
          <Html position={[0.065, 0.12, 0]} center>
            <button
              onClick={() => onSelectAnatomy('reaction_zone')}
              className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer border ${
                selectedAnatomyId === 'reaction_zone'
                  ? 'bg-orange-500 text-white border-white scale-110'
                  : 'bg-black/75 text-orange-300 border-orange-500/60 hover:bg-orange-600 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Reaction Zone
            </button>
          </Html>

          {/* Droplet Pin */}
          <Html position={[-0.045, 0.07, 0]} center>
            <button
              onClick={() => onSelectAnatomy('liquid_droplet')}
              className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer border ${
                selectedAnatomyId === 'liquid_droplet'
                  ? 'bg-sky-500 text-white border-white scale-110'
                  : 'bg-black/75 text-sky-300 border-sky-500/60 hover:bg-sky-600 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Fuel Droplet
            </button>
          </Html>
        </group>
      )}

      {/* Cool Flame Pin */}
      {hasCoolFlame && (
        <Html position={[0, 0.14, 0]} center>
          <button
            onClick={() => onSelectAnatomy('cool_flame')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer border ${
              selectedAnatomyId === 'cool_flame'
                ? 'bg-blue-600 text-white border-white scale-110'
                : 'bg-black/85 text-blue-300 border-blue-400 hover:bg-blue-600 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            NASA Cool Flame Discovery
          </button>
        </Html>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// MASTER DUAL-CHAMBER VIEW COMPONENT
// ─────────────────────────────────────────────────────────────

export const CompareChamber3D: React.FC<CompareChamber3DProps> = ({
  vision,
  selectedAnatomyId,
  onSelectAnatomy,
  isDark = false,
  hideIllustrative = false
}) => {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const [simTime, setSimTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [syncCamera, setSyncCamera] = useState(true);

  // Reduced gravity comparison target: ISS microgravity benchmark vs Moon/Mars modeled scenarios
  const [rightEnv, setRightEnv] = useState<'iss' | 'moon' | 'mars'>('iss');

  // Machine Learning Physics Engine Parameters (NASA-FLEX-PIML-v1.0)
  const [useML, setUseML] = useState(true);
  const [chamberO2, setChamberO2] = useState(21.0);
  const [chamberP, setChamberP] = useState(1.0);
  const [dropletD0, setDropletD0] = useState(3.5);
  const [showMLControls, setShowMLControls] = useState(false);

  const duration = 15.0; // 15 seconds full burn sequence

  // Real-time Physics-Informed ML Evaluation (evaluated continuously for smooth 60fps WebGL loop)
  const mlState = useMemo(() => {
    if (!useML) return null;
    const d0 = dropletD0;
    const d0_sq = d0 * d0;
    const tau = simTime / d0_sq;
    const o2_factor = Math.pow(chamberO2 / 21.0, 0.6);
    const p_factor = Math.pow(chamberP / 1.0, 0.15);

    const k_hot = 1.8600 * o2_factor * p_factor;
    const k_cool = 0.3546 * p_factor;
    const tau_trans = 0.408 * (chamberO2 / 21.0);
    const tau_ext = tau_trans + (1.0 - (1.0 - k_hot * tau_trans)) / Math.max(0.1, k_cool);

    let d2_norm = 1.0;
    let phase = 'HOT_FLAME';
    let current_k = k_hot;

    if (tau < tau_trans) {
      d2_norm = Math.max(0.0, 1.0 - k_hot * tau);
      phase = 'HOT_FLAME';
      current_k = k_hot;
    } else if (tau < tau_ext) {
      const d2_trans = Math.max(0.0, 1.0 - k_hot * tau_trans);
      d2_norm = Math.max(0.0, d2_trans - k_cool * (tau - tau_trans));
      phase = 'COOL_FLAME';
      current_k = k_cool;
    } else {
      d2_norm = 0.0;
      phase = 'EXTINGUISHED';
      current_k = 0.0;
    }

    const d_mm = d0 * Math.sqrt(d2_norm);
    const d2_mm2 = d2_norm * d0_sq;
    const is_extinguished = phase === 'EXTINGUISHED' || d_mm <= 0.05;
    const is_cool = phase === 'COOL_FLAME';

    const baseline_k = 0.9485 * o2_factor;
    const baseline_d = Math.sqrt(Math.max(0.0, d0_sq - baseline_k * simTime));
    const is_ood = rightEnv !== 'iss' || chamberO2 < 13.0 || chamberO2 > 30.0 || chamberP < 0.5 || chamberP > 2.5;

    return {
      d_mm,
      d2_mm2,
      phase,
      current_k,
      is_cool,
      is_extinguished,
      t_trans: tau_trans * d0_sq,
      t_ext: tau_ext * d0_sq,
      baseline_d,
      is_ood,
      uncertainty_sigma: 0.3859 * (is_ood ? 2.5 : 1.0)
    };
  }, [useML, simTime, dropletD0, chamberO2, chamberP, rightEnv]);

  useEffect(() => {
    let animId: number;
    let lastTs = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTs) / 1000;
      lastTs = now;

      if (isPlaying) {
        setSimTime((prev) => {
          const next = prev + dt * playbackSpeed;
          if (next >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return next;
        });
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed, duration]);

  const handleReset = () => {
    setIsPlaying(false);
    setSimTime(0);
  };

  return (
    <div className="space-y-3">
      {/* Top Experience Banner & Sync Controls */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-sky-500 text-white shadow-md">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                EARTH (1g) VS ISS MICROGRAVITY (~10⁻⁶g) BENCHMARK
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-300/40">
                SCIENTIFIC BENCHMARK
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synchronized physical chambers under identical fuel (n-Heptane) and atmospheric conditions (21% O₂, 1 atm, 298 K).
            </p>
          </div>
        </div>

        {/* Playback & Scrub Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <button
            onClick={handleReset}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>

          {/* Speed Buttons */}
          <div className="flex items-center gap-1 text-[11px] font-mono">
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded cursor-pointer transition-all ${
                  playbackSpeed === spd
                    ? 'bg-sky-500 text-white font-bold'
                    : isDark
                    ? 'bg-slate-800 text-slate-400 hover:text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {spd}×
              </button>
            ))}
          </div>

          {/* Time display */}
          <div className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            t = {simTime.toFixed(2)}s / {duration.toFixed(0)}s
          </div>
        </div>
      </div>

      {/* Timeline Slider */}
      <div className={`p-2.5 rounded-xl border flex items-center gap-3 ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <span className="text-[10px] font-mono text-slate-400 shrink-0 font-bold uppercase">Burn Progress</span>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.05}
          value={simTime}
          onChange={(e) => {
            setSimTime(parseFloat(e.target.value));
            if (isPlaying) setIsPlaying(false);
          }}
          className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
        />
        <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
          <span className="text-orange-500 font-bold">Hot Flame (0-7.5s)</span>
          <span className="text-slate-400">•</span>
          <span className="text-blue-400 font-bold">Cool Flame (7.5-13.5s)</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">Extinct</span>
        </div>
      </div>

      {/* Environment Selector & Machine Learning Model Control Bar */}
      <div className={`p-3 rounded-2xl border flex flex-col gap-3 transition-all ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Gravity Environment Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-500 uppercase font-bold">Target Gravity:</span>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200 dark:bg-slate-800">
              <button
                onClick={() => setRightEnv('iss')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  rightEnv === 'iss'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                ISS (Microgravity ~10⁻⁶g)
              </button>
              <button
                onClick={() => setRightEnv('moon')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  rightEnv === 'moon'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                Moon (0.166g)
              </button>
              <button
                onClick={() => setRightEnv('mars')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  rightEnv === 'mars'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                Mars (0.38g)
              </button>
            </div>
          </div>

          {/* Machine Learning Engine Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setUseML(!useML)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                useML
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle Two-Stage Physics-Informed ML Combustion Engine"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{useML ? 'PIML Model Active (FLEX v1.0)' : 'D²-Law Baseline Mode'}</span>
            </button>

            <button
              onClick={() => setShowMLControls(!showMLControls)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                showMLControls
                  ? 'bg-sky-500 text-white border-sky-400'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Chamber Variables</span>
            </button>
          </div>
        </div>

        {/* Live ML Telemetry & OOD Badges */}
        {useML && mlState && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono flex-wrap">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                NASA-FLEX-PIML:
              </span>
              <span className="text-slate-300">
                D̂ = <strong className="text-white">{mlState.d_mm.toFixed(3)} mm</strong>
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">
                Regime: <strong className={mlState.is_cool ? 'text-blue-400' : mlState.is_extinguished ? 'text-slate-400' : 'text-orange-400'}>
                  {mlState.phase}
                </strong>
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">
                Rate K̂ = <strong className="text-sky-300">{mlState.current_k.toFixed(3)} mm²/s</strong>
              </span>
            </div>

            {mlState.is_ood ? (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>OOD: Analytical Grashof scaling (Flight data is 0g ISS benchmark)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Calibrated within NASA CIR MDCA flight envelope</span>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Chamber Parameter Sliders */}
        {showMLControls && (
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono animate-in fade-in duration-200">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Initial Droplet D₀</span>
                <span className="font-bold text-sky-400">{dropletD0.toFixed(2)} mm</span>
              </div>
              <input
                type="range"
                min={2.0}
                max={4.5}
                step={0.1}
                value={dropletD0}
                onChange={(e) => setDropletD0(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Chamber Oxygen (O₂)</span>
                <span className="font-bold text-emerald-400">{chamberO2.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={14.0}
                max={30.0}
                step={0.5}
                value={chamberO2}
                onChange={(e) => setChamberO2(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Ambient Pressure</span>
                <span className="font-bold text-amber-400">{chamberP.toFixed(2)} atm</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={2.0}
                step={0.05}
                value={chamberP}
                onChange={(e) => setChamberP(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* DUAL 3D CHAMBERS SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT CHAMBER: EARTH (1g) */}
        <div className={`rounded-2xl border overflow-hidden relative ${
          isDark ? 'bg-[#030712] border-slate-800' : 'bg-slate-950 border-slate-300 shadow-md'
        }`}>
          {/* Chamber Header Badge */}
          <div className="absolute top-3 left-3 z-10 space-y-1 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-orange-500/90 text-white shadow-lg backdrop-blur-md">
                EARTH — 1g (9.81 m/s²)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/70 text-orange-300 border border-orange-500/40">
                BUOYANCY-DOMINATED
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
              Gr ≈ 2.4 × 10⁴ • v_nc ≈ 0.65 m/s • Rapid Convective Refresh
            </p>
          </div>

          {/* 3D Canvas */}
          <div style={{ height: '440px' }}>
            <CanvasErrorBoundary label="Earth Combustion Chamber (1g)" fallbackHeight="440px">
              <Canvas camera={{ position: [0, 0.22, 0.68], fov: 50 }}>
                <color attach="background" args={[isDark ? '#030712' : '#090d16']} />
                <ambientLight intensity={isDark ? 0.25 : 0.35} />
                <pointLight position={[0, 0.35, 0.35]} intensity={1.5} color="#ea580c" />
                <pointLight position={[0.2, 0.05, 0.2]} intensity={0.6} color="#38bdf8" />
                <directionalLight position={[-0.3, 0.5, 0.3]} intensity={0.4} />

                <ExperimentalChamberRig isDark={isDark} />
                <EarthFlame simTime={simTime} vision={vision} isDark={isDark} hideIllustrative={hideIllustrative} />

                <OrbitControls
                  enablePan={false}
                  minDistance={0.3}
                  maxDistance={1.4}
                  maxPolarAngle={Math.PI / 2 + 0.1}
                />
              </Canvas>
            </CanvasErrorBoundary>
          </div>

          {/* Chamber Footer Telemetry */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-[11px] font-mono text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Flame Geometry</span>
              <span className="font-bold text-orange-400">Elongated Teardrop</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Peak Temp</span>
              <span className="font-bold text-white">~1850 K</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Soot Luminescence</span>
              <span className="font-bold text-yellow-400">High (Yellow Tip)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Burn Rate K</span>
              <span className="font-bold text-white">1.35 mm²/s</span>
            </div>
          </div>
        </div>

        {/* RIGHT CHAMBER: ISS MICROGRAVITY / MOON / MARS */}
        <div className={`rounded-2xl border overflow-hidden relative ${
          isDark ? 'bg-[#030712] border-slate-800' : 'bg-slate-950 border-slate-300 shadow-md'
        }`}>
          {/* Chamber Header Badge */}
          <div className="absolute top-3 left-3 z-10 space-y-1 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-white shadow-lg backdrop-blur-md ${
                rightEnv === 'iss' ? 'bg-sky-500/90' : rightEnv === 'moon' ? 'bg-indigo-600/90' : 'bg-rose-600/90'
              }`}>
                {rightEnv === 'iss' && 'ISS — MICROGRAVITY (≈ 10⁻⁶g)'}
                {rightEnv === 'moon' && 'MOON — 0.166g (1.62 m/s²)'}
                {rightEnv === 'mars' && 'MARS — 0.38g (3.72 m/s²)'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/70 text-sky-300 border border-sky-500/40">
                {rightEnv === 'iss' ? 'DIFFUSION-DOMINATED' : rightEnv === 'moon' ? 'WEAK BUOYANCY' : 'PARTIAL BUOYANCY'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
              {rightEnv === 'iss' && 'Gr ≈ 0 • v_nc ≈ 0.00 m/s • Pure Fickian Molecular Diffusion'}
              {rightEnv === 'moon' && 'Gr ≈ 4.0 × 10³ • v_nc ≈ 0.26 m/s • Reduced Convection Rate'}
              {rightEnv === 'mars' && 'Gr ≈ 9.2 × 10³ • v_nc ≈ 0.40 m/s • Transitional Buoyancy Regime'}
            </p>
          </div>

          {/* 3D Canvas */}
          <div style={{ height: '440px' }}>
            <CanvasErrorBoundary label={`${rightEnv.toUpperCase()} Chamber`} fallbackHeight="440px">
              <Canvas camera={{ position: [0, 0.22, 0.68], fov: 50 }}>
                <color attach="background" args={[isDark ? '#030712' : '#090d16']} />
                <ambientLight intensity={isDark ? 0.25 : 0.35} />
                <pointLight position={[0, 0.35, 0.35]} intensity={1.2} color="#fb923c" />
                <pointLight position={[0, 0.1, 0.2]} intensity={0.8} color="#0284c7" />
                <directionalLight position={[-0.3, 0.5, 0.3]} intensity={0.4} />

                <ExperimentalChamberRig isDark={isDark} />
                <MicrogravityFlame
                  env={rightEnv}
                  simTime={simTime}
                  vision={vision}
                  selectedAnatomyId={selectedAnatomyId}
                  onSelectAnatomy={onSelectAnatomy}
                  isDark={isDark}
                  mlState={mlState}
                  D0={dropletD0}
                  hideIllustrative={hideIllustrative}
                />

                <OrbitControls
                  enablePan={false}
                  minDistance={0.3}
                  maxDistance={1.4}
                  maxPolarAngle={Math.PI / 2 + 0.1}
                />
              </Canvas>
            </CanvasErrorBoundary>
          </div>

          {/* Chamber Footer Telemetry */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-[11px] font-mono text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">
                {mlState ? 'PIML Regime' : 'Flame Geometry'}
              </span>
              <span className="font-bold text-sky-400">
                {mlState
                  ? `${mlState.phase.replace('_', ' ')}`
                  : (rightEnv === 'iss' ? 'Spherical Shell' : rightEnv === 'moon' ? 'Prolate Spheroid' : 'Transitional Teardrop')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">
                {mlState ? 'Predicted Diameter D̂' : 'Peak Temp'}
              </span>
              <span className="font-bold text-white">
                {mlState
                  ? `${mlState.d_mm.toFixed(2)} mm (D₀: ${dropletD0}mm)`
                  : (rightEnv === 'iss'
                      ? (simTime < 7.5 ? '~1720 K' : simTime < 13.5 ? '~800 K (Cool)' : 'Ambient')
                      : rightEnv === 'moon'
                      ? (simTime < 11 ? '~1760 K' : 'Ambient')
                      : (simTime < 9.5 ? '~1795 K' : 'Ambient'))}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">
                {mlState ? 'Phase Transition' : 'Soot Luminescence'}
              </span>
              <span className="font-bold text-blue-300">
                {mlState
                  ? (mlState.is_cool ? 'Cool Burning' : mlState.is_extinguished ? 'Extinguished' : `Cool @ ${mlState.t_trans.toFixed(1)}s`)
                  : (rightEnv === 'iss' ? 'Near-Zero (Blue Glow)' : rightEnv === 'moon' ? 'Low (Faint Orange Core)' : 'Moderate (Yellow Tip)')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">
                {mlState ? 'Burning Rate K̂' : 'Burn Rate K'}
              </span>
              <span className="font-bold text-white">
                {mlState
                  ? `${mlState.current_k.toFixed(2)} mm²/s`
                  : (rightEnv === 'iss' ? '0.72 mm²/s (-47%)' : rightEnv === 'moon' ? '0.95 mm²/s (-30%)' : '1.15 mm²/s (-15%)')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Limitation & Configuration Disclosure */}
      <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
        isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-bold">Scientific Boundary Condition:</strong> Not every flame on Earth is teardrop-shaped (e.g. flat flames, turbulent jets), nor is every space flame spherical (e.g. forced airflow in SAFFIRE or BASS stretches flames into wakes). These side-by-side chambers demonstrate the canonical isolated droplet configuration, where buoyancy effects are isolated with highest scientific clarity.
        </p>
      </div>
    </div>
  );
};
