/**
 * NASA Microgravity Combustion Learning Laboratory & 3D Simulator
 *
 * Core Experiences:
 *   1. EARTH VS MICROGRAVITY (Default View): Side-by-side synchronized 3D chambers
 *   2. PHYSICS VISION: Multi-layer transport overlays (buoyancy, airflow, O2, heat, vapor, products)
 *   3. INTERACTIVE FLAME ANATOMY: Clickable scientific callouts on droplet combustion
 *   4. NASA FLIGHT EXPERIMENT LAB: High-fidelity flight playback for FLEX, BASS-II, SAFFIRE
 *   5. SPACECRAFT FIRE SAFETY: Operational fire safety scenarios for astronauts & exploration cabins
 *   6. EDUCATIONAL STORYTELLING: 7-stage guided journey with Beginner & Advanced modes
 *   7. SCIENTIFIC VALIDATION: Mathematical documentation and physical verification
 *
 * Aesthetic: Clean scientific space laboratory (Light theme by default with Deep Space Dark toggle).
 */

import React, {
  useState, useEffect, useCallback, useRef, useMemo, Suspense
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  runSimulation, fetchSimulatorInfo, type SimulatorInput
} from '../services/api';
import {
  Flame, RotateCcw, Play, Pause, Thermometer, Wind,
  AlertTriangle, Cpu, BookOpen, Layers, BarChart2,
  Settings, Satellite, Compass, ShieldAlert, Sparkles,
  ShieldCheck, Moon, Sun, Database, Eye, FlaskConical,
  Activity, Zap
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

import { CanvasErrorBoundary } from '../components/CanvasErrorBoundary';
import {
  CompareChamber3D
} from '../components/simulator/CompareChamber3D';
import {
  PhysicsVisionControls,
  type PhysicsVisionState
} from '../components/simulator/PhysicsVisionControls';
import {
  FlameAnatomyInspector
} from '../components/simulator/FlameAnatomyInspector';
import {
  EnhancedFlexFlame,
  EnhancedBassFlame,
  EnhancedSaffireFlame
} from '../components/simulator/EnhancedExperiment3D';
import {
  SpacecraftFireSafetyPanel
} from '../components/simulator/SpacecraftFireSafetyPanel';
import {
  EducationalStoryteller
} from '../components/simulator/EducationalStoryteller';
import {
  ScientificValidationModal
} from '../components/simulator/ScientificValidationModal';
import {
  SimulatorAIAnalystPanel
} from '../components/simulator/SimulatorAIAnalystPanel';
import {
  ScientificInstrumentPanel
} from '../components/simulator/ScientificInstrumentPanel';
import {
  WhatIsHappeningPanel
} from '../components/simulator/WhatIsHappeningPanel';
import {
  computeFlameState
} from '../components/simulator/FlameStateEngine';
import {
  WhatAmILookingAtPanel,
  type WhatAmILookingAtData
} from '../components/simulator/WhatAmILookingAtPanel';
import { GuidedTourModal } from '../components/simulator/GuidedTourModal';
import { SceneProvenanceLegend } from '../components/simulator/SceneProvenanceLegend';
import { ConceptExplainersModal } from '../components/simulator/ConceptExplainersModal';
import { RawDataTableModal } from '../components/simulator/RawDataTableModal';
import { GlossaryTooltip } from '../components/simulator/GlossaryTooltip';
import { setSimulatorContext } from '../services/simulatorContextStore';
import { SimulatorContextData } from '../types';

const API = '/api';

// ─── API HELPERS ─────────────────────────────────────────────

async function fetchDatasets() {
  const r = await fetch(`${API}/datasets`);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

async function fetchDatasetExperiments(datasetId: string) {
  const r = await fetch(`${API}/datasets/${datasetId}/experiments`);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

async function fetchTimeseries(experimentId: string) {
  const r = await fetch(`${API}/experiments/${experimentId}/timeseries`);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

async function fetchExperimentStats(experimentId: string) {
  const r = await fetch(`${API}/experiments/${experimentId}/statistics`);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

// ─── MODEL FLAME COMPONENT (For reduced-order physics sandbox) ───

function ModelFlameParticles({
  simResult,
  isDark,
  hideIllustrative = false
}: {
  simResult: any;
  isDark: boolean;
  hideIllustrative?: boolean;
}) {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 500;

  const { positions, lifetimes, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const life = new Float32Array(count);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.08;
      pos[i * 3 + 1] = Math.random() * 0.15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
      life[i] = Math.random();
      sz[i] = Math.random() * 0.02 + 0.008;
    }
    return { positions: pos, lifetimes: life, sizes: sz };
  }, []);

  const flameColor = useMemo(() => {
    if (!simResult?.flame_exists) return new THREE.Color(0.2, 0.2, 0.2);
    const temp = simResult.flame_temperature_K || 1500;
    const color = simResult.flame_color_indicator || '';
    if (color.includes('blue')) return new THREE.Color(0.2, 0.6, 1.0);
    if (temp > 2000) return new THREE.Color(1.0, 0.85, 0.2);
    if (temp > 1500) return new THREE.Color(1.0, 0.55, 0.1);
    return new THREE.Color(0.9, 0.35, 0.05);
  }, [simResult]);

  useFrame((_, delta) => {
    if (!particlesRef.current || !simResult?.flame_exists || hideIllustrative) return;
    const geo = particlesRef.current.geometry;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const isSpherical = (simResult.flame_shape || 'spherical').includes('spherical');
    const buoyancyFactor = isSpherical ? 0.01 : 0.08;

    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += (buoyancyFactor + Math.random() * 0.01) * delta * 4;
      if (posArr[i * 3 + 1] > 0.22) {
        posArr[i * 3 + 1] = 0.02;
        posArr[i * 3] = (Math.random() - 0.5) * (isSpherical ? 0.1 : 0.04);
        posArr[i * 3 + 2] = (Math.random() - 0.5) * (isSpherical ? 0.1 : 0.04);
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group position={[0, 0.08, 0]}>
      {/* Combustion core */}
      <mesh position={[0, 0.02, 0]}>
        <sphereGeometry args={[0.018, 24, 24]} />
        <meshStandardMaterial
          color={flameColor}
          emissive={flameColor}
          emissiveIntensity={2.0}
          transparent
          opacity={simResult?.flame_exists ? 0.85 : 0.1}
          wireframe={hideIllustrative}
        />
      </mesh>

      {!hideIllustrative && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} args={[positions, 3]} />
            <bufferAttribute attach="attributes-aLife" count={count} array={lifetimes} itemSize={1} args={[lifetimes, 1]} />
            <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} args={[sizes, 1]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.01}
            color={flameColor}
            transparent
            opacity={simResult?.flame_exists ? 0.75 : 0.0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// MASTER SIMULATOR VIEW
// ─────────────────────────────────────────────────────────────

type LabViewMode = 'compare' | 'datasets' | 'physics_model' | 'safety';

interface SimulatorViewProps {
  onNavigate?: (module: string, param?: string) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({ onNavigate }) => {
  // Theme state: Light theme by default as per user specification, with dark mode toggle
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);

  // Active laboratory mode: Default to EXPERIENCE 1: EARTH VS MICROGRAVITY
  const [labMode, setLabMode] = useState<LabViewMode>('compare');

  // Scientific validation modal state
  const [isValidationOpen, setIsValidationOpen] = useState<boolean>(false);

  // ─── Phase 2: Mode Toggle & Interactive Features ──────────────
  const [viewMode, setViewMode] = useState<'simple' | 'researcher'>('simple');
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isConceptsOpen, setIsConceptsOpen] = useState<boolean>(false);
  const [activeConcept, setActiveConcept] = useState<string | undefined>(undefined);
  const [isRawDataOpen, setIsRawDataOpen] = useState<boolean>(false);
  const [hideIllustrative, setHideIllustrative] = useState<boolean>(false);

  // Auto-launch guided tour for first-time visitors
  useEffect(() => {
    try {
      const seen = localStorage.getItem('flame_in_freefall_tour_seen');
      if (!seen) {
        setIsTourOpen(true);
      }
    } catch (_) {}
  }, []);

  // ─── Experience 2: Physics Vision State ───────────────────────
  const [vision, setVision] = useState<PhysicsVisionState>({
    buoyancy: true,
    airflow: true,
    oxygenTransport: true,
    heatTransfer: false,
    fuelVapour: false,
    combustionProducts: false
  });

  const handleVisionChange = (key: keyof PhysicsVisionState, val: boolean) => {
    setVision(prev => ({ ...prev, [key]: val }));
  };

  const handleToggleAllVision = (enable: boolean) => {
    setVision({
      buoyancy: enable,
      airflow: enable,
      oxygenTransport: enable,
      heatTransfer: enable,
      fuelVapour: enable,
      combustionProducts: enable
    });
  };

  // ─── Experience 3: Flame Anatomy State ────────────────────────
  const [selectedAnatomyId, setSelectedAnatomyId] = useState<string | null>('reaction_zone');

  // ─── Experience 4: Dataset Playback State ──────────────────────
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [experiments, setExperiments] = useState<any[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<string>('');
  const [timeseriesData, setTimeseriesData] = useState<any>(null);
  const [experimentStats, setExperimentStats] = useState<any>(null);
  const [loadingDataset, setLoadingDataset] = useState(false);
  const [datasetError, setDatasetError] = useState<string>('');

  const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentState, setCurrentState] = useState<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);

  // ─── Experience 7: Model-based state ─────────────────────────
  const [simResult, setSimResult] = useState<any>(null);
  const [simInfo, setSimInfo] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simParams, setSimParams] = useState<SimulatorInput>({
    gravity_environment: 'iss',
    oxygen_pct: 21,
    airflow_velocity_cm_s: 0,
    pressure_kPa: 101.325,
    initial_temperature_K: 298.15,
    fuel_type: 'heptane'
  });

  // Load dataset index on mount
  useEffect(() => {
    fetchDatasets()
      .then(d => {
        setDatasets(d.datasets ?? []);
        if (d.datasets?.length > 0) setSelectedDataset(d.datasets[0].dataset_id);
      })
      .catch(() => setDatasetError('Could not load NASA datasets from backend.'));

    fetchSimulatorInfo().then(setSimInfo).catch(() => {});
  }, []);

  // Update experiments when dataset changes
  useEffect(() => {
    if (!selectedDataset) return;
    setExperiments([]);
    setSelectedExperiment('');
    setTimeseriesData(null);
    setCurrentTime(0);
    setPlaybackState('idle');
    fetchDatasetExperiments(selectedDataset)
      .then(d => {
        setExperiments(d.experiments ?? []);
        if (d.experiments?.length > 0) setSelectedExperiment(d.experiments[0].experiment_id);
      })
      .catch(e => setDatasetError(`Failed to load experiments: ${e.message}`));
  }, [selectedDataset]);

  const loadExperiment = useCallback(async () => {
    if (!selectedExperiment) return;
    setLoadingDataset(true);
    setDatasetError('');
    setPlaybackState('idle');
    setCurrentTime(0);
    try {
      const [ts, stats] = await Promise.all([
        fetchTimeseries(selectedExperiment),
        fetchExperimentStats(selectedExperiment)
      ]);
      setTimeseriesData(ts);
      setExperimentStats(stats);
      if (ts.data?.length > 0) setCurrentState(ts.data[0]);
    } catch (e: any) {
      setDatasetError(`Failed to load experiment: ${e.message}`);
    } finally {
      setLoadingDataset(false);
    }
  }, [selectedExperiment]);

  // Interpolate state
  const getStateAtTime = useCallback((t: number) => {
    const rows = timeseriesData?.data;
    if (!rows || rows.length === 0) return null;

    let prev = rows[0], next = rows[rows.length - 1];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].time_s <= t) prev = rows[i];
      if (rows[i].time_s >= t) { next = rows[i]; break; }
    }

    const t0 = prev.time_s, t1 = next.time_s;
    if (t0 === t1) return { ...prev, _interpolated: false };

    const alpha = (t - t0) / (t1 - t0);
    const result: any = {};
    for (const k of Object.keys(prev)) {
      const v0 = prev[k], v1 = next[k];
      if (typeof v0 === 'number' && typeof v1 === 'number') {
        result[k] = v0 + (v1 - v0) * alpha;
      } else {
        result[k] = prev[k];
      }
    }
    result._interpolated = true;
    return result;
  }, [timeseriesData]);

  // Playback animation loop
  const playbackLoop = useCallback((timestamp: number) => {
    if (!timeseriesData) return;
    const duration = timeseriesData.duration_s;
    if (lastTimestampRef.current === 0) lastTimestampRef.current = timestamp;
    const dtMs = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;
    const dtS = (dtMs / 1000) * playbackSpeed;

    setCurrentTime(prev => {
      const next = Math.min(prev + dtS, duration);
      const state = getStateAtTime(next);
      setCurrentState(state);
      if (next >= duration) {
        setPlaybackState('paused');
        return duration;
      }
      return next;
    });

    if (playbackState === 'playing') {
      animFrameRef.current = requestAnimationFrame(playbackLoop);
    }
  }, [timeseriesData, playbackSpeed, playbackState, getStateAtTime]);

  useEffect(() => {
    if (playbackState === 'playing') {
      lastTimestampRef.current = 0;
      animFrameRef.current = requestAnimationFrame(playbackLoop);
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [playbackState, playbackLoop]);

  const handleRunModel = useCallback(async () => {
    setSimLoading(true);
    try {
      const result = await runSimulation(simParams);
      setSimResult(result);
    } catch (e) { /* silent */ }
    setSimLoading(false);
  }, [simParams]);

  useEffect(() => {
    if (labMode === 'physics_model') handleRunModel();
  }, [labMode]);

  const selectedDatasetInfo = datasets.find(d => d.dataset_id === selectedDataset);
  const selectedExpInfo = experiments.find(e => e.experiment_id === selectedExperiment);
  const investigationType = selectedDatasetInfo?.investigation_type ?? '';
  const duration = timeseriesData?.duration_s ?? 0;

  // Chart data
  const chartData = useMemo(() => {
    const rows = timeseriesData?.data ?? [];
    if (investigationType === 'DROPLET_COMBUSTION') {
      return rows.map((r: any) => ({
        t: parseFloat(r.time_s?.toFixed(2)),
        D: parseFloat((r.D_mm ?? 0).toFixed(3)),
        D2: parseFloat((r.D2_mm2 ?? 0).toFixed(3)),
        K: parseFloat((r.burn_rate_K_mm2_s ?? 0).toFixed(3)),
        phase: r.phase,
      }));
    }
    if (investigationType === 'SOLID_MATERIAL_COMBUSTION') {
      return rows.map((r: any) => ({
        t: parseFloat(r.time_s?.toFixed(1)),
        spread: parseFloat((r.spread_rate_cm_s ?? 0).toFixed(4)),
        flame_len: parseFloat((r.flame_length_mm ?? 0).toFixed(1)),
        pos: parseFloat((r.flame_pos_mm ?? 0).toFixed(1)),
      }));
    }
    if (investigationType === 'LARGE_SCALE_SPACECRAFT_FIRE') {
      return rows.map((r: any) => ({
        t: parseFloat(r.time_s?.toFixed(1)),
        fl: parseFloat((r.flame_length_cm ?? 0).toFixed(1)),
        fw: parseFloat((r.flame_width_cm ?? 0).toFixed(1)),
        temp: parseFloat((r.peak_temp_K ?? 0).toFixed(0)),
      }));
    }
    return [];
  }, [timeseriesData, investigationType]);

  // ─── AI Simulator Context Synthesis & Store Synchronization ───
  const activeSimulatorContext = useMemo<SimulatorContextData>(() => {
    if (labMode === 'physics_model') {
      const gMap: Record<string, number> = { iss: 0.0, earth: 9.81, moon: 1.62, mars: 3.72 };
      return {
        selected_experiment: `Physics Model Sandbox (${simParams.fuel_type.toUpperCase()})`,
        investigation_name: 'Analytical Reduced-Order Model',
        experiment_id: `MODEL-${simParams.fuel_type.toUpperCase()}`,
        dataset_id: 'ANALYTICAL_MODEL',
        gravity_environment: simParams.gravity_environment === 'iss' ? 'ISS Microgravity (≈0g)' :
                             simParams.gravity_environment === 'earth' ? 'Earth Gravity (1g)' :
                             simParams.gravity_environment === 'moon' ? 'Moon Partial Gravity (0.166g)' :
                             simParams.gravity_environment === 'mars' ? 'Mars Partial Gravity (0.38g)' : 'Custom',
        gravity_m_s2: gMap[simParams.gravity_environment] ?? 0.0,
        fuel_or_material: simParams.fuel_type === 'heptane' ? 'n-Heptane (Liquid Droplet)' :
                          simParams.fuel_type === 'pmma' ? 'PMMA Acrylic (Solid Rod)' :
                          simParams.fuel_type === 'cellulose' ? 'Cellulose Cotton (SIBAL)' : 'Methane (Gas)',
        fuel_phase: simParams.fuel_type === 'heptane' ? 'liquid_droplet' :
                    simParams.fuel_type === 'methane' ? 'gas' : 'solid',
        oxygen_pct: simParams.oxygen_pct,
        airflow_velocity_cm_s: simParams.airflow_velocity_cm_s,
        pressure_kPa_or_atm: `${simParams.pressure_kPa} kPa`,
        temperature_K_or_C: `${simParams.initial_temperature_K} K`,
        current_playback_time: 0,
        current_phase: simResult?.flame_exists ? 'Steady analytical combustion' : 'Extinguished',
        measurements: simResult ? {
          flame_shape: simResult.flame_shape,
          grashof_number: simResult.grashof_number,
          damkohler_number: simResult.damkohler_number,
          adiabatic_temp_K: simResult.flame_temperature_K,
          burning_rate_mg_s: simResult.mass_burning_rate_mg_s,
          heat_release_W: simResult.heat_release_rate_W
        } : {},
        measured_keys: [],
        illustrative_keys: ['flame_shape', 'adiabatic_temp_K'],
        model_outputs: simResult || {},
        unavailable_parameters: ['measured_in_flight_telemetry', 'real_soot_volume_fraction', 'piv_velocity_field'],
        data_quality: 'REDUCED_ORDER_PHYSICS_MODEL',
        data_attribution: 'Classical combustion analytical scaling equations (Grashof, Damköhler, Reynolds). NOT CFD.',
        scientific_limitations: simResult?.model_limitations || ['Analytical estimates with ±30-50% uncertainty']
      };
    }

    if (labMode === 'compare') {
      return {
        selected_experiment: 'Dual Chamber: Earth (1g) vs Microgravity (0g)',
        investigation_name: 'Earth vs ISS Transport Comparison',
        experiment_id: 'COMPARE-EARTH-ISS',
        dataset_id: 'FLEX_AND_BASS_BASELINE',
        gravity_environment: 'Earth 1g vs ISS 0g Side-by-Side',
        gravity_m_s2: 0.0,
        fuel_or_material: 'n-Heptane / PMMA / Hydrocarbon Comparison',
        fuel_phase: 'liquid / solid',
        oxygen_pct: 21.0,
        airflow_velocity_cm_s: 0.0,
        pressure_kPa_or_atm: '1.0 atm (101.3 kPa)',
        temperature_K_or_C: '298.15 K',
        current_playback_time: 0,
        current_phase: 'Synchronized visual comparison',
        measurements: {
          earth_buoyancy_Gr: 250000,
          iss_buoyancy_Gr: 0,
          earth_flame_shape: 'teardrop',
          iss_flame_shape: 'spherical_or_trailing',
          selected_anatomy_node: selectedAnatomyId || 'reaction_zone'
        },
        measured_keys: ['gravity_ms2', 'flame_shape'],
        illustrative_keys: ['flame_layers'],
        unavailable_parameters: ['direct_moon_mars_flight_telemetry'],
        data_quality: 'SYNCHRONIZED_RESEARCH_BASELINE',
        data_attribution: 'NASA Glenn Research Center & Physical Sciences Informatics (PSI)',
        compare_mode: true
      };
    }

    // Default: 'datasets' mode
    const flameStateDetail = computeFlameState(investigationType, currentState, currentTime, duration);

    return {
      selected_experiment: selectedExpInfo?.name || selectedExperiment || 'NASA Flight Experiment',
      investigation_name: selectedDatasetInfo?.name || selectedDataset || 'NASA PSI Flight Test',
      dataset_id: selectedDataset,
      experiment_id: selectedExperiment,
      gravity_environment: selectedDatasetInfo?.gravity || 'ISS Microgravity (≈0g)',
      gravity_m_s2: selectedDatasetInfo?.gravity_ms2 ?? 0.0,
      fuel_or_material: selectedExpInfo?.fuel || 'n-Heptane',
      fuel_phase: selectedExpInfo?.fuel_phase || 'liquid_droplet',
      oxygen_pct: selectedExpInfo?.oxygen_pct ?? 21.0,
      airflow_velocity_cm_s: selectedExpInfo?.airflow_cm_s ?? (selectedExpInfo?.airflow === 'quiescent' ? 0.0 : 10.0),
      pressure_kPa_or_atm: selectedExpInfo?.pressure_atm ? `${selectedExpInfo.pressure_atm} atm` : '1.0 atm',
      temperature_K_or_C: currentState?.peak_temp_K ? `${currentState.peak_temp_K.toFixed(0)} K` : (currentState?.temp_K ? `${currentState.temp_K.toFixed(0)} K` : '298.15 K'),
      current_playback_time: currentTime,
      current_phase: `${flameStateDetail.state}: ${flameStateDetail.reasons.join(', ')}`,
      measurements: currentState || {},
      measured_keys: selectedExpInfo?.measured_measurements || ['time_s', 'flame_pos', 'diameter'],
      illustrative_keys: selectedExpInfo?.illustrative_measurements || ['flame_diam_mm', 'temp_K'],
      unavailable_parameters: ['local_soot_volume_fraction', 'radical_species_OH_CH', 'invasive_3d_piv_velocity'],
      model_outputs: {
        flame_state: flameStateDetail.state,
        flame_state_reasons: flameStateDetail.reasons
      },
      data_quality: selectedExpInfo?.data_quality || 'DIGITIZED_FROM PUBLICATION',
      data_attribution: selectedDatasetInfo?.data_attribution || 'NASA Physical Sciences Informatics',
      scientific_limitations: [
        'Experimental flight telemetry digitized from published literature.',
        'Visual demonstration values are physically illustrative and not direct thermocouple readings unless noted.'
      ]
    };
  }, [labMode, simParams, simResult, selectedDatasetInfo, selectedExpInfo, selectedDataset, selectedExperiment, currentState, currentTime, selectedAnatomyId, investigationType, duration]);

  const currentFlameState = useMemo(() => {
    return computeFlameState(investigationType, currentState, currentTime, duration);
  }, [investigationType, currentState, currentTime, duration]);

  useEffect(() => {
    setSimulatorContext(activeSimulatorContext);
  }, [activeSimulatorContext]);

  // ─── Phase 2: What Am I Looking At? Data Synthesis ────────────
  const whatAmILookingAtData = useMemo<WhatAmILookingAtData>(() => {
    if (labMode === 'compare') {
      return {
        experimentName: 'Earth (1g) vs Microgravity (0g) Combustion Comparison',
        investigationType: 'SYNCHRONIZED_PHYSICAL_COMPARISON',
        fuel: 'Liquid Hydrocarbon Droplet (n-Heptane / PMMA Baseline)',
        gravity: 'Earth 1.0g (9.81 m/s²) vs ISS Freefall 0g (≈ 10⁻⁶g)',
        gravityM_s2: 0.0,
        oxygenPct: 21.0,
        pressure: '1.0 atm (101.3 kPa)',
        airflow: 'Quiescent (Natural Convection on Earth vs Pure Diffusion in 0g)',
        facility: 'Side-by-side synchronized laboratory comparison',
        provenanceTier: 'CALCULATED',
        plainLanguageSummary:
          'You are looking at two identical combustion chambers running side by side: on Earth, hot buoyant air stretches the flame upward into a flickering teardrop; in orbit, the absence of buoyancy creates a serene, spherical ball of fire.',
        fireSafetySignificance:
          'Without buoyant draft, flames spread slower initially but can persist undetected at lower oxygen levels and lack natural upward smoke dispersion.',
        researcherNote:
          'Grashof number scales as Gr = g·β·ΔT·L³/ν². On Earth Gr ≈ 2.5×10⁴ (strong natural convection). In orbit Gr ≈ 0 (pure diffusion-controlled Stefan flow, Da >> 1).'
      };
    }

    if (labMode === 'physics_model') {
      const gMap: Record<string, { label: string; val: number }> = {
        iss: { label: 'ISS Microgravity (≈ 0g = 0.0 m/s²)', val: 0.0 },
        earth: { label: 'Earth Standard Gravity (1g = 9.81 m/s²)', val: 9.81 },
        moon: { label: 'Moon Partial Gravity (0.166g = 1.62 m/s²)', val: 1.62 },
        mars: { label: 'Mars Partial Gravity (0.38g = 3.72 m/s²)', val: 3.72 }
      };
      const gInfo = gMap[simParams.gravity_environment] || { label: 'Custom', val: 0.0 };
      return {
        experimentName: `Reduced-Order Physics Model (${simParams.fuel_type.toUpperCase()})`,
        investigationType: 'ANALYTICAL_SCALING_MODEL',
        fuel:
          simParams.fuel_type === 'heptane'
            ? 'n-Heptane (Liquid Droplet)'
            : simParams.fuel_type === 'pmma'
            ? 'PMMA Acrylic (Solid Rod)'
            : simParams.fuel_type === 'cellulose'
            ? 'Cellulose Cotton (SIBAL Fabric)'
            : 'Methane (Gas)',
        gravity: gInfo.label,
        gravityM_s2: gInfo.val,
        oxygenPct: simParams.oxygen_pct,
        pressure: `${simParams.pressure_kPa} kPa`,
        airflow: `${simParams.airflow_velocity_cm_s} cm/s forced flow`,
        facility: 'Browser Analytical Aerothermal Scaling Engine (Spalding/Grashof/Damköhler)',
        provenanceTier: 'MODEL_PREDICTION',
        isModeled: true,
        plainLanguageSummary:
          'You are testing a mathematical model that calculates how combustion changes under custom planetary gravity, oxygen levels, and airflow speeds.',
        fireSafetySignificance:
          'Analytical models allow mission planners to predict flame stability and extinction risks for lunar habitats (1/6g) and Martian surface modules (3/8g) before flight testing.',
        researcherNote:
          'Uses classical Spalding B-number, Grashof natural convection scaling, and Damköhler reaction timescales. Theoretical uncertainty is ±30-50% compared to full 3D CFD or flight measurements.'
      };
    }

    if (labMode === 'safety') {
      return {
        experimentName: 'NASA Spacecraft Fire Safety Operations Matrix',
        investigationType: 'OPERATIONAL_FIRE_SAFETY',
        fuel: 'Multiple Exploration Materials (Polymers, Wiring, Fabrics)',
        gravity: 'Exploration Flight Environments (ISS, Gateway, Lunar Surface)',
        oxygenPct: 21.0,
        pressure: '101.3 kPa (Standard) / 56.5 kPa (Exploration Atmosphere)',
        airflow: 'Forced cabin circulation (0 to 30 cm/s)',
        facility: 'NASA Spacecraft Fire Safety Consortium (GRC, JSC, KSC)',
        provenanceTier: 'CALCULATED',
        plainLanguageSummary:
          'You are reviewing real astronaut fire protection procedures, showing how microgravity physics dictates detector placement, oxygen thresholds, and suppression techniques.',
        fireSafetySignificance:
          'On Earth, smoke rises to the ceiling where alarms are mounted. In space, smoke wanders with cabin ventilation fans, so detectors must be placed inside air ducts.'
      };
    }

    // Default: 'datasets' mode
    const isSpice = selectedDataset === 'SPICE' || selectedDatasetInfo?.investigation_type === 'METADATA_ONLY';
    if (isSpice) {
      return {
        experimentName: selectedDatasetInfo?.name || 'SPICE Smoke Point In Co-flow Experiment',
        investigationType: 'METADATA_ONLY',
        fuel: 'Gaseous Hydrocarbons (Ethylene / Propane)',
        gravity: '0 g (ISS Microgravity, MSG facility)',
        gravityM_s2: 0.0,
        oxygenPct: 21.0,
        pressure: '1.0 atm',
        airflow: 'Co-flow duct airflow',
        facility: 'ISS Microgravity Science Glovebox (MSG)',
        provenanceTier: 'METADATA_ONLY',
        plainLanguageSummary:
          'SPICE investigated smoke yield and soot formation limits in microgravity. Raw flight video and sensor timeseries are currently being prepared for open-science release into the NASA PSI repository.',
        fireSafetySignificance:
          'Accurate soot emission thresholds are vital to calibrate spacecraft optical smoke detectors and avoid false alarms in orbit.',
        researcherNote:
          'Status: METADATA_ONLY. Direct numerical timeseries awaiting public PSI ingest (Urban et al., 2018).'
      };
    }

    if (investigationType === 'DROPLET_COMBUSTION') {
      return {
        experimentName: selectedExpInfo?.name || selectedExperiment || 'FLEX Droplet Combustion Experiment',
        investigationType: 'DROPLET_COMBUSTION',
        fuel: selectedExpInfo?.fuel || 'n-Heptane (Liquid Droplet)',
        gravity: '0 g (ISS Microgravity, CIR facility)',
        gravityM_s2: 0.0,
        oxygenPct: selectedExpInfo?.oxygen_pct ?? 21.0,
        pressure: selectedExpInfo?.pressure_atm ? `${selectedExpInfo.pressure_atm} atm` : '1.0 atm',
        airflow: '0 cm/s (Quiescent Stagnant Atmosphere)',
        facility: 'ISS Combustion Integrated Rack (CIR / MDCA)',
        provenanceTier: (selectedExpInfo?.data_quality as any) || 'DIGITIZED_FROM_PUBLICATION',
        plainLanguageSummary:
          'You are watching a single liquid fuel droplet burn in orbital freefall. With no gravity to pull heavy cold air down, the flame forms a calm, glowing blue-and-yellow sphere until shrinking to extinction or transitioning into an invisible cool flame.',
        fireSafetySignificance:
          'Droplet studies revealed low-temperature cool flames that can continue burning invisibly after the hot flame extinguishes, presenting a hidden re-ignition hazard.',
        researcherNote:
          'Diameter evolution follows the D²-law: d(D²)/dt = -K. Deviations indicate finite-rate kinetics or cool flame transitions at lower temperatures (~600-800 K).'
      };
    }

    if (investigationType === 'SOLID_MATERIAL_COMBUSTION') {
      return {
        experimentName: selectedExpInfo?.name || selectedExperiment || 'BASS-II Flame Spread on Solid PMMA',
        investigationType: 'SOLID_MATERIAL_COMBUSTION',
        fuel: selectedExpInfo?.fuel || 'PMMA Acrylic (Solid Cylinder Rod)',
        gravity: '0 g (ISS Microgravity, MSG facility)',
        gravityM_s2: 0.0,
        oxygenPct: selectedExpInfo?.oxygen_pct ?? 21.0,
        pressure: '1.0 atm (101.3 kPa)',
        airflow: `${selectedExpInfo?.airflow_cm_s ?? 1.5} cm/s (Opposed slow flow)`,
        facility: 'ISS Microgravity Science Glovebox (MSG)',
        provenanceTier: (selectedExpInfo?.data_quality as any) || 'DIGITIZED_FROM_PUBLICATION',
        plainLanguageSummary:
          'You are watching fire spread across a solid plastic rod inside a miniature wind tunnel aboard the Space Station. A very gentle breeze keeps the flame alive by replenishing oxygen without blowing it out.',
        fireSafetySignificance:
          'Flames in spacecraft cabins do not rely on natural rising air—cabin ventilation fans provide the airflow that sustains fire spread on plastics and wire insulation.',
        researcherNote:
          'Opposed-flow flame spread over thick fuels is governed by conduction through the gas-phase and fuel matrix. BASS-II verified that low-velocity forced flows (1-5 cm/s) can sustain combustion at lower oxygen concentrations than Earth 1g.'
      };
    }

    if (investigationType === 'LARGE_SCALE_SPACECRAFT_FIRE') {
      return {
        experimentName: selectedExpInfo?.name || selectedExperiment || 'Saffire Large-Scale Spacecraft Material Fire',
        investigationType: 'LARGE_SCALE_SPACECRAFT_FIRE',
        fuel: selectedExpInfo?.fuel || 'Cellulose / Fiberglass Blend (SIBAL fabric)',
        gravity: '0 g (Cygnus Spacecraft Freefall)',
        gravityM_s2: 0.0,
        oxygenPct: selectedExpInfo?.oxygen_pct ?? 21.0,
        pressure: '1.0 atm',
        airflow: `${selectedExpInfo?.airflow_cm_s ?? 20.0} cm/s (Concurrent ventilation flow)`,
        facility: 'Cygnus Resupply Vehicle (Uncrewed post-departure)',
        provenanceTier: (selectedExpInfo?.data_quality as any) || 'DIGITIZED_FROM_PUBLICATION',
        plainLanguageSummary:
          'You are watching a large sheet of fabric burn inside an actual uncrewed spacecraft after leaving the ISS. NASA ignited full-scale materials in orbit to measure how real fires spread in a true pressurized cabin.',
        fireSafetySignificance:
          'Saffire proved that real spacecraft fires grow differently from small laboratory samples, informing the emergency ventilation and hatch-sealing procedures for the Artemis Moon missions.',
        researcherNote:
          'Concurrent flow produces a trailing flame whose length scales with Damköhler number and fuel pyrolyzate flux. Validated that microgravity upward flame spread lacks turbulent buoyancy transitions seen on Earth.'
      };
    }

    return {
      experimentName: selectedExpInfo?.name || 'NASA Flight Experiment',
      investigationType: selectedDatasetInfo?.name || 'NASA PSI Flight Test',
      fuel: 'Hydrocarbon test fuel',
      gravity: '0 g (ISS Microgravity)',
      gravityM_s2: 0.0,
      oxygenPct: 21.0,
      pressure: '1.0 atm',
      airflow: 'Quiescent',
      facility: 'NASA Physical Sciences Informatics',
      provenanceTier: 'DIGITIZED_FROM_PUBLICATION',
      plainLanguageSummary: 'NASA microgravity flight experiment exploring combustion dynamics without buoyancy.',
      fireSafetySignificance: 'Provides empirical boundary conditions for spacecraft fire detection and extinction.'
    };
  }, [labMode, simParams, selectedDataset, selectedExperiment, selectedDatasetInfo, selectedExpInfo, investigationType]);

  return (
    <div className={`space-y-6 transition-colors duration-300 font-sans ${
      isDarkTheme ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    } p-2 sm:p-4 rounded-3xl`}>

      {/* ─── LABORATORY HEADER & WORKSTATION CONTROLS ─── */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all ${
        isDarkTheme ? 'bg-slate-900/90 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Satellite className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold tracking-widest text-sky-600 dark:text-sky-400 uppercase">
              NASA Physical Sciences Informatics • 3D Space Laboratory
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Flame in Freefall Interactive Laboratory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
            Understand why fire behaves differently in space through direct physical comparison, transport layer vision, anatomical inspection, and NASA flight data.
          </p>
        </div>

        {/* Top Action Buttons & Mode Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Phase 2: Mode Toggle (Simple Mode vs Researcher Mode) */}
          <div className="flex items-center rounded-xl border p-0.5 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setViewMode('simple')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'simple'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Intuitive explanations and clear terminology for new users"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simple Mode</span>
            </button>
            <button
              onClick={() => setViewMode('researcher')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'researcher'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Aerothermal nomenclature, uncertainty bounds, and numerical telemetry table"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Researcher Mode</span>
            </button>
          </div>

          {/* 60s Guided Tour Button */}
          <button
            onClick={() => setIsTourOpen(true)}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              isDarkTheme
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
            }`}
            title="Launch 60-Second Guided Tour"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>60s Tour</span>
          </button>

          {/* Interactive Concept Explainers Button */}
          <button
            onClick={() => {
              setActiveConcept(undefined);
              setIsConceptsOpen(true);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              isDarkTheme
                ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300'
            }`}
            title="Interactive Concept Demos (D²-Law, Cool Flames, LOI, Grashof Number)"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-500" />
            <span>Concept Demos</span>
          </button>

          {/* Raw Data Table Button (Accessible in Researcher mode or when data loaded) */}
          {timeseriesData && (
            <button
              onClick={() => setIsRawDataOpen(true)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                isDarkTheme
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
              }`}
              title="Inspect Numerical Telemetry & Export CSV"
            >
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Raw Data</span>
            </button>
          )}

          {/* Scientific Validation Audit Button */}
          <button
            onClick={() => setIsValidationOpen(true)}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              isDarkTheme
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
            }`}
            title="Inspect Physics Scaling Validation"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Physics Audit</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              isDarkTheme
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Toggle Laboratory Light / Deep Space Dark Mode"
          >
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            <span className="hidden md:inline">{isDarkTheme ? 'Dark' : 'Light'}</span>
          </button>
        </div>
      </div>

      {/* ─── 4 MAIN EXPERIENCES TAB BAR ─── */}
      <div className={`p-1.5 rounded-2xl border flex flex-wrap gap-1.5 w-full transition-all ${
        isDarkTheme ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-200/70 border-slate-300'
      }`}>
        <button
          onClick={() => setLabMode('compare')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            labMode === 'compare'
              ? 'bg-sky-500 text-white shadow-md'
              : isDarkTheme
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>1. EARTH VS MICROGRAVITY (DEFAULT)</span>
        </button>

        <button
          onClick={() => setLabMode('datasets')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            labMode === 'datasets'
              ? 'bg-emerald-600 text-white shadow-md'
              : isDarkTheme
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>2. NASA EXPERIMENT LAB (FLEX / BASS / SAFFIRE)</span>
        </button>

        <button
          onClick={() => setLabMode('physics_model')}
          className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            labMode === 'physics_model'
              ? 'bg-purple-600 text-white shadow-md'
              : isDarkTheme
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>3. PHYSICS MODEL SANDBOX</span>
        </button>

        <button
          onClick={() => setLabMode('safety')}
          className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            labMode === 'safety'
              ? 'bg-red-600 text-white shadow-md'
              : isDarkTheme
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>4. SPACECRAFT FIRE SAFETY</span>
        </button>
      </div>

      {/* ─── PHASE 2: WHAT AM I LOOKING AT? PERSISTENT / COLLAPSIBLE CARD ─── */}
      <WhatAmILookingAtPanel
        data={whatAmILookingAtData}
        mode={viewMode}
        isDark={isDarkTheme}
        onOpenTour={() => setIsTourOpen(true)}
        onOpenExplainers={(concept) => {
          setActiveConcept(concept);
          setIsConceptsOpen(true);
        }}
      />

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* EXPERIENCE 1 & 2 & 3: EARTH VS MICROGRAVITY (DEFAULT) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {labMode === 'compare' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Visual Provenance Legend with Hide Illustrative Toggle */}
          <SceneProvenanceLegend
            hideIllustrative={hideIllustrative}
            onToggleHideIllustrative={setHideIllustrative}
            investigationType="DROPLET_COMBUSTION"
            isDark={isDarkTheme}
          />

          {/* Dual 3D Chambers */}
          <CompareChamber3D
            vision={vision}
            selectedAnatomyId={selectedAnatomyId}
            onSelectAnatomy={setSelectedAnatomyId}
            isDark={isDarkTheme}
            hideIllustrative={hideIllustrative}
          />

          {/* Experience 2: Physics Vision Controls Toolbar */}
          <PhysicsVisionControls
            vision={vision}
            onChange={handleVisionChange}
            onToggleAll={handleToggleAllVision}
            isDark={isDarkTheme}
          />

          {/* Experience 3: Flame Anatomy Inspector */}
          <FlameAnatomyInspector
            selectedNodeId={selectedAnatomyId}
            onSelectNode={setSelectedAnatomyId}
            isDark={isDarkTheme}
          />

          {/* Dual Chamber AI Earth vs ISS Analysis Panel */}
          <SimulatorAIAnalystPanel
            simulatorContext={activeSimulatorContext}
            isDark={isDarkTheme}
            onOpenFullAnalyst={() => onNavigate?.('ai-analyst')}
            defaultAction="compare_earth_microgravity"
          />
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* EXPERIENCE 4: NASA EXPERIMENT LABORATORY (FLEX, BASS, SAFFIRE) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {labMode === 'datasets' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4">
            {/* Left: 3D canvas + controls */}
            <div className="space-y-3">
              {/* Dataset loading error banner with Retry */}
              {datasetError && (
                <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{datasetError || 'Unable to load experiment data.'}</span>
                  </div>
                  <button
                    onClick={loadExperiment}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Dataset/Experiment selectors */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDarkTheme ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    NASA Flight Telemetry Replay (CIR & Cygnus)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase tracking-wider font-semibold">
                      NASA Flight Investigation
                    </label>
                    <select
                      value={selectedDataset}
                      onChange={e => setSelectedDataset(e.target.value)}
                      className={`w-full text-xs font-mono rounded-lg px-3 py-2 border outline-none cursor-pointer ${
                        isDarkTheme ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-50 text-slate-900 border-slate-300'
                      }`}
                    >
                      {datasets.map((d: any) => (
                        <option key={d.dataset_id} value={d.dataset_id}>
                          {d.psi_id} — {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase tracking-wider font-semibold">
                      Test Run Telemetry
                    </label>
                    <select
                      value={selectedExperiment}
                      onChange={e => setSelectedExperiment(e.target.value)}
                      className={`w-full text-xs font-mono rounded-lg px-3 py-2 border outline-none cursor-pointer ${
                        isDarkTheme ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-50 text-slate-900 border-slate-300'
                      }`}
                    >
                      {experiments.map((e: any) => (
                        <option key={e.experiment_id} value={e.experiment_id}>
                          {e.experiment_id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={loadExperiment}
                      disabled={!selectedExperiment || loadingDataset}
                      className="w-full px-4 py-2 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      {loadingDataset ? (
                        <><Activity className="w-3.5 h-3.5 animate-spin" /> Loading NASA Flight Data...</>
                      ) : (
                        <><Database className="w-3.5 h-3.5" /> Load Flight Run</>
                      )}
                    </button>
                  </div>
                </div>

                {selectedDatasetInfo && (
                  <div className="text-[10px] font-mono text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span><strong className="text-slate-700 dark:text-slate-300">PSI ID:</strong> {selectedDatasetInfo.psi_id}</span>
                    <span><strong className="text-slate-700 dark:text-slate-300">PI:</strong> {selectedDatasetInfo.principal_investigator}</span>
                    <span><strong className="text-slate-700 dark:text-slate-300">Facility:</strong> {selectedDatasetInfo.platform}</span>
                    <span><strong className="text-slate-700 dark:text-slate-300">Gravity:</strong> {selectedDatasetInfo.gravity_ms2} m/s² (0g)</span>
                  </div>
                )}
              </div>

              {/* SPICE Honest Empty State (Requirement 7) vs Measured Canvas */}
              {(selectedDataset === 'SPICE' || selectedDatasetInfo?.investigation_type === 'METADATA_ONLY') ? (
                <div className="p-8 rounded-2xl border border-sky-500/30 bg-sky-500/5 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center mx-auto">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/30 uppercase">
                      Open-Science Archive Ingest
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-2">
                      Awaiting Open-Science Data Release (SPICE)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                    Smoke and gaseous soot emission raw video and calibrated sensor records from the SPICE investigation are currently being prepared for open-science release into the NASA Physical Sciences Informatics (PSI) system.
                  </p>
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-left max-w-md mx-auto space-y-1">
                    <div><strong className="text-slate-700 dark:text-slate-300">Principal Investigator:</strong> Dr. David Urban (NASA GRC)</div>
                    <div><strong className="text-slate-700 dark:text-slate-300">Investigation:</strong> Smoke Point In Co-flow Experiment (SPICE)</div>
                    <div><strong className="text-slate-700 dark:text-slate-300">Facility:</strong> ISS Microgravity Science Glovebox (MSG)</div>
                    <div><strong className="text-slate-700 dark:text-slate-300">Current Status:</strong> METADATA_ONLY (See Urban et al., 2018 in Master Manifest)</div>
                  </div>
                  <div className="pt-2">
                    <a
                      href="https://psi.nasa.gov"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold transition-all shadow-sm"
                    >
                      <span>Check NASA PSI Portal</span>
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  {/* Visual Provenance Legend with Hide Illustrative Toggle */}
                  <SceneProvenanceLegend
                    hideIllustrative={hideIllustrative}
                    onToggleHideIllustrative={setHideIllustrative}
                    investigationType={investigationType}
                    isDark={isDarkTheme}
                  />

                  {/* 3D Canvas with WebGL Error Boundary */}
                  <div className="relative bg-[#030712] rounded-2xl border border-slate-800 overflow-hidden" style={{ height: '420px' }}>
                    <CanvasErrorBoundary label="NASA Flight Experiment Apparatus" fallbackHeight="420px">
                      <Canvas camera={{ position: [0, 0.22, 0.72], fov: 50 }}>
                        <color attach="background" args={['#030712']} />
                        <ambientLight intensity={0.3} />
                        <pointLight position={[0, 0.35, 0.35]} intensity={1.5} color="#ea580c" />
                        <pointLight position={[0.2, 0.1, 0.2]} intensity={0.8} color="#0284c7" />

                        <Suspense fallback={null}>
                          {investigationType === 'DROPLET_COMBUSTION' && (
                            <EnhancedFlexFlame
                              state={currentState}
                              playbackPhase={currentState?.phase ?? ''}
                              isDark={isDarkTheme}
                              hideIllustrative={hideIllustrative}
                            />
                          )}
                          {investigationType === 'SOLID_MATERIAL_COMBUSTION' && (
                            <EnhancedBassFlame
                              state={currentState}
                              isDark={isDarkTheme}
                              hideIllustrative={hideIllustrative}
                            />
                          )}
                          {investigationType === 'LARGE_SCALE_SPACECRAFT_FIRE' && (
                            <EnhancedSaffireFlame
                              state={currentState}
                              isDark={isDarkTheme}
                              hideIllustrative={hideIllustrative}
                            />
                          )}
                        </Suspense>

                        <OrbitControls enablePan={false} minDistance={0.2} maxDistance={2.0} />
                      </Canvas>
                    </CanvasErrorBoundary>

                    {/* Overlays */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {currentState?.phase && (
                        <div className="text-[10px] font-mono font-bold bg-black/80 border border-slate-700 text-sky-300 rounded px-2 py-1 shadow-md">
                          ● Phase: {String(currentState.phase).replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Playback Controls */}
              {timeseriesData && (
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDarkTheme ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-500">
                      <span>Telemetry Timestamp: <strong className="text-slate-900 dark:text-white">{currentTime.toFixed(2)}s</strong></span>
                      <span>Total Duration: {duration.toFixed(2)}s</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={duration}
                      step={duration / 500}
                      value={currentTime}
                      onChange={e => {
                        const t = parseFloat(e.target.value);
                        setCurrentTime(t);
                        setCurrentState(getStateAtTime(t));
                        if (playbackState === 'playing') setPlaybackState('paused');
                      }}
                      className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setPlaybackState('playing')}
                      disabled={playbackState === 'playing' || !timeseriesData}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold disabled:opacity-40 cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Play Telemetry
                    </button>
                    <button
                      onClick={() => setPlaybackState('paused')}
                      disabled={playbackState !== 'playing'}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold disabled:opacity-40 cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </button>
                    <button
                      onClick={() => {
                        setPlaybackState('idle');
                        setCurrentTime(0);
                        setCurrentState(timeseriesData?.data?.[0] ?? null);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-1.5 border ${
                        isDarkTheme ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>

                    <div className="flex items-center gap-1 ml-auto text-[10px] font-mono">
                      <span className="text-slate-400">Speed:</span>
                      {[0.5, 1, 2].map(spd => (
                        <button
                          key={spd}
                          onClick={() => setPlaybackSpeed(spd)}
                          className={`px-2 py-1 rounded cursor-pointer ${
                            playbackSpeed === spd
                              ? 'bg-emerald-600 text-white font-bold'
                              : isDarkTheme ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {spd}×
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Synchronized Recharts */}
              {timeseriesData && chartData.length > 0 && (
                <div className={`p-4 rounded-2xl border ${
                  isDarkTheme ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-emerald-500" />
                      Synchronized Telemetry Curves
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                      PUBLISHED NASA LITERATURE
                    </span>
                  </div>

                  {investigationType === 'DROPLET_COMBUSTION' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-mono text-slate-500 mb-1">Droplet D² (mm²) vs Time — D²-Law Regression</p>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#1e293b' : '#e2e8f0'} />
                            <XAxis dataKey="t" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                            <ReferenceLine x={currentTime} stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 2" />
                            <Line type="monotone" dataKey="D2" stroke="#ea580c" strokeWidth={2} dot={false} name="D² (mm²)" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-slate-500 mb-1">Diameter D (mm) vs Time</p>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#1e293b' : '#e2e8f0'} />
                            <XAxis dataKey="t" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                            <ReferenceLine x={currentTime} stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 2" />
                            <Line type="monotone" dataKey="D" stroke="#0284c7" strokeWidth={2} dot={false} name="D (mm)" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {investigationType === 'SOLID_MATERIAL_COMBUSTION' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-mono text-slate-500 mb-1">Flame Spread Rate (cm/s) vs Time</p>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#1e293b' : '#e2e8f0'} />
                            <XAxis dataKey="t" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                            <ReferenceLine x={currentTime} stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 2" />
                            <Line type="monotone" dataKey="spread" stroke="#ea580c" strokeWidth={2} dot={false} name="Spread (cm/s)" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-slate-500 mb-1">Flame Length (mm) vs Time</p>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#1e293b' : '#e2e8f0'} />
                            <XAxis dataKey="t" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                            <ReferenceLine x={currentTime} stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 2" />
                            <Line type="monotone" dataKey="flame_len" stroke="#0284c7" strokeWidth={2} dot={false} name="Length (mm)" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {investigationType === 'LARGE_SCALE_SPACECRAFT_FIRE' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-mono text-slate-500 mb-1">Flame Length (cm) vs Time</p>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#1e293b' : '#e2e8f0'} />
                            <XAxis dataKey="t" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                            <ReferenceLine x={currentTime} stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 2" />
                            <Line type="monotone" dataKey="fl" stroke="#ea580c" strokeWidth={2} dot={false} name="Length (cm)" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-slate-500 mb-1">Peak Temperature (K) vs Time</p>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#1e293b' : '#e2e8f0'} />
                            <XAxis dataKey="t" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                            <ReferenceLine x={currentTime} stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 2" />
                            <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} name="Temp (K)" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Scientific Instrument Panel & Aerothermal Interpretation */}
            <div className="space-y-4">
              <ScientificInstrumentPanel
                currentTime={currentTime}
                duration={duration}
                state={currentState}
                meta={selectedExpInfo}
                investigationType={investigationType}
                flameState={currentFlameState}
                isInterpolated={currentState?._interpolated}
                isDark={isDarkTheme}
                mode={viewMode}
                onOpenExplainers={(c) => {
                  setActiveConcept(c);
                  setIsConceptsOpen(true);
                }}
                onOpenRawData={() => setIsRawDataOpen(true)}
              />

              <WhatIsHappeningPanel
                investigationType={investigationType}
                state={currentState}
                meta={selectedExpInfo}
                flameState={currentFlameState}
                isDark={isDarkTheme}
              />
            </div>
          </div>

          {/* IN-SIMULATOR AI EXPLANATION & RESEARCH ASSISTANT PANEL */}
          <SimulatorAIAnalystPanel
            simulatorContext={activeSimulatorContext}
            isDark={isDarkTheme}
            onOpenFullAnalyst={() => onNavigate?.('ai-analyst')}
            defaultAction="understand_happening"
          />
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* EXPERIENCE 3: REDUCED-ORDER PHYSICS SANDBOX */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {labMode === 'physics_model' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
            <div className="space-y-3">
              {/* Educational Disclaimer */}
              <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Reduced-Order Physics Engine:</strong> Computes scaling relationships (Grashof, Damköhler, Reynolds, and Spalding B-number). Carries ±30-50% uncertainty. Clearly separated from raw NASA flight data.
                </p>
              </div>

              {/* Moon / Mars Exploration Disclaimer (Requirement 7) */}
              {(simParams.gravity_environment === 'moon' || simParams.gravity_environment === 'mars') && (
                <div className="p-3.5 rounded-2xl border border-purple-500/40 bg-purple-500/10 text-purple-900 dark:text-purple-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  <p>
                    <strong>[MODELED / EXPLORATORY SCENARIO]:</strong> No direct long-duration combustion flight tests have been conducted on lunar (0.166g = 1.62 m/s²) or Martian (0.38g = 3.72 m/s²) surfaces. Values are extrapolated via Grashof natural convection scaling (Gr ∝ g·β·ΔT·L³/ν²). These predictions provide initial sizing boundaries for Artemis/Mars habitats, not empirical benchmarks.
                  </p>
                </div>
              )}

              {/* Visual Provenance Legend with Hide Illustrative Toggle */}
              <SceneProvenanceLegend
                hideIllustrative={hideIllustrative}
                onToggleHideIllustrative={setHideIllustrative}
                investigationType="PHYSICS_MODEL"
                isDark={isDarkTheme}
              />

              {/* 3D Model Sandbox View */}
              <div className="relative bg-[#030712] rounded-2xl border border-slate-800 overflow-hidden" style={{ height: '420px' }}>
                <CanvasErrorBoundary label="Physics Model Chamber" fallbackHeight="420px">
                  <Canvas camera={{ position: [0, 0.22, 0.68], fov: 50 }}>
                    <color attach="background" args={['#030712']} />
                    <ambientLight intensity={0.25} />
                    <pointLight position={[0, 0.35, 0.35]} intensity={1.5} color="#ea580c" />

                    <ModelFlameParticles simResult={simResult} isDark={isDarkTheme} hideIllustrative={hideIllustrative} />

                    <OrbitControls enablePan={false} minDistance={0.3} maxDistance={1.6} />
                  </Canvas>
                </CanvasErrorBoundary>

                {simResult && (
                  <div className="absolute top-3 left-3 text-[10px] font-mono bg-black/80 border border-slate-700 text-white rounded px-2.5 py-1">
                    {simResult.flame_exists ? `● SHAPE: ${simResult.flame_shape?.toUpperCase()}` : '○ NO FLAME (EXTINGUISHED)'}
                  </div>
                )}
              </div>

              {/* Analytical Model Outputs */}
              {simResult && (
                <div className={`p-4 rounded-2xl border ${
                  isDarkTheme ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-500" />
                    Dimensionless Quantities & Flame Outputs
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] font-mono">
                    {[
                      { label: 'Flame Shape', val: simResult.flame_shape },
                      { label: 'Grashof Number (Gr)', termKey: 'grashof_number', val: simResult.grashof_number?.toFixed(1) },
                      { label: 'Damköhler (Da)', termKey: 'damkohler_number', val: simResult.damkohler_number?.toFixed(1) },
                      { label: 'Buoyancy Velocity', val: `${simResult.natural_convection_velocity_m_s?.toFixed(2)} m/s` },
                      { label: 'Adiabatic Temp', val: `${simResult.flame_temperature_K?.toFixed(0)} K` },
                      { label: 'Burning Rate', termKey: 'spalding_b_number', val: `${simResult.mass_burning_rate_mg_s?.toFixed(3)} mg/s` },
                      { label: 'Heat Release', val: `${simResult.heat_release_rate_W?.toFixed(2)} W` },
                      { label: 'Transport Regime', val: simResult.oxygen_transport_mode },
                      { label: 'Extinction Risk', termKey: 'loi_extinction', val: simResult.extinction_risk },
                    ].map(({ label, val, termKey }) => (
                      <div key={label} className={`p-2 rounded-xl border ${
                        isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-500 uppercase block font-semibold">{label}</span>
                          {termKey && (
                            <GlossaryTooltip termKey={termKey as any} mode={viewMode}>
                              <span className="text-sky-500 text-[9px] cursor-pointer">?</span>
                            </GlossaryTooltip>
                          )}
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{val ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Parameter Sliders Panel */}
            <div className={`p-4 rounded-2xl border space-y-4 ${
              isDarkTheme ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Settings className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">
                  Combustion Environment Inputs
                </span>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-semibold">Gravity Environment</label>
                <select
                  value={simParams.gravity_environment}
                  onChange={e => setSimParams(prev => ({ ...prev, gravity_environment: e.target.value as any }))}
                  className={`w-full text-xs font-mono rounded-lg px-3 py-2 border outline-none cursor-pointer ${
                    isDarkTheme ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-50 text-slate-900 border-slate-300'
                  }`}
                >
                  <option value="iss">ISS Microgravity (≈ 0g = 0.0 m/s²)</option>
                  <option value="earth">Earth (1g = 9.81 m/s²)</option>
                  <option value="moon">Moon (0.166g = 1.62 m/s²)</option>
                  <option value="mars">Mars (0.38g = 3.72 m/s²)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-semibold">Fuel Selection</label>
                <select
                  value={simParams.fuel_type}
                  onChange={e => setSimParams(prev => ({ ...prev, fuel_type: e.target.value as any }))}
                  className={`w-full text-xs font-mono rounded-lg px-3 py-2 border outline-none cursor-pointer ${
                    isDarkTheme ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-50 text-slate-900 border-slate-300'
                  }`}
                >
                  <option value="heptane">n-Heptane (Liquid Droplet, FLEX)</option>
                  <option value="pmma">PMMA Acrylic (Solid Rod, BASS-II)</option>
                  <option value="cellulose">Cellulose Cotton (SIBAL, SAFFIRE)</option>
                  <option value="methane">Methane (Gaseous Reference)</option>
                </select>
              </div>

              {[
                { key: 'oxygen_pct', label: 'Oxygen Concentration', min: 5, max: 50, step: 0.5, unit: '%' },
                { key: 'airflow_velocity_cm_s', label: 'Forced Airflow Velocity', min: 0, max: 40, step: 1, unit: 'cm/s' },
                { key: 'pressure_kPa', label: 'Ambient Pressure', min: 20, max: 150, step: 1, unit: 'kPa' },
                { key: 'initial_temperature_K', label: 'Ambient Temperature', min: 220, max: 400, step: 2, unit: 'K' },
              ].map(({ key, label, min, max, step, unit }) => (
                <div key={key}>
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span className="text-slate-500 font-semibold">{label}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{(simParams as any)[key]} {unit}</span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={(simParams as any)[key]}
                    onChange={e => setSimParams(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              ))}

              <button
                onClick={handleRunModel}
                disabled={simLoading}
                className="w-full py-2.5 rounded-xl text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                {simLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                {simLoading ? 'Recalculating...' : 'Recompute Physics Equations'}
              </button>
            </div>
          </div>

          {/* PHYSICS SANDBOX AI EXPLANATION PANEL */}
          <SimulatorAIAnalystPanel
            simulatorContext={activeSimulatorContext}
            isDark={isDarkTheme}
            onOpenFullAnalyst={() => onNavigate?.('ai-analyst')}
            defaultAction="explain_physics"
          />
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* EXPERIENCE 4: SPACECRAFT FIRE SAFETY */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {labMode === 'safety' && (
        <div className="animate-in fade-in duration-300">
          <SpacecraftFireSafetyPanel isDark={isDarkTheme} />
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* EXPERIENCE 6: GUIDED 7-STEP STORYTELLING SEQUENCE (DOCKED) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <EducationalStoryteller isDark={isDarkTheme} />
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* EXPERIENCE 7: SCIENTIFIC VALIDATION AUDIT MODAL */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <ScientificValidationModal
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        isDark={isDarkTheme}
      />

      {/* ─── PHASE 2: 60-SECOND GUIDED TOUR MODAL ─── */}
      <GuidedTourModal
        isOpen={isTourOpen}
        onClose={() => {
          setIsTourOpen(false);
          try {
            localStorage.setItem('flame_in_freefall_tour_seen', 'true');
          } catch (_) {}
        }}
        isDark={isDarkTheme}
      />

      {/* ─── PHASE 2: INTERACTIVE CONCEPT EXPLAINERS MODAL ─── */}
      <ConceptExplainersModal
        isOpen={isConceptsOpen}
        initialConcept={activeConcept}
        onClose={() => setIsConceptsOpen(false)}
        isDark={isDarkTheme}
      />

      {/* ─── PHASE 2: RESEARCHER RAW NUMERICAL TELEMETRY TABLE ─── */}
      <RawDataTableModal
        isOpen={isRawDataOpen}
        onClose={() => setIsRawDataOpen(false)}
        timeseriesData={timeseriesData}
        datasetId={selectedDataset}
        experimentId={selectedExperiment}
        isDark={isDarkTheme}
      />
    </div>
  );
};

export default SimulatorView;
