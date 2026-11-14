import React, { useState } from 'react';
import {
  ShieldAlert,
  Wind,
  Gauge,
  Thermometer,
  Flame,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Eye,
  Zap,
  Activity,
  ChevronRight
} from 'lucide-react';

interface SafetyTopic {
  id: string;
  title: string;
  badge: string;
  summary: string;
  earthPrinciple: string;
  spacecraftReality: string;
  nasaStandardOrIncident: string;
  operationalProcedure: string;
  lunarMarsConnection: string;
}

const SAFETY_TOPICS: SafetyTopic[] = [
  {
    id: 'detection',
    title: 'Spacecraft Fire & Smoke Detection',
    badge: 'NASA STD-6001 / ISS CIR',
    summary: 'Standard terrestrial smoke detectors mounted on ceilings fail completely in space because smoke has no buoyancy to rise.',
    earthPrinciple: 'On Earth, hot smoke is buoyant (Δρ < 0) and naturally collects at the ceiling. Ionization and optical beam detectors work by sitting above expected ignition sources.',
    spacecraftReality: 'In microgravity (g ≈ 0), smoke disperses isotropically or simply drifts with the forced ventilation airflow. Without forced flow, smoke forms a lingering cloud around the fire source, obscuring the flame and choking detectors.',
    nasaStandardOrIncident: 'Documented on ISS: Smoke detection relies on in-duct obscuration sensors inside cabin air loops (Inter-Module Ventilation / IMV), backed up by carbon monoxide (CO) electro-chemical sensors and volatile organic scrubbers.',
    operationalProcedure: 'Astronauts use portable handheld Compound Specific Analyzer-Combustion Products (CSA-CP) to track CO, HCl, and HCN levels throughout modules after an alarm.',
    lunarMarsConnection: 'In Moon (0.16g) and Mars (0.38g) gravity, weak buoyancy causes smoke to rise very slowly, creating delayed ceiling detection compared to Earth. Detectors must be placed along active airflow paths rather than solely on ceilings.'
  },
  {
    id: 'ventilation',
    title: 'Oxygen & Cabin Ventilation Control',
    badge: 'SAFFIRE Flight Finding',
    summary: 'Airflow velocity determines whether a space fire smothers itself or grows into an aggressive blowtorch.',
    earthPrinciple: 'On Earth, a fire pumps its own fresh air continuously via buoyant draft (v_nc ≈ 0.5–1.2 m/s). You cannot suffocate an Earth fire simply by turning off ceiling fans.',
    spacecraftReality: 'In microgravity, an undisturbed flame will quickly consume its local oxygen envelope and extinguish itself under its own combustion products (CO₂ and H₂O). However, ventilation fans (standard cabin circulation: 10–25 cm/s) provide the exact forced convection needed to sustain and spread the flame.',
    nasaStandardOrIncident: 'NASA SAFFIRE-I flight test (2016): Verified that even low airflow (20 cm/s) allows large-scale cotton/fiberglass fabrics to burn steadily in microgravity across nearly an entire meter of material.',
    operationalProcedure: 'Immediate emergency fire response on ISS: Astronauts and Houston immediately shut down module ventilation fans and close inter-module hatch valves to isolate the fire from fresh oxygen.',
    lunarMarsConnection: 'Lunar and Martian habitats will require optimized HVAC airflow dampers that can instantly isolate living quarters before air circulation fans turn a small localized short circuit into a habitat-wide fire.'
  },
  {
    id: 'materials',
    title: 'Material Flammability & Exploration Atmospheres',
    badge: 'NASA STD-6001 Test 1',
    summary: 'Materials that are non-flammable on Earth can ignite and burn vigorously under high-oxygen exploration cabin conditions.',
    earthPrinciple: 'Standard atmospheric air is 21% O₂ at 14.7 psi (101.3 kPa). Flammability limits are measured under normal 1g upward flame propagation.',
    spacecraftReality: 'NASA Artemis and future exploration missions plan to use reduced-pressure, elevated-oxygen cabins (e.g., 34% O₂ at 8.2 psi / 56.5 kPa) to reduce astronaut pre-breathe time before spacewalks (EVAs). High oxygen drastically lowers ignition temperatures and increases flame spread rates.',
    nasaStandardOrIncident: 'Lessons of the Apollo 1 tragedy (1967) and ongoing BASS/SoFIE tests: NASA screens every single fabric, Velcro strip, wire insulation, and plastic fastener under NASA-STD-6001 Test 1 (upward flame propagation in worst-case flight atmospheres).',
    operationalProcedure: 'Strict mass limits on combustible materials per compartment; total flight certification required before any payload or personal crew item enters the spacecraft.',
    lunarMarsConnection: 'Habitats on the Moon and Mars must balance human decompression sickness risk against extreme material fire flammability in oxygen-enriched EVA airlocks.'
  },
  {
    id: 'extinguishment',
    title: 'Fire Suppression & Chemical Extinguishers',
    badge: 'ISS Operational Doctrine',
    summary: 'Extinguishing agents behave unpredictably in zero-g: water does not pool, and gaseous agents can asphyxiate the crew.',
    earthPrinciple: 'Water hoses drown flames with downward gravitational runoff; chemical powders settle onto burning embers; CO₂ blankets the ground.',
    spacecraftReality: 'In microgravity, liquid water forms free-floating spheres that can short-circuit avionics. CO₂ gas does not sink to the floor; it expands evenly throughout the entire hermetically sealed cabin volume, posing an acute suffocation hazard to astronauts.',
    nasaStandardOrIncident: 'Mir 1997 Kvant-1 oxygen generator solid-fuel fire: Crew had to deploy multiple foam fire extinguishers while wearing oxygen masks, battling zero-gravity particulate and smoke contamination for hours.',
    operationalProcedure: 'The ISS uses fine water-mist portable fire extinguishers (PFE) for US modules (which create microscopic droplets that vaporize and smother the fire without liquid pooling) and Halon/nitrogen extinguishers in Russian modules, with breathing masks mandatory.',
    lunarMarsConnection: 'Partial gravity allows powdered and liquid extinguishing agents to settle, but lower atmospheric pressures on Mars require higher agent concentrations to quench combustion reactions.'
  },
  {
    id: 'cool_flames_risk',
    title: 'The Silent Threat: NASA Cool Flames',
    badge: 'FLEX Discovery (PSI-69)',
    summary: 'A space fire can appear completely extinguished while continuing to burn invisibly at low temperatures.',
    earthPrinciple: 'On Earth, when a flame goes dark, the fire is out. Low-temperature cool flames cannot survive around droplets because buoyancy pulls heat away too rapidly.',
    spacecraftReality: 'In microgravity, after the hot yellow/blue flame vanishes, low-temperature oxidation can silently persist at 600 K to 900 K. It produces no visible smoke, no visible light, and very little soot, but continues vaporizing fuel and generating toxic carbon monoxide.',
    nasaStandardOrIncident: 'Nayagam et al. (Combustion and Flame 2012) confirmed that n-heptane droplets on the ISS sustained quasi-steady cool flames for tens of seconds after apparent optical extinction.',
    operationalProcedure: 'Thermal imaging cameras (infrared radiometers) and gas analyzers are required to verify true extinction before astronauts can safely de-mask or open sealed equipment racks.',
    lunarMarsConnection: 'Smoldering and cool-flame chemistry could linger inside lunar soil regolith insulation or cable raceways, reigniting hours later if fresh oxygen is reintroduced.'
  }
];

export const SpacecraftFireSafetyPanel: React.FC<{ isDark?: boolean }> = ({ isDark = false }) => {
  const [activeTopicId, setActiveTopicId] = useState<string>('detection');
  const activeTopic = SAFETY_TOPICS.find((t) => t.id === activeTopicId) || SAFETY_TOPICS[0];

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                EXPERIENCE 5: Spacecraft Fire Safety Laboratory
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold border border-red-300/40">
                ASTRONAUT SAFETY
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Why space combustion research is not an academic curiosity—it is vital life insurance for human exploration.
            </p>
          </div>
        </div>
      </div>

      {/* Topics Selector Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SAFETY_TOPICS.map((topic) => {
          const isSelected = activeTopicId === topic.id;
          return (
            <button
              key={topic.id}
              onClick={() => setActiveTopicId(topic.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                isSelected
                  ? 'bg-red-600 text-white border-red-700 shadow-md scale-102'
                  : isDark
                  ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <span>{topic.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Scenario Card */}
      <div className={`p-4 rounded-xl border ${
        isDark ? 'bg-slate-800/40 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        {/* Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-red-600 dark:text-red-400 font-bold block">
              Operational Safety Domain
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {activeTopic.title}
            </h4>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-red-500/10 text-red-700 dark:text-red-300 font-bold border border-red-500/30">
            {activeTopic.badge}
          </span>
        </div>

        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-4 bg-red-500/5 p-3 rounded-lg border border-red-500/15 leading-relaxed">
          <strong>Summary:</strong> {activeTopic.summary}
        </p>

        {/* 2x2 Scientific Deep-Dive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Earth vs Space */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 space-y-1.5">
            <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Terrestrial Intuition (Earth 1g)
            </span>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              {activeTopic.earthPrinciple}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 space-y-1.5">
            <span className="font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
              Spaceflight Physical Reality (0g)
            </span>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              {activeTopic.spacecraftReality}
            </p>
          </div>

          {/* NASA Standards & History */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 space-y-1.5">
            <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
              NASA Flight Standard / Incident Case
            </span>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              {activeTopic.nasaStandardOrIncident}
            </p>
          </div>

          {/* Astronaut Procedure */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 space-y-1.5">
            <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Astronaut Operational Response
            </span>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              {activeTopic.operationalProcedure}
            </p>
          </div>
        </div>

        {/* Moon & Mars Connection */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-start gap-2.5 bg-sky-500/10 p-3 rounded-lg text-sky-900 dark:text-sky-300">
          <Zap className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="font-bold">Moon & Mars Exploration Connection: </strong>
            {activeTopic.lunarMarsConnection}
          </div>
        </div>
      </div>
    </div>
  );
};
