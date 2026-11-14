import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sliders,
  ExternalLink,
  Flame,
  CircleDot,
  ShieldAlert,
  Wind,
  Compass,
  Zap,
  ArrowRight
} from 'lucide-react';

interface ConceptExplainersModalProps {
  isOpen: boolean;
  initialConcept?: string;
  onClose: () => void;
  isDark?: boolean;
}

type ConceptId = 'd2_law' | 'cool_flame' | 'loi_extinction' | 'buoyancy' | 'flow_directions';

interface ConceptMeta {
  id: ConceptId;
  name: string;
  tagline: string;
  icon: any;
  citation: string;
  citationUrl: string;
}

const CONCEPTS: ConceptMeta[] = [
  {
    id: 'd2_law',
    name: 'D²-Law of Droplet Combustion',
    tagline: 'Why liquid fuel droplets shrink at a steady area rate',
    icon: CircleDot,
    citation: 'Nayagam et al., Combustion and Flame 159(12):3583–3588 (2012); Godsave & Spalding (1953)',
    citationUrl: 'https://doi.org/10.1016/j.combustflame.2012.07.012'
  },
  {
    id: 'cool_flame',
    name: 'Quasi-Steady Cool Flames',
    tagline: 'Invisible low-temperature burning in space',
    icon: Flame,
    citation: 'Nayagam et al. (2012) & Dietrich et al., NASA/TM-2014-218323',
    citationUrl: 'https://ntrs.nasa.gov/citations/20140009826'
  },
  {
    id: 'loi_extinction',
    name: 'Extinction & Limiting Oxygen Index (LOI)',
    tagline: 'When heat loss outpaces heat generation',
    icon: ShieldAlert,
    citation: 'NASA/TP—2015-216046 (FLEX Detailed Test Results Table IX)',
    citationUrl: 'https://ntrs.nasa.gov/citations/20160002361'
  },
  {
    id: 'buoyancy',
    name: 'Why Buoyancy Vanishes in Space',
    tagline: 'How Grashof number drops to zero, yielding spherical flames',
    icon: Compass,
    citation: 'NASA SP-8088 / Law, C. K., Combustion Physics (Cambridge, 2006)',
    citationUrl: 'https://ntrs.nasa.gov/citations/19730006435'
  },
  {
    id: 'flow_directions',
    name: 'Concurrent vs. Opposed Flame Spread',
    tagline: 'Why ventilation direction dictates fire hazard on solids',
    icon: Wind,
    citation: 'Olson et al., Combustion and Flame 168:378–390 (2016); NASA/TM-20210011385',
    citationUrl: 'https://ntrs.nasa.gov/citations/20150008961'
  }
];

export const ConceptExplainersModal: React.FC<ConceptExplainersModalProps> = ({
  isOpen,
  initialConcept = 'd2_law',
  onClose,
  isDark = false
}) => {
  const [selectedConcept, setSelectedConcept] = useState<ConceptId>(
    (initialConcept as ConceptId) || 'd2_law'
  );

  // Demo 1 State (D2 Law)
  const [d0, setD0] = useState<number>(3.5);
  const [burnRateK, setBurnRateK] = useState<number>(1.4);
  const [sliderTime, setSliderTime] = useState<number>(2.0);

  // Demo 2 State (Cool Flame Temperature)
  const [flameTempK, setFlameTempK] = useState<number>(750);

  // Demo 3 State (Oxygen & LOI)
  const [demoO2, setDemoO2] = useState<number>(15.0);

  // Demo 4 State (Gravity)
  const [demoGravity, setDemoGravity] = useState<number>(0.0);

  // Demo 5 State (Flow Direction)
  const [flowDirection, setFlowDirection] = useState<'concurrent' | 'opposed'>('concurrent');
  const [airflowVelocity, setAirflowVelocity] = useState<number>(10.0);

  if (!isOpen) return null;

  // D2 calculation
  const d0Sq = d0 * d0;
  const currentD2 = Math.max(0, d0Sq - burnRateK * sliderTime);
  const currentD = Math.sqrt(currentD2);
  const extinctionTime = d0Sq / burnRateK;

  // Gravity Demo Grashof Calculation
  const deltaT = 1200;
  const L = 0.01;
  const nu = 1.5e-5;
  const beta = 1 / 300;
  const grashof = (demoGravity * beta * deltaT * Math.pow(L, 3)) / Math.pow(nu, 2);
  const v_nc = Math.sqrt(2 * demoGravity * beta * deltaT * L);
  const isSpherical = grashof < 20;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden font-sans ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Microgravity Combustion Core Concept Explainers
              </h2>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Peer-reviewed physics principles paired with interactive micro-demonstrations
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Close Concept Explainers"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Concept Selector Tabs */}
        <div className="flex border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto shrink-0 bg-slate-50/50 dark:bg-slate-950/40 p-2 gap-1.5">
          {CONCEPTS.map((concept) => {
            const Icon = concept.icon;
            const isSelected = selectedConcept === concept.id;
            return (
              <button
                key={concept.id}
                onClick={() => setSelectedConcept(concept.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-md'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{concept.name}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Concept Header */}
          {(() => {
            const current = CONCEPTS.find(c => c.id === selectedConcept)!;
            return (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {current.name}
                  </h3>
                  <p className="text-xs text-sky-600 dark:text-sky-400 font-mono mt-0.5">
                    {current.tagline}
                  </p>
                </div>
                <a
                  href={current.citationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="truncate max-w-xs">{current.citation}</span>
                </a>
              </div>
            );
          })()}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* CONCEPT 1: D²-LAW DEMO */}
          {/* ───────────────────────────────────────────────────────────── */}
          {selectedConcept === 'd2_law' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-sky-500/5 dark:bg-sky-950/20 border border-sky-500/20 text-xs sm:text-sm leading-relaxed space-y-2">
                <p>
                  <strong>The D²-Law:</strong> In 1953, D.B. Spalding and G.A. Godsave proved that when a spherical fuel droplet evaporates and burns in a quiescent environment, its surface area (proportional to diameter squared, <em>D²</em>) decreases linearly with time:
                </p>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-950 font-mono text-center text-sky-700 dark:text-sky-300 font-bold border border-slate-200 dark:border-slate-800">
                  D²(t) = D₀² − K · t &nbsp;⟹&nbsp; D(t) = √(D₀² − K · t)
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Notice that while <strong>D²(t) is a straight line</strong>, the actual diameter <strong>D(t) curves downward</strong>, accelerating toward zero right before extinction!
                </p>
              </div>

              {/* Interactive D2 Controls */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-4">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Sliders className="w-4 h-4 text-sky-500" />
                  <span>INTERACTIVE D² SIMULATION BENCH</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-mono block text-slate-500 mb-1">
                      Initial Diameter (D₀): <strong>{d0.toFixed(2)} mm</strong>
                    </label>
                    <input
                      type="range"
                      min="1.5"
                      max="4.5"
                      step="0.1"
                      value={d0}
                      onChange={(e) => setD0(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono block text-slate-500 mb-1">
                      Burning Rate (K): <strong>{burnRateK.toFixed(2)} mm²/s</strong>
                    </label>
                    <input
                      type="range"
                      min="0.4"
                      max="2.0"
                      step="0.05"
                      value={burnRateK}
                      onChange={(e) => setBurnRateK(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono block text-slate-500 mb-1">
                      Elapsed Time (t): <strong>{sliderTime.toFixed(2)} s</strong>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={extinctionTime.toFixed(1)}
                      step="0.1"
                      value={Math.min(sliderTime, extinctionTime)}
                      onChange={(e) => setSliderTime(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Realtime Outputs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Current D(t)</span>
                    <span className="text-base font-bold text-sky-600 dark:text-sky-400">
                      {currentD.toFixed(3)} mm
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Current D²(t)</span>
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                      {currentD2.toFixed(3)} mm²
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Volume Remaining</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {((Math.pow(currentD, 3) / Math.pow(d0, 3)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Extinction Time</span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {extinctionTime.toFixed(2)} s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* CONCEPT 2: COOL FLAMES */}
          {/* ───────────────────────────────────────────────────────────── */}
          {selectedConcept === 'cool_flame' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 text-xs sm:text-sm leading-relaxed space-y-2">
                <p>
                  <strong>NASA's Cool Flame Discovery:</strong> In 2012, researchers using the ISS CIR MDCA apparatus observed something never before seen for isolated fuel droplets: after the visible yellow hot flame extinguished at ~1700 K, the droplet continued shrinking steadily for another 8 seconds at 600–800 K!
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  This low-temperature regime is sustained by alkylperoxy radical chemistry (R + O₂ ⇌ RO₂ → QOOH → ketohydroperoxides). It produces zero soot and virtually no visible light, but releases enough heat to drive evaporation in microgravity.
                </p>
              </div>

              {/* Interactive Temperature Regimes */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    REACTION TEMPERATURE PROBE: <strong>{flameTempK} K</strong>
                  </span>
                  <span className="text-slate-500">
                    ({(flameTempK - 273.15).toFixed(0)} °C)
                  </span>
                </div>

                <input
                  type="range"
                  min="400"
                  max="2000"
                  step="25"
                  value={flameTempK}
                  onChange={(e) => setFlameTempK(parseInt(e.target.value))}
                  className="w-full"
                />

                {/* Regime Status Box */}
                <div
                  className={`p-3.5 rounded-xl border text-xs font-mono transition-all ${
                    flameTempK < 600
                      ? 'bg-slate-100 dark:bg-slate-900 border-slate-300 text-slate-600'
                      : flameTempK <= 850
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-700 dark:text-blue-300'
                      : flameTempK < 1200
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300'
                      : 'bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-300'
                  }`}
                >
                  <div className="font-bold text-sm mb-1 uppercase">
                    {flameTempK < 600 && 'Sub-Ignition Preheating (No Flame)'}
                    {flameTempK >= 600 && flameTempK <= 850 && '★ QUASI-STEADY COOL FLAME REGIME (600–850 K)'}
                    {flameTempK > 850 && flameTempK < 1200 && 'Negative Temperature Coefficient (NTC) Lull'}
                    {flameTempK >= 1200 && 'HOT VIGOROUS FLAME REGIME (>1200 K)'}
                  </div>
                  <p className="font-sans leading-relaxed">
                    {flameTempK < 600 && 'Thermal energy is too low to sustain radical chain branching. Droplet evaporates slowly without combustion.'}
                    {flameTempK >= 600 && flameTempK <= 850 && 'Low-temperature alkylperoxy chain branching active. Zero visible light, zero soot emissions. Burning rate K ≈ 0.35 mm²/s. Extremely hazardous for spacecraft fire detection!'}
                    {flameTempK > 850 && flameTempK < 1200 && 'NTC transition: RO₂ radicals dissociate back into reactants, temporarily suppressing oxidation until high-temperature branching (H + O₂ ⇌ OH + O) ignites.'}
                    {flameTempK >= 1200 && 'High-temperature branched chain combustion. Intense visible yellow radiation from soot incandescence. Burning rate K ≈ 1.40 mm²/s.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* CONCEPT 3: EXTINCTION & LOI */}
          {/* ───────────────────────────────────────────────────────────── */}
          {selectedConcept === 'loi_extinction' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 text-xs sm:text-sm leading-relaxed space-y-2">
                <p>
                  <strong>Limiting Oxygen Index (LOI):</strong> A flame survives only when chemical heat generation exceeds radiative heat loss. In microgravity, because there is no buoyant draft to replenish oxygen, flames reach their extinction limit at distinct atmospheric oxygen concentrations.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  NASA/TP—2015-216046 (FLEX Table IX) proved that n-heptane droplets undergo hot flame extinction when oxygen drops below ~14.5% O₂, though cool flames can linger down to ~12% O₂.
                </p>
              </div>

              {/* Interactive O2 Slider */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    OXYGEN CONCENTRATION: <strong>{demoO2.toFixed(1)}% O₂</strong>
                  </span>
                  <span className="text-slate-500">
                    (Earth air: 20.95% O₂ | Artemis cabin: 34% O₂ at 8.2 psia)
                  </span>
                </div>

                <input
                  type="range"
                  min="10"
                  max="30"
                  step="0.5"
                  value={demoO2}
                  onChange={(e) => setDemoO2(parseFloat(e.target.value))}
                  className="w-full"
                />

                <div
                  className={`p-3.5 rounded-xl border text-xs font-mono transition-all ${
                    demoO2 < 13.0
                      ? 'bg-slate-200 dark:bg-slate-900 border-slate-300 text-slate-600'
                      : demoO2 < 15.0
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-700 dark:text-blue-300'
                      : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  <div className="font-bold text-sm mb-1 uppercase">
                    {demoO2 < 13.0 && 'Below Flammability Limit (Quenching / No Ignition)'}
                    {demoO2 >= 13.0 && demoO2 < 15.0 && 'Near-LOI Threshold (Cool Flame Dominant, Hot Flame Extinguishes Early)'}
                    {demoO2 >= 15.0 && 'Sustained Hot Flame Combustion'}
                  </div>
                  <p className="font-sans leading-relaxed">
                    {demoO2 < 13.0 && 'Radiative heat loss exceeds chemical heat release. The Damköhler number Da falls below the critical threshold (Da < 0.5), causing immediate extinction.'}
                    {demoO2 >= 13.0 && demoO2 < 15.0 && 'Matches Run FLEX-F2-T02 (15% O₂): Hot flame survives only ~3 seconds before radiative extinction, followed by an extended cool flame phase.'}
                    {demoO2 >= 15.0 && 'Ample oxidizer diffusion supports steady hot-flame burning with normal burning rate constant K ≈ 1.4 mm²/s.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* CONCEPT 4: BUOYANCY & GRASHOF */}
          {/* ───────────────────────────────────────────────────────────── */}
          {selectedConcept === 'buoyancy' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 text-xs sm:text-sm leading-relaxed space-y-2">
                <p>
                  <strong>The Grashof Number (Gr):</strong> Why do flames flicker on Earth but rest as calm spheres in orbit? Because the Grashof number scales directly with gravity:
                </p>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-950 font-mono text-center text-purple-700 dark:text-purple-300 font-bold border border-slate-200 dark:border-slate-800">
                  Gr = (g · β · ΔT · L³) / ν²
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  When g ≈ 0, Gr → 0. Buoyant body forces vanish from the Navier-Stokes equations, reducing flame transport to pure spherically symmetric molecular diffusion.
                </p>
              </div>

              {/* Interactive Gravity Bench */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    GRAVITATIONAL ENVIRONMENT: <strong>{demoGravity.toFixed(2)} m/s²</strong>
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setDemoGravity(0.0)}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 hover:bg-sky-500 hover:text-white"
                    >
                      ISS (0g)
                    </button>
                    <button
                      onClick={() => setDemoGravity(1.62)}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 hover:bg-sky-500 hover:text-white"
                    >
                      Moon (0.166g)
                    </button>
                    <button
                      onClick={() => setDemoGravity(3.72)}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 hover:bg-sky-500 hover:text-white"
                    >
                      Mars (0.38g)
                    </button>
                    <button
                      onClick={() => setDemoGravity(9.81)}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 hover:bg-sky-500 hover:text-white"
                    >
                      Earth (1g)
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="9.81"
                  step="0.1"
                  value={demoGravity}
                  onChange={(e) => setDemoGravity(parseFloat(e.target.value))}
                  className="w-full"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Grashof Number</span>
                    <span className="text-base font-bold text-purple-600 dark:text-purple-400">
                      {grashof < 1 ? grashof.toFixed(3) : Math.round(grashof).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Natural Convection Speed</span>
                    <span className="text-base font-bold text-sky-600 dark:text-sky-400">
                      {v_nc.toFixed(3)} m/s
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Flame Geometry</span>
                    <span className={`text-base font-bold ${isSpherical ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {isSpherical ? 'Symmetrical Sphere' : 'Elongated Teardrop'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* CONCEPT 5: CONCURRENT VS OPPOSED FLOW */}
          {/* ───────────────────────────────────────────────────────────── */}
          {selectedConcept === 'flow_directions' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 text-xs sm:text-sm leading-relaxed space-y-2">
                <p>
                  <strong>Solid Material Fire Spread in Microgravity:</strong> Aboard spacecraft, air does not circulate naturally; it is pushed by ventilation ducts at 5 to 20 cm/s. The relative direction of this flow determines whether a fire creeps slowly or runs away catastrophically.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  BASS-II and SAFFIRE proved that <strong>concurrent flow</strong> (airflow blowing in the direction of flame spread) blows hot gaseous combustion products across unburned material, preheating it and dramatically accelerating fire spread.
                </p>
              </div>

              {/* Interactive Flow Configuration */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-4">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    FLOW CONFIGURATION TOGGLE
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFlowDirection('concurrent')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        flowDirection === 'concurrent'
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Concurrent (+x)
                    </button>
                    <button
                      onClick={() => setFlowDirection('opposed')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        flowDirection === 'opposed'
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Opposed (−x)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono block text-slate-500 mb-1">
                    Airflow Velocity: <strong>{airflowVelocity.toFixed(1)} cm/s</strong>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    step="1"
                    value={airflowVelocity}
                    onChange={(e) => setAirflowVelocity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Realtime Spread Rate Benchmark */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase">Estimated Flame Spread Rate (SIBAL/PMMA):</span>
                    <span className="font-bold text-base text-slate-900 dark:text-white">
                      {flowDirection === 'concurrent'
                        ? `${(0.05 + 0.007 * airflowVelocity).toFixed(3)} cm/s (~${((0.05 + 0.007 * airflowVelocity) * 10).toFixed(1)} mm/s)`
                        : `${(0.02 + 0.001 * airflowVelocity).toFixed(3)} cm/s (~${((0.02 + 0.001 * airflowVelocity) * 10).toFixed(1)} mm/s)`}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400 leading-snug">
                    {flowDirection === 'concurrent'
                      ? 'DANGER: Concurrent ventilation sweeps hot flames over virgin fuel ahead, preheating the solid sheet. Matches SAFFIRE-I steady spread of ~1.8 mm/s.'
                      : 'SAFE: Opposed ventilation sweeps hot exhaust backward over already-charred fuel. Spread is limited by slow heat conduction through the solid.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
