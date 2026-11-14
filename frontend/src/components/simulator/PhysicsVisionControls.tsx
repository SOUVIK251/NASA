import React from 'react';
import {
  Wind,
  Compass,
  Flame,
  Thermometer,
  Layers,
  CloudRain,
  Eye,
  EyeOff,
  HelpCircle,
  Info
} from 'lucide-react';

export interface PhysicsVisionState {
  buoyancy: boolean;
  airflow: boolean;
  oxygenTransport: boolean;
  heatTransfer: boolean;
  fuelVapour: boolean;
  combustionProducts: boolean;
}

interface PhysicsVisionControlsProps {
  vision: PhysicsVisionState;
  onChange: (key: keyof PhysicsVisionState, value: boolean) => void;
  onToggleAll: (enable: boolean) => void;
  isDark?: boolean;
}

export const PhysicsVisionControls: React.FC<PhysicsVisionControlsProps> = ({
  vision,
  onChange,
  onToggleAll,
  isDark = false
}) => {
  const allActive = Object.values(vision).every(Boolean);
  const noneActive = Object.values(vision).every(v => !v);

  const overlays: Array<{
    key: keyof PhysicsVisionState;
    label: string;
    symbol: string;
    color: string;
    activeBg: string;
    activeBorder: string;
    activeText: string;
    icon: any;
    scientificMeaning: string;
    earthBehavior: string;
    microgravityBehavior: string;
  }> = [
    {
      key: 'buoyancy',
      label: 'Buoyancy Forces',
      symbol: 'g · Δρ',
      color: '#f97316',
      activeBg: isDark ? 'bg-orange-950/60' : 'bg-orange-50',
      activeBorder: isDark ? 'border-orange-500/60' : 'border-orange-400',
      activeText: isDark ? 'text-orange-300' : 'text-orange-700',
      icon: Compass,
      scientificMeaning: 'Net body force from density differences between hot flame exhaust and cool ambient air under gravity.',
      earthBehavior: 'Strong upward vertical acceleration (Gr ~ 10⁴); generates natural convection draft that stretches the flame.',
      microgravityBehavior: 'Suppressed (g ≈ 0, Gr ≈ 0). No upward buoyant force exists; hot gas remains spherically symmetric.'
    },
    {
      key: 'airflow',
      label: 'Airflow & Convection',
      symbol: '∇ · v',
      color: '#06b6d4',
      activeBg: isDark ? 'bg-cyan-950/60' : 'bg-cyan-50',
      activeBorder: isDark ? 'border-cyan-500/60' : 'border-cyan-400',
      activeText: isDark ? 'text-cyan-300' : 'text-cyan-700',
      icon: Wind,
      scientificMeaning: 'Bulk velocity streamlines of gas surrounding and feeding the flame.',
      earthBehavior: 'Rapid convective chimney draft (v_nc ≈ 0.4–1.0 m/s) drawing air in at the base and rushing upward.',
      microgravityBehavior: 'Quiescent ambient (v ≈ 0 m/s in undisturbed cabin air); streamlines are absent or purely diffusion-induced Stefan flow.'
    },
    {
      key: 'oxygenTransport',
      label: 'Oxygen Transport',
      symbol: 'J = -D∇C',
      color: '#3b82f6',
      activeBg: isDark ? 'bg-blue-950/60' : 'bg-blue-50',
      activeBorder: isDark ? 'border-blue-500/60' : 'border-blue-400',
      activeText: isDark ? 'text-blue-300' : 'text-blue-700',
      icon: Flame,
      scientificMeaning: 'Mechanism delivering oxidizer (O₂) from ambient air into the stoichiometric reaction zone.',
      earthBehavior: 'Convection-dominated (Peclet Pe >> 1). Fresh air is forcefully pumped to the reaction zone.',
      microgravityBehavior: 'Diffusion-limited (Pe << 1). Oxygen moves only via slow, isotropic molecular collisions inward (D_O₂ ≈ 2×10⁻⁵ m²/s).'
    },
    {
      key: 'heatTransfer',
      label: 'Heat Dissipation',
      symbol: 'q_rad + q_cond',
      color: '#ef4444',
      activeBg: isDark ? 'bg-red-950/60' : 'bg-red-50',
      activeBorder: isDark ? 'border-red-500/60' : 'border-red-400',
      activeText: isDark ? 'text-red-300' : 'text-red-700',
      icon: Thermometer,
      scientificMeaning: 'Pathways by which thermal energy escapes the flame and provides feedback to vaporize fuel.',
      earthBehavior: 'Convective plume carries ~70-80% of heat away upward, cooling the immediate flame base.',
      microgravityBehavior: 'No convective plume. Heat leaves purely by 360° thermal radiation (σ·T⁴) and isotropic gas conduction.'
    },
    {
      key: 'fuelVapour',
      label: 'Fuel Vapour Zone',
      symbol: 'Y_fuel',
      color: '#eab308',
      activeBg: isDark ? 'bg-amber-950/60' : 'bg-amber-50',
      activeBorder: isDark ? 'border-amber-500/60' : 'border-amber-400',
      activeText: isDark ? 'text-amber-300' : 'text-amber-700',
      icon: Layers,
      scientificMeaning: 'Fuel-rich region (equivalence ratio φ > 1) where evaporated fuel diffuses outward from the droplet surface.',
      earthBehavior: 'Compressed and sheathed vertically into a narrow column by the rushing upward airflow.',
      microgravityBehavior: 'Forms a wide, spherically symmetric vapor envelope extending outward to the reaction shell.'
    },
    {
      key: 'combustionProducts',
      label: 'Combustion Products',
      symbol: 'CO₂ + H₂O + Soot',
      color: '#a855f7',
      activeBg: isDark ? 'bg-purple-950/60' : 'bg-purple-50',
      activeBorder: isDark ? 'border-purple-500/60' : 'border-purple-400',
      activeText: isDark ? 'text-purple-300' : 'text-purple-700',
      icon: CloudRain,
      scientificMeaning: 'Gaseous products (CO₂, H₂O) and carbonaceous soot particulates generated by reaction.',
      earthBehavior: 'Swept rapidly upward in the smoke plume; soot particles heat up and emit bright yellow incandescent light.',
      microgravityBehavior: 'Products linger around the flame in a spherical halo, trapping heat but also suffocating the flame if not ventilated.'
    }
  ];

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isDark
        ? 'bg-slate-900/90 border-slate-800 shadow-xl'
        : 'bg-white/95 border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-800 dark:text-slate-200">
                Physics Vision Overlays
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 font-semibold border border-sky-300/40">
                EXPERIENCE 2
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Reveal the invisible transport phenomena governing fire in 1g vs 0g.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => onToggleAll(!allActive)}
            className={`px-3 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              allActive
                ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            {allActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {allActive ? 'Hide All' : 'Show All'}
          </button>
        </div>
      </div>

      {/* Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {overlays.map(item => {
          const isActive = vision[item.key];
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key, !isActive)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between min-h-[72px] ${
                isActive
                  ? `${item.activeBg} ${item.activeBorder} ${item.activeText} shadow-sm ring-1 ring-offset-0 ring-current`
                  : isDark
                  ? 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-50/80 hover:bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? item.color : undefined }} />
                <span className="text-[10px] font-mono opacity-70 font-semibold">{item.symbol}</span>
              </div>
              <div className="mt-1.5">
                <span className="text-xs font-semibold block leading-tight">{item.label}</span>
                <span className={`text-[9px] font-mono uppercase tracking-wider block mt-0.5 ${
                  isActive ? 'opacity-90 font-bold' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {isActive ? '● VISIBLE' : '○ OFF'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Scientific Legend & Disclosure */}
      <div className={`mt-3 pt-3 border-t text-[11px] grid grid-cols-1 md:grid-cols-2 gap-3 ${
        isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200">Scientific Representation Note:</strong> Streamlines and vector arrows represent continuum velocity fields and species gradients calculated from Navier-Stokes/diffusion equations, not individual molecules or literal particle counts.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200">Key Takeaway:</strong> In 1g, buoyancy drives a perpetual high-speed oxygen pump. In 0g, that pump is dead; fire lives or dies solely by how fast oxygen molecules can wander in on their own.
          </p>
        </div>
      </div>
    </div>
  );
};
