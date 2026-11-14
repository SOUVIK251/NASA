import React from 'react';
import {
  X,
  Droplet,
  Flame,
  Zap,
  Layers,
  Thermometer,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export interface AnatomyNode {
  id: string;
  name: string;
  scientificTerm: string;
  radiusMm: number; // typical radius in mm for a 3.5mm n-heptane droplet in 0g
  color: string;
  category: 'fuel' | 'phase_change' | 'vapour' | 'reaction' | 'envelope' | 'cool_flame';
  whatHappensHere: string;
  microgravitySignificance: string;
  earthVsSpaceContrast: string;
  measuredVsSchematic: string;
  keyEquation?: string;
  nasaDiscoveryNote?: string;
}

export const ANATOMY_NODES: Record<string, AnatomyNode> = {
  liquid_droplet: {
    id: 'liquid_droplet',
    name: 'Liquid Fuel Droplet',
    scientificTerm: 'Condensed-Phase Fuel Core (r ≤ r_d)',
    radiusMm: 1.75, // D_0/2 = 1.75 mm
    color: '#38bdf8',
    category: 'fuel',
    whatHappensHere: 'Liquid hydrocarbon fuel (n-heptane, C₇H₁₆). Surface tension (≈ 20 mN/m) pulls the liquid into an almost geometrically perfect sphere in 0g because there is no gravitational flattening.',
    microgravitySignificance: 'Without gravity, the droplet stays suspended without needing a heavy holder or falling. It burns with perfect 1D radial symmetry, making it the purest mathematical testbed for combustion theory.',
    earthVsSpaceContrast: 'On Earth, gravity pulls a liquid droplet downward, causing it to drip, sag, or distort on its support fiber. In 0g, Bond number Bo = g·Δρ·R²/γ ≈ 0, so capillary forces dominate completely.',
    measuredVsSchematic: 'MEASURED: Droplet diameter D(t) is directly tracked from high-speed digital video on the ISS CIR rack. Diameter squared follows the D²-law: D²(t) = D₀² - K·t.',
    keyEquation: 'D^2(t) = D_0^2 - K \\cdot t \\quad (K \\approx 0.75\\text{ mm}^2/\\text{s in 0g})'
  },
  evaporating_interface: {
    id: 'evaporating_interface',
    name: 'Evaporating Interface',
    scientificTerm: 'Phase-Change Boundary Layer (r = r_d)',
    radiusMm: 1.85,
    color: '#06b6d4',
    category: 'phase_change',
    whatHappensHere: 'The liquid-gas phase boundary where liquid heptane absorbs latent heat of vaporization (h_fg ≈ 318 kJ/kg) from the flame and vaporizes into gas at its boiling point (T_boil ≈ 371.5 K / 98.4°C).',
    microgravitySignificance: 'Fuel mass flux is governed by conductive heat feedback from the flame back to the liquid surface: ṁ″ = (k_g / c_p) · (dT/dr)|_s. In 0g, this feedback is purely radial and unperturbed by chaotic convective drafts.',
    earthVsSpaceContrast: 'On Earth, asymmetric upward air flow cools the bottom and overheats the top of the droplet. In space, vaporization occurs uniformly across 100% of the surface area.',
    measuredVsSchematic: 'SCHEMATIC / DERIVED: Interface temperature is clamped at near-saturation conditions; mass regression rate is derived from measured d(D²)/dt.',
    keyEquation: '\\dot{m} = 4\\pi r_d \\frac{k_g}{c_p} \\ln(1 + B_q)'
  },
  fuel_vapour_zone: {
    id: 'fuel_vapour_zone',
    name: 'Fuel Vapour Zone',
    scientificTerm: 'Inner Fuel-Rich Conduction Layer (r_d < r < r_f)',
    radiusMm: 3.5,
    color: '#fbbf24',
    category: 'vapour',
    whatHappensHere: 'Pure fuel vapor diffuses radially outward toward the flame. The local equivalence ratio φ is well above stoichiometric (φ >> 1); absolutely no oxygen is present here because it is consumed immediately at the flame front.',
    microgravitySignificance: 'Acts as a thermal cushion. High molecular weight hydrocarbon vapor has low thermal diffusivity, regulating how quickly heat reaches the droplet.',
    earthVsSpaceContrast: 'In 1g, the vapor is compressed into a narrow boundary layer of fractions of a millimeter. In 0g, the vapor shell expands into a wide, thick concentric dome.',
    measuredVsSchematic: 'SCHEMATIC MODEL: Concentration profile derived from Fick’s law of diffusion; direct optical species concentration inside the hot envelope requires laser absorption spectroscopy.',
    keyEquation: 'J_{fuel} = -\\rho D_{fuel} \\frac{dY_{fuel}}{dr}'
  },
  reaction_zone: {
    id: 'reaction_zone',
    name: 'Stoichiometric Reaction Zone',
    scientificTerm: 'High-Temperature Flame Sheet (r = r_f, φ = 1)',
    radiusMm: 6.0,
    color: '#f97316',
    category: 'reaction',
    whatHappensHere: 'The precise spherical shell where diffusing fuel vapor meets diffusing oxygen in exact stoichiometric proportion (C₇H₁₆ + 11 O₂ → 7 CO₂ + 8 H₂O). Temperatures peak here at 1600 K to 1850 K.',
    microgravitySignificance: 'Because there is no upward buoyancy to stretch the flame, the reaction zone forms a calm, glowing spherical shell ~3 to 4 times the droplet radius.',
    earthVsSpaceContrast: 'On Earth, buoyant acceleration stretches this reaction zone into a tall, flickering cone. In space, it is a motionless luminous sphere emitting pale blue chemiluminescence from excited CH* and C₂* radicals.',
    measuredVsSchematic: 'MEASURED / DIGITIZED: Visible flame diameter measured via CIR color and intensified cameras on ISS. Flame standoff ratio r_f/r_d typically ranges between 3.0 and 5.0.',
    keyEquation: 'T_{peak} \\approx 1750\\text{ K}, \\quad \\phi = 1.0'
  },
  flame_envelope: {
    id: 'flame_envelope',
    name: 'Thermal & Product Envelope',
    scientificTerm: 'Radiative & Post-Flame Diffusion Shell (r > r_f)',
    radiusMm: 9.0,
    color: '#ef4444',
    category: 'envelope',
    whatHappensHere: 'Hot combustion products (CO₂, H₂O) and soot precursor aggregates expand outward into ambient space. Thermal radiation (q_rad ∝ σ·T⁴) cools the gas, while oxygen diffuses inward from the far field.',
    microgravitySignificance: 'Without a chimney effect to whisk away exhaust, combustion products linger. The buildup of CO₂ and H₂O insulates the flame but gradually starves it of oxygen, eventually leading to radiative extinction.',
    earthVsSpaceContrast: 'On Earth, 80% of heat is carried away by rising convection. In space, 100% of heat must leave by radiation and molecular conduction, causing unique radiative extinction limits.',
    measuredVsSchematic: 'MEASURED: Broad-band radiometer sensors in the ISS CIR measured radiant power output during freefall burning.',
    keyEquation: 'q_{rad} = \\epsilon_{flame} \\sigma A_{flame} (T_{flame}^4 - T_{\\infty}^4)'
  },
  cool_flame: {
    id: 'cool_flame',
    name: 'Cool-Flame Reaction Zone',
    scientificTerm: 'Low-Temperature Alkylperoxy Oxidation Shell',
    radiusMm: 4.8,
    color: '#60a5fa',
    category: 'cool_flame',
    whatHappensHere: 'After visible hot flame extinction (~1750 K), the droplet continues vaporizing and burning at 600 K to 900 K with NO VISIBLE LIGHT or soot. Driven by low-temperature branching chemistry (R + O₂ ⇌ RO₂ → QOOH → ketohydroperoxides).',
    microgravitySignificance: 'NASA\'s landmark discovery on the ISS (FLEX experiment, 2012, Nayagam et al.). Never before observed for pure isolated droplets. Proved that fires in space can silently continue burning without astronauts seeing them!',
    earthVsSpaceContrast: 'On Earth, cool flames cannot survive around droplets because buoyant convective heat loss cools the reaction zone below the critical chemical threshold. Microgravity\'s low heat-loss environment keeps the reaction alive.',
    measuredVsSchematic: 'MEASURED & HISTORIC: Discovered on ISS CIR via persistent droplet regression d(D²)/dt after hot flame extinction and calibrated radiometry. Published in Combustion & Flame (2012).',
    keyEquation: 'T_{cool} \\sim 650 - 850\\text{ K}, \\quad \\text{Zero Visible Soot}',
    nasaDiscoveryNote: 'Discovered during FLEX-1 and FLEX-2 experiments aboard the International Space Station by Principal Investigators Forman Williams and Vedha Nayagam.'
  }
};

interface FlameAnatomyInspectorProps {
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  isDark?: boolean;
}

export const FlameAnatomyInspector: React.FC<FlameAnatomyInspectorProps> = ({
  selectedNodeId,
  onSelectNode,
  isDark = false
}) => {
  const selected = selectedNodeId ? ANATOMY_NODES[selectedNodeId] : null;

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isDark
        ? 'bg-slate-900/90 border-slate-800 shadow-xl'
        : 'bg-white/95 border-slate-200 shadow-sm'
    }`}>
      {/* Title */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-800 dark:text-slate-200">
                Interactive Flame Anatomy
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-semibold border border-emerald-300/40">
                EXPERIENCE 3
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Click any anatomical zone to inspect its physical processes and microgravity significance.
            </p>
          </div>
        </div>
      </div>

      {/* Anatomy Buttons Pill Bar */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.values(ANATOMY_NODES).map(node => {
          const isSelected = selectedNodeId === node.id;
          return (
            <button
              key={node.id}
              onClick={() => onSelectNode(isSelected ? null : node.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: node.color }}
              />
              <span>{node.name}</span>
              {node.id === 'cool_flame' && (
                <span className="text-[9px] bg-blue-400/20 text-blue-300 px-1 rounded font-bold">NASA</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Detail Inspector Card */}
      {selected ? (
        <div className={`p-4 rounded-xl border animate-in fade-in duration-200 ${
          isDark
            ? 'bg-slate-800/60 border-slate-700 text-slate-200'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-3 pb-2 mb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: selected.color }}
                />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {selected.name}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {selected.scientificTerm}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                Typical Spatial Extent: ~{selected.radiusMm} mm radius for a 3.5 mm droplet
              </p>
            </div>
            <button
              onClick={() => onSelectNode(null)}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* What happens here */}
            <div className="space-y-1">
              <span className="font-bold text-[10px] uppercase font-mono tracking-wider text-sky-600 dark:text-sky-400 block">
                1. What Happens Here
              </span>
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                {selected.whatHappensHere}
              </p>
            </div>

            {/* Why it matters in microgravity */}
            <div className="space-y-1">
              <span className="font-bold text-[10px] uppercase font-mono tracking-wider text-emerald-600 dark:text-emerald-400 block">
                2. Why It Matters in Microgravity
              </span>
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                {selected.microgravitySignificance}
              </p>
            </div>

            {/* Earth vs Space Contrast */}
            <div className="space-y-1">
              <span className="font-bold text-[10px] uppercase font-mono tracking-wider text-amber-600 dark:text-amber-400 block">
                3. Earth (1g) vs Space (0g) Contrast
              </span>
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                {selected.earthVsSpaceContrast}
              </p>
            </div>

            {/* Scientific Rigor & Measurement Note */}
            <div className="space-y-1">
              <span className="font-bold text-[10px] uppercase font-mono tracking-wider text-purple-600 dark:text-purple-400 block">
                4. Measurement vs Schematic
              </span>
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                {selected.measuredVsSchematic}
              </p>
            </div>
          </div>

          {/* NASA Discovery Banner if cool flame */}
          {selected.nasaDiscoveryNote && (
            <div className="mt-3 pt-2.5 border-t border-blue-500/20 flex items-start gap-2 text-xs bg-blue-500/10 p-2.5 rounded-lg text-blue-800 dark:text-blue-300">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">NASA Historic Discovery:</strong> {selected.nasaDiscoveryNote}
              </div>
            </div>
          )}

          {/* Equation badge if available */}
          {selected.keyEquation && (
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono px-3 py-1.5 rounded-lg bg-slate-900 text-sky-300 border border-slate-700">
              <span>Governing Relationship:</span>
              <span className="font-bold">{selected.keyEquation}</span>
            </div>
          )}
        </div>
      ) : (
        <div className={`p-3 rounded-xl border text-center text-xs font-mono ${
          isDark
            ? 'bg-slate-800/30 border-slate-800 text-slate-500'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          Select an anatomical region above or click a 3D callout pin in the chamber to inspect its physics.
        </div>
      )}
    </div>
  );
};
