import React from 'react';
import {
  X,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Layers,
  Activity,
  Compass
} from 'lucide-react';

interface ScientificValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const ScientificValidationModal: React.FC<ScientificValidationModalProps> = ({
  isOpen,
  onClose,
  isDark = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl transition-all ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-inherit z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">EXPERIENCE 7: Scientific Physics Engine Validation</h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-300/40">
                  RIGOROUS SCIENTIFIC AUDIT
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Documentation of implemented physical models, mathematical relations, assumptions, and validity boundaries.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs leading-relaxed">
          {/* Scientific Disclaimer Banner */}
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-sm font-bold block mb-1">
                Model Classification: Reduced-Order Analytical Engine (Not Full 3D CFD)
              </strong>
              <p>
                The physics simulator implements simplified scaling laws derived from classical combustion texts (Turns, <em>An Introduction to Combustion</em>; Law, <em>Combustion Physics</em>). It is intentionally designed for instantaneous interactive exploration and educational insight, carrying an expected uncertainty band of ±30% to ±50%. It does not claim full predictive CFD or DNS fidelity.
              </p>
            </div>
          </div>

          {/* Implemented Physics Relationships Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-500" />
              1. Implemented Physical Equations & Scaling Laws
            </h4>

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Phenomenon</th>
                    <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Governing Equation</th>
                    <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Physical Justification & References</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">Buoyancy Forces</td>
                    <td className="p-2.5 text-sky-600 dark:text-sky-400">Gr = g · β · ΔT · L³ / ν²</td>
                    <td className="p-2.5">Grashof number dictates ratio of buoyancy to viscous forces. Earth: Gr ~ 10⁴–10⁵; Space: Gr ≈ 0.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">Natural Convection</td>
                    <td className="p-2.5 text-sky-600 dark:text-sky-400">v_nc ≈ √(g · β · ΔT · L)</td>
                    <td className="p-2.5">Scaling estimate of chimney draft velocity feeding fresh air to Earth flames (0.4–1.2 m/s).</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">Molecular Diffusivity</td>
                    <td className="p-2.5 text-sky-600 dark:text-sky-400">D_O₂ = D_ref · (T/T_ref)^1.75 / (P/P_ref)</td>
                    <td className="p-2.5">Chapman-Enskog kinetic gas theory scaling for binary oxygen-nitrogen diffusion.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">Gas Viscosity</td>
                    <td className="p-2.5 text-sky-600 dark:text-sky-400">μ = μ_ref · (T/T_ref)^1.5 · (T_ref + S)/(T + S)</td>
                    <td className="p-2.5">Sutherland's law for air viscosity with Sutherland constant S = 110.4 K.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">Burning Rate</td>
                    <td className="p-2.5 text-sky-600 dark:text-sky-400">ṁ = 4π · ρ · D_O₂ · r_flame · ln(1 + B)</td>
                    <td className="p-2.5">Spalding transfer number formulation for diffusion flames with convective correction factor.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">Extinction Limit</td>
                    <td className="p-2.5 text-sky-600 dark:text-sky-400">Da = τ_flow / τ_chem</td>
                    <td className="p-2.5">Damköhler number. When chemical reaction time exceeds residence time (Da &lt; Da_crit), flame quenches.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Assumptions and Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block font-mono">
                Documented Valid Assumptions
              </span>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc pl-4">
                <li>Ideal gas equation of state valid for pressures 10–200 kPa and T &gt; 200 K.</li>
                <li>Single-step global irreversible reaction kinetics.</li>
                <li>Optically thin radiation model with radiation loss scaled by σ·ε·A·(T⁴ - T_∞⁴).</li>
                <li>Diffusion-controlled Burke-Schumann flame sheet assumption.</li>
                <li>Quiescent microgravity conditions neglect residual g-jitter.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 block font-mono">
                Model Boundaries & Non-Applicable Regimes
              </span>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc pl-4">
                <li>Does NOT model turbulent combustion or acoustic instabilities.</li>
                <li>Does NOT resolve multi-step radical pool kinetics for cool flames dynamically.</li>
                <li>Soot agglomeration and radiative reabsorption are simplified algebraically.</li>
                <li>Results must never be used for critical spacecraft flight hardware design.</li>
              </ul>
            </div>
          </div>

          {/* Data Transparency */}
          <div className="p-4 rounded-2xl border border-sky-500/20 bg-sky-500/5 space-y-2">
            <h5 className="font-bold text-sky-700 dark:text-sky-300 font-mono text-xs uppercase tracking-wider">
              Experimental Flight Data Integrity
            </h5>
            <p className="text-slate-600 dark:text-slate-300">
              In NASA Flight Dataset Playback mode (FLEX, BASS-II, SAFFIRE), data points are tagged as <span className="font-bold text-emerald-600">MEASURED</span> (direct sensor/telemetry), <span className="font-bold text-sky-600">PUBLISHED_LITERATURE</span> (digitized from peer-reviewed journal figures), or <span className="font-bold text-amber-600">ILLUSTRATIVE</span> (spatially interpolated). Unmeasured geometry is never falsified as raw flight telemetry.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Close Validation Audit
          </button>
        </div>
      </div>
    </div>
  );
};
