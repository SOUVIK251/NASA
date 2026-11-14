import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// 1. FLEX MODE: CIR Droplet Combustion Rig
// ─────────────────────────────────────────────────────────────

export function EnhancedFlexFlame({
  state,
  playbackPhase,
  isDark = true,
  hideIllustrative = false
}: {
  state: any;
  playbackPhase: string;
  isDark?: boolean;
  hideIllustrative?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const hotGlowRef = useRef<THREE.Mesh>(null);
  const coolGlowRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const dropletDiameter = state?.D_mm ?? 3.5;
  const flameDiameter = state?.flame_diam_mm ?? 0;
  const hasHotFlame = state?._has_hot_flame ?? (playbackPhase === 'HOT_FLAME' || playbackPhase === 'IGNITING');
  const hasCoolFlame = state?._has_cool_flame ?? (playbackPhase === 'COOL_FLAME');
  const isExtinguished = state?._is_extinguished ?? (playbackPhase === 'EXTINGUISHED');

  // Scale: 1 mm = 0.038 scene units
  const dropletR = Math.max(0.005, dropletDiameter * 0.038);
  const flameR = flameDiameter > 0 ? flameDiameter * 0.038 : dropletR * 3.4;

  const PARTICLE_COUNT = 300;
  const { positions, lifetimes } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const life = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.07 + Math.random() * 0.07;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      life[i] = Math.random();
    }
    return { positions: pos, lifetimes: life };
  }, []);

  useFrame((_, delta) => {
    // Subtle steady breath in 0g
    if (hotGlowRef.current && hasHotFlame) {
      hotGlowRef.current.scale.setScalar(flameR);
    }
    if (coolGlowRef.current && hasCoolFlame) {
      coolGlowRef.current.scale.setScalar(dropletR * 3.8);
    }

    if (particlesRef.current && (hasHotFlame || hasCoolFlame)) {
      const geo = particlesRef.current.geometry;
      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Slow radial molecular diffusion
        arr[i * 3] += arr[i * 3] * delta * 0.12;
        arr[i * 3 + 1] += arr[i * 3 + 1] * delta * 0.12;
        arr[i * 3 + 2] += arr[i * 3 + 2] * delta * 0.12;

        const d = Math.sqrt(arr[i * 3] ** 2 + arr[i * 3 + 1] ** 2 + arr[i * 3 + 2] ** 2);
        if (d > 0.18) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = dropletR * 1.5;
          arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          arr[i * 3 + 2] = r * Math.cos(phi);
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* CIR Droplet Support: Orthogonal 14 µm Silicon Carbide cross-fibers */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.001, 0.001, 0.45, 8]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.001, 0.001, 0.45, 8]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>

      {/* Support Fiber Bead Mounts */}
      {[-0.22, 0.22].map((y, i) => (
        <mesh key={`post-${i}`} position={[0, y, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.02, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>
      ))}

      {/* Liquid Fuel Droplet (n-Heptane) */}
      <mesh>
        <sphereGeometry args={[dropletR, 32, 32]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          transmission={0.45}
          roughness={0.08}
          metalness={0.1}
          transparent
          opacity={isExtinguished ? 0.3 : 0.88}
        />
      </mesh>

      {/* Hot Flame Shell */}
      {hasHotFlame && (
        <>
          <mesh ref={hotGlowRef}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial
              color="#ea580c"
              emissive="#ea580c"
              emissiveIntensity={2.0}
              transparent
              opacity={0.35}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          {!hideIllustrative && (
            <mesh scale={[flameR * 1.08, flameR * 1.08, flameR * 1.08]}>
              <sphereGeometry args={[1, 24, 24]} />
              <meshBasicMaterial
                color="#fb923c"
                transparent
                opacity={0.12}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          )}
        </>
      )}

      {/* Cool Flame Shell (Pale Blue Low-Temperature Combustion) */}
      {hasCoolFlame && (
        <>
          <mesh ref={coolGlowRef}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={2.4}
              transparent
              opacity={0.4}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text
            position={[0, dropletR * 4.5, 0]}
            fontSize={0.022}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.002}
            outlineColor="#000"
          >
            COOL FLAME REGIME
          </Text>
        </>
      )}

      {/* Diffusion Particles (Illustrative - Hidden when hideIllustrative is true) */}
      {!hideIllustrative && (hasHotFlame || hasCoolFlame) && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={PARTICLE_COUNT}
              array={positions}
              itemSize={3}
              args={[positions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.006}
            color={hasCoolFlame ? '#60a5fa' : '#fb923c'}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. BASS-II MODE: Solid Material Flame Spread on PMMA Rod
// ─────────────────────────────────────────────────────────────

export function EnhancedBassFlame({
  state,
  isDark = true,
  hideIllustrative = false
}: {
  state: any;
  isDark?: boolean;
  hideIllustrative?: boolean;
}) {
  const flamePosMm = state?.flame_pos_mm ?? 0;
  const flameLenMm = state?.flame_length_mm ?? 0;
  const flameWidMm = state?.flame_width_mm ?? 9.0;
  const spreadRate = state?.spread_rate_cm_s ?? 0;
  const hasFlame = state?._has_flame ?? (flameLenMm > 0 || flamePosMm > 0);

  // Conversion: Sample rod = 100mm length (0.75 scene units), 10mm diameter (0.04 scene units)
  const scaleMm = 0.0075;
  const sampleLen = 100 * scaleMm; // 0.75
  const sampleRad = 5 * scaleMm; // 0.0375

  const flamePos = flamePosMm * scaleMm;
  const flameLen = Math.max(0.02, flameLenMm * scaleMm);
  const flameWid = Math.max(0.04, flameWidMm * scaleMm);

  const burnedLen = Math.min(sampleLen, flamePos);

  const flameMeshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (flameMeshRef.current && hasFlame) {
      const flicker = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.025;
      flameMeshRef.current.scale.set(1, flicker, flicker);
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {/* Duct Outline / Flow Guide Wireframe */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[sampleLen * 1.4, 0.16, 0.16]} />
        <meshBasicMaterial
          color={isDark ? '#334155' : '#cbd5e1'}
          wireframe
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Concurrent Airflow Velocity Arrow (10 cm/s concurrent) */}
      <group position={[-sampleLen / 2 - 0.08, 0.06, 0]}>
        <mesh position={[0.02, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.002, 0.002, 0.04, 8]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
        <mesh position={[0.045, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.006, 0.012, 8]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
        <Text
          position={[0.02, 0.015, 0]}
          fontSize={0.018}
          color="#06b6d4"
          rotation={[0, 0, -Math.PI / 2]}
        >
          Airflow 10 cm/s
        </Text>
      </group>

      {/* End Mounting Clamps */}
      {[-sampleLen / 2 - 0.01, sampleLen / 2 + 0.01].map((x, i) => (
        <mesh key={`clamp-${i}`} position={[x, 0, 0]}>
          <boxGeometry args={[0.02, 0.07, 0.07]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* 1. Virgin PMMA Rod (Clean Transparent/Milky Acrylic) */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[sampleRad, sampleRad, sampleLen, 32]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          transmission={0.8}
          roughness={0.1}
          metalness={0.05}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 2. Charred / Regressed Section (Behind Flame Front) */}
      {burnedLen > 0.01 && (
        <mesh position={[-sampleLen / 2 + burnedLen / 2, 0, 0]}>
          <cylinderGeometry args={[sampleRad * 0.72, sampleRad * 0.72, burnedLen, 24]} />
          <meshStandardMaterial color="#0f0702" roughness={0.98} metalness={0.05} />
        </mesh>
      )}

      {/* 3. Spreading Luminous Flame Front (Curved parabolic flame wrapped around rod) */}
      {hasFlame && (
        <group position={[-sampleLen / 2 + flamePos + flameLen / 2, 0, 0]}>
          <mesh ref={flameMeshRef}>
            <capsuleGeometry args={[flameWid * 0.65, flameLen * 0.7, 16, 16]} />
            <meshStandardMaterial
              color="#f97316"
              emissive="#ea580c"
              emissiveIntensity={2.2}
              transparent
              opacity={0.8}
              depthWrite={false}
            />
          </mesh>

          {/* Thermal radiation halo */}
          <mesh scale={[1.3, 1.3, 1.3]}>
            <capsuleGeometry args={[flameWid * 0.65, flameLen * 0.7, 12, 12]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.15}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Spread Rate Indicator Text */}
          {spreadRate > 0 && (
            <Text
              position={[flameLen * 0.6 + 0.03, 0, 0]}
              fontSize={0.022}
              color="#fbbf24"
              anchorX="left"
              rotation={[0, 0, -Math.PI / 2]}
            >
              {`→ v_spread: ${spreadRate.toFixed(3)} cm/s`}
            </Text>
          )}
        </group>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. SAFFIRE MODE: Spacecraft-Scale Fire in Cygnus Duct
// ─────────────────────────────────────────────────────────────

export function EnhancedSaffireFlame({
  state,
  isDark = true,
  hideIllustrative = false
}: {
  state: any;
  isDark?: boolean;
  hideIllustrative?: boolean;
}) {
  const flameLenCm = state?.flame_length_cm ?? 0;
  const flameWidCm = state?.flame_width_cm ?? 0;
  const flamePosCm = state?.flame_pos_cm ?? 0;
  const tempK = state?.peak_temp_K ?? 298;
  const hasFlame = state?.flame_exists ?? (flameLenCm > 0);

  // Sample dimensions: 0.406m width x 0.94m length (scaled to 0.28m x 0.62m)
  const sheetW = 0.28;
  const sheetH = 0.62;

  const flameLen = Math.max(0.01, (flameLenCm / 94) * sheetH);
  const flameWid = Math.max(0.02, (flameWidCm / 40.6) * sheetW);
  const flamePos = (flamePosCm / 94) * sheetH;

  // Temperature color gradient: 600K deep red to 1650K bright white-orange
  const tempNorm = Math.min(1, Math.max(0, (tempK - 600) / (1650 - 600)));
  const flameColor = new THREE.Color(
    0.8 + tempNorm * 0.2,
    0.2 + tempNorm * 0.5,
    0.05 + tempNorm * 0.4
  );

  return (
    <group position={[0, 0, 0]}>
      {/* Cygnus Flow Duct Enclosure & Honeycomb Air Inlet Baffle */}
      <mesh position={[0, -0.05, -0.16]}>
        <boxGeometry args={[sheetW * 1.5, sheetH * 1.25, 0.04]} />
        <meshStandardMaterial
          color={isDark ? '#111827' : '#e2e8f0'}
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>

      {/* Cygnus Airflow Grid at bottom */}
      <mesh position={[0, -sheetH / 2 - 0.04, 0]}>
        <boxGeometry args={[sheetW * 1.2, 0.03, 0.1]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>

      {/* Concurrent Airflow Label (20 cm/s in SAFFIRE-I) */}
      <Text
        position={[0, -sheetH / 2 - 0.07, 0]}
        fontSize={0.016}
        color="#06b6d4"
        anchorX="center"
      >
        ▲ Airflow: 20 cm/s (Concurrent) ▲
      </Text>

      {/* 1. SIBAL Fabric Sample Sheet (Cotton / Fiberglass blend) */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[sheetW, sheetH]} />
        <meshStandardMaterial
          color="#d4b494"
          roughness={0.92}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Tension Clamp Frames on Sides */}
      {[-sheetW / 2, sheetW / 2].map((x, i) => (
        <mesh key={`edge-${i}`} position={[x, 0, 0.005]}>
          <boxGeometry args={[0.012, sheetH * 1.02, 0.01]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} />
        </mesh>
      ))}

      {/* 2. Burned & Charred Section Behind the Flame */}
      {flamePos > 0.01 && (
        <mesh position={[0, -sheetH / 2 + flamePos / 2, 0.002]}>
          <planeGeometry args={[sheetW * 0.96, flamePos]} />
          <meshStandardMaterial
            color="#110502"
            roughness={0.99}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 3. Wide Flame Front Creeping Across the Fabric */}
      {hasFlame && (
        <group position={[0, -sheetH / 2 + flamePos + flameLen / 2, 0.015]}>
          <mesh>
            <boxGeometry args={[flameWid, flameLen, 0.03]} />
            <meshStandardMaterial
              color={flameColor}
              emissive={flameColor}
              emissiveIntensity={2.2}
              transparent
              opacity={0.85}
              depthWrite={false}
            />
          </mesh>

          {/* Thermal radiant glow (Illustrative estimate - hidden when hideIllustrative is true) */}
          {!hideIllustrative && (
            <mesh scale={[1.15, 1.3, 1]}>
              <planeGeometry args={[flameWid, flameLen]} />
              <meshBasicMaterial
                color={flameColor}
                transparent
                opacity={0.25}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          )}
        </group>
      )}

      {/* Real NASA Dimension Callout */}
      <Text
        position={[sheetW / 2 + 0.03, 0, 0]}
        fontSize={0.016}
        color="#94a3b8"
        anchorX="left"
      >
        0.41m × 0.94m SIBAL Sheet
      </Text>
    </group>
  );
}
