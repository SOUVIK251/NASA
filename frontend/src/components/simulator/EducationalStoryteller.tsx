import React, { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flame,
  Globe,
  Wind,
  Layers,
  FlaskConical,
  ShieldAlert,
  Moon,
  Compass,
  CheckCircle2
} from 'lucide-react';

interface StoryStep {
  step: number;
  title: string;
  subtitle: string;
  icon: any;
  badge: string;
  beginnerText: string;
  beginnerAnalogy: string;
  advancedText: string;
  advancedEquations: string[];
  advancedReferences: string[];
}

const STORY_STEPS: StoryStep[] = [
  {
    step: 1,
    title: 'The Familiar Earth Flame',
    subtitle: 'Why candle flames on Earth always flicker and point upward',
    icon: Flame,
    badge: '1g Gravity',
    beginnerText: 'When you light a match or candle on Earth, fire always points up toward the sky. Hot air is lighter than cold air, so Earth’s gravity pulls the dense cold air down and pushes the light hot air up. This creates a miniature wind tunnel that stretches the flame into a tall, flickering teardrop.',
    beginnerAnalogy: 'Think of a hot air balloon: hot air naturally floats upward in a sea of cold air because gravity pulls harder on the cold, dense air.',
    advancedText: 'On Earth (1g = 9.81 m/s²), the thermal expansion coefficient β ≈ 1/T_∞ generates large density differences Δρ = ρ_∞ - ρ_hot. In the Navier-Stokes momentum equation, the gravity body force term ρ·g⃗ creates an intense upward buoyant acceleration, yielding natural convection velocities v_nc ~ √(g·β·ΔT·L) ≈ 0.5–1.0 m/s. The Grashof number Gr = g·β·ΔT·L³/ν² reaches 10⁴–10⁶, indicating overwhelming buoyancy dominance over viscous diffusion.',
    advancedEquations: [
      '\\text{Momentum: } \\rho \\left( \\frac{\\partial \\vec{v}}{\\partial t} + \\vec{v} \\cdot \\nabla \\vec{v} \\right) = -\\nabla p + \\mu \\nabla^2 \\vec{v} + \\rho \\vec{g}',
      '\\text{Grashof Number: } Gr = \\frac{g \\beta \\Delta T L^3}{\\nu^2} \\sim 10^4 - 10^6'
    ],
    advancedReferences: [
      'Turns, S. R. "An Introduction to Combustion: Concepts and Applications", McGraw-Hill, 2011.',
      'Law, C. K. "Combustion Physics", Cambridge University Press, 2006.'
    ]
  },
  {
    step: 2,
    title: 'Entering Reduced Gravity',
    subtitle: 'What happens when gravity disappears in orbital freefall',
    icon: Globe,
    badge: 'Orbital Mechanics',
    beginnerText: 'When an astronaut is on the International Space Station, gravity has not actually vanished! Earth’s gravity is still 90% as strong up there. But the ISS is traveling sideways at 17,500 mph (28,000 km/h)—it is in perpetual freefall around the curvature of the Earth. Everything inside falls together, so weight effectively becomes zero.',
    beginnerAnalogy: 'Imagine being in an elevator when the cable snaps: you, the air, and everything inside float weightlessly together. There is no "up" or "down" for hot air to rise.',
    advancedText: 'In low-Earth orbit (altitude ~400 km), gravitational acceleration g_orbital ≈ 8.7 m/s² is balanced by centrifugal acceleration ω²·r. In the rotating reference frame of the spacecraft, the effective residual gravity vector g_eff drops to 10⁻⁶ g₀ (microgravity). Consequently, the buoyant body force term ρ·g⃗ vanishes from the Navier-Stokes equations, collapsing the Grashof number to Gr ≈ 0.',
    advancedEquations: [
      '\\vec{g}_{\\text{eff}} = \\vec{g}_{\\text{grav}} - \\vec{\\omega} \\times (\\vec{\\omega} \\times \\vec{r}) \\approx 10^{-6} \\vec{g}_0',
      'Gr = \\frac{g_{\\text{eff}} \\beta \\Delta T L^3}{\\nu^2} \\to 0'
    ],
    advancedReferences: [
      'NASA SP-2000-6110, "Combustion in Microgravity: Human Space Exploration".',
      'Williams, F. A. "Combustion Theory", CRC Press, 1985.'
    ]
  },
  {
    step: 3,
    title: 'The Death of Buoyancy',
    subtitle: 'When hot air refuses to rise, flames turn into spheres',
    icon: Compass,
    badge: 'Symmetry Discovery',
    beginnerText: 'Without gravity pulling cold air down, hot air no longer rises. Since there is no "up" direction anymore, the flame expands outward equally in every single direction—forming a calm, glowing, near-perfect sphere. Because it does not flicker or draft, it burns much quieter and calmer than any fire on Earth.',
    beginnerAnalogy: 'Inflating a round balloon in deep space: the pressure and gas push equally in 360 degrees, creating a perfect sphere.',
    advancedText: 'With Gr ≈ 0, the governing conservation equations reduce to spherically symmetric 1D radial form (∂/∂θ = ∂/∂ϕ = 0). The buoyant chimney effect is eliminated. The aspect ratio of the flame envelope height-to-diameter H/D drops from ~3.5 on Earth to H/D ≈ 1.05 in microgravity. Natural convection velocity v_nc drops from ~0.65 m/s to 0.00 m/s.',
    advancedEquations: [
      '\\text{Aspect Ratio: } \\frac{H}{D} \\approx 1.05 \\quad (\\text{vs. } \\sim 3.0 - 4.0 \\text{ in 1g})',
      '\\text{Radial Continuity: } \\frac{1}{r^2} \\frac{\\partial}{\\partial r}(r^2 \\rho v_r) = 0'
    ],
    advancedReferences: [
      'Sundararajan, R., Nayagam, V., & Williams, F. A. "Droplet Combustion in Microgravity", Microgravity Science and Technology, 2014.',
      'Dietrich, D. L. et al., "Droplet Combustion Experiments on the ISS", NASA TM-2014-218388.'
    ]
  },
  {
    step: 4,
    title: 'Oxygen & Heat in Freefall',
    subtitle: 'From high-speed convective pump to slow molecular diffusion',
    icon: Wind,
    badge: 'Transport Physics',
    beginnerText: 'On Earth, a fire pumps its own fresh air by pulling in oxygen from the bottom. In space, that pump is dead. Oxygen molecules can only reach the fire by bumping randomly into other air molecules (diffusion). Because diffusion is very slow, space fires burn slower and produce far less soot, giving them a faint blue glow instead of a bright yellow flame.',
    beginnerAnalogy: 'Instead of having a high-powered vacuum fan blowing fresh air across the fire, oxygen arrives like a drop of food coloring slowly spreading through still water.',
    advancedText: 'In 1g, the Peclet number Pe = V·L/D_O₂ >> 1 (convection dominates). In 0g, Pe << 1 (pure molecular diffusion). Oxygen transport is governed strictly by Fick’s second law: J_O₂ = -D_O₂·∇C. Furthermore, because convective heat removal is zero, thermal dissipation occurs solely via 360° radiation (q_rad = ε·σ·A·(T⁴ - T_∞⁴)) and thermal conduction. The burning rate constant K drops by roughly 40-50% compared to terrestrial rates.',
    advancedEquations: [
      'J_{O_2} = -\\rho D_{O_2} \\frac{dY_{O_2}}{dr}',
      'q_{\\text{rad}} = \\epsilon_{\\text{flame}} \\sigma A_{\\text{flame}} (T_{\\text{flame}}^4 - T_{\\infty}^4)',
      '\\text{D}^2\\text{-Law: } D^2(t) = D_0^2 - K t'
    ],
    advancedReferences: [
      'Spalding, D. B. "The combustion of liquid fuels", Fourth Symposium on Combustion, 1953.',
      'Turns, S. R. "An Introduction to Combustion", Ch. 10 (Droplet Evaporation and Burning).'
    ]
  },
  {
    step: 5,
    title: 'NASA Flight Discoveries',
    subtitle: 'FLEX, BASS-II, SAFFIRE, and the mystery of the Cool Flame',
    icon: FlaskConical,
    badge: 'ISS PSI Flight Data',
    beginnerText: 'When NASA tested fires on the space station (the FLEX experiment), they noticed something astonishing. The bright hot flame seemed to go out, but the fuel droplet kept shrinking! They discovered a "cool flame"—a ghostly fire burning at just ~800 K with zero visible light or smoke, sustained by a special low-temperature chemical reaction.',
    beginnerAnalogy: 'Like coals buried deep in a campfire: you can’t see any flame with your eyes, but heat is still being consumed and fuel is still burning.',
    advancedText: 'In 2012, Nayagam, Dietrich, and Williams published the groundbreaking discovery of quasi-steady cool-flame droplet burning in Combustion & Flame. Following visible hot-flame extinction at T ~ 1700 K due to radiative heat loss, low-temperature alkylperoxy chemical kinetics (R + O₂ ⇌ RO₂ → QOOH → ketohydroperoxides) took over, maintaining droplet vaporization at T ~ 650–850 K. BASS-II and SAFFIRE-I expanded this to solid polymers and spacecraft fabrics.',
    advancedEquations: [
      'R + O_2 \\rightleftharpoons RO_2 \\to \\cdot QOOH \\to \\text{ketohydroperoxides} \\to 2\\text{OH} + \\text{products}',
      '\\text{Cool Flame Regime: } T \\sim 650 - 850\\text{ K}, \\quad \\text{Zero Visible Soot Luminescence}'
    ],
    advancedReferences: [
      'Nayagam, V., Dietrich, D. L., Ferkul, P. V., et al. "Can cool flames support quasi-steady droplet combustion?", Combustion and Flame 159 (2012) 3583-3588.',
      'Ferkul, P. V., Olson, S. L., Urban, D. L., et al. "Results of Large-Scale Spacecraft Flammability Tests (SAFFIRE)", NASA NTRS 20170008805.'
    ]
  },
  {
    step: 6,
    title: 'Spacecraft Fire Safety',
    subtitle: 'Why space fires are the ultimate nightmare for astronauts',
    icon: ShieldAlert,
    badge: 'Crew Survival',
    beginnerText: 'You cannot open a window in space! If a fire starts inside a spacecraft, astronauts cannot run away. Smoke doesn’t rise to ceiling alarms, ventilation fans can feed the fire fresh air, and chemical fire extinguishers could choke the crew with toxic gas. Spacecraft fires must be prevented before they start, and quickly smothered by cutting off cabin airflow.',
    beginnerAnalogy: 'Imagine being trapped in a sealed submarine underwater with a fire burning: every breath of smoke stays in the room, and every fire extinguisher you spray replaces your breathable air.',
    advancedText: 'Spacecraft fire safety is constrained by hermetic volume limits, absence of natural convection, and low-ventilation regimes. Under NASA-STD-6001, materials undergo rigorous flammability certification. Standard ISS protocol mandates immediate ventilation shutdown (IMV dampers closed) to promote self-extinction via oxygen starvation, followed by localized fine water-mist deployment to avoid toxic gas accumulation.',
    advancedEquations: [
      '\\text{Damköhler Number: } Da = \\frac{\\tau_{\\text{flow}}}{\\tau_{\\text{chem}}} \\approx \\frac{L/v}{\\tau_{\\text{chem}}}',
      '\\text{Extinction occurs when } Da < Da_{\\text{crit}} \\text{ (residence time insufficient for chemical reaction)}'
    ],
    advancedReferences: [
      'NASA-STD-6001B, "Flammability, Offgassing, and Compatibility Requirements and Test Procedures".',
      'Urban, D. L., Ruff, G. A., & Ferkul, P. V. "Spacecraft Fire Safety: Past, Present, and Future", Progress in Energy and Combustion Science, 2019.'
    ]
  },
  {
    step: 7,
    title: 'Moon & Mars Frontiers',
    subtitle: 'Why partial gravity could be even more dangerous than zero gravity',
    icon: Moon,
    badge: 'Artemis Exploration',
    beginnerText: 'On the Moon (1/6th gravity) and Mars (3/8th gravity), fire behaves in a dangerous middle ground. There is just enough gravity to create a gentle upward breeze of fresh oxygen, but not enough to cool the fire down like on Earth. This "Goldilocks zone" can actually make partial-gravity fires burn longer and spread more easily than on Earth or in zero-g!',
    beginnerAnalogy: 'Like gently blowing on glowing barbecue coals: you provide just enough fresh oxygen to make them burn hotter without blowing them out.',
    advancedText: 'In partial gravity (0.16g Moon, 0.38g Mars), buoyancy is weak (10 < Gr < 1000). Research from NASA\'s SoFIE (Solid Fuel Ignition and Extinction) facility reveals a non-monotonic flammability hazard curve: low buoyant velocities supply fresh oxidizer to the reaction zone without generating the high strain rates or convective cooling that extinguish flames at 1g. Furthermore, NASA Artemis exploration atmospheres (34% O₂ at 8.2 psi) dramatically expand material flammability limits.',
    advancedEquations: [
      'g_{\\text{Moon}} = 1.62\\text{ m/s}^2 \\quad (0.166 g_0), \\quad g_{\\text{Mars}} = 3.72\\text{ m/s}^2 \\quad (0.38 g_0)',
      '\\text{Strain Rate: } a_s \\sim \\frac{v_{nc}}{L} \\propto \\sqrt{\\frac{g}{L}} \\implies \\text{Reduced strain allows easier flame holding}'
    ],
    advancedReferences: [
      'Olson, S. L., Ferkul, P. V., & T\'ien, J. S. "Near-Limit Flame Spread in Microgravity and Partial Gravity", Combustion Theory and Modelling, 2018.',
      'NASA Artemis Program, "Exploration Atmosphere Architecture (8.2 psi / 34% O2)", NASA TP-20210014022.'
    ]
  }
];

export const EducationalStoryteller: React.FC<{ isDark?: boolean }> = ({ isDark = false }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);

  const step = STORY_STEPS[currentStepIndex];
  const Icon = step.icon;

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                EXPERIENCE 6: Guided Scientific Learning Journey
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold border border-purple-300/40">
                7-STEP STORYTELLER
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              From everyday Earth candles to the future of fire safety on Lunar and Martian bases.
            </p>
          </div>
        </div>

        {/* Level Toggle: Beginner vs Advanced */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono">
          <button
            onClick={() => setIsAdvanced(false)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              !isAdvanced
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Beginner (Intuitive)
          </button>
          <button
            onClick={() => setIsAdvanced(true)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isAdvanced
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" /> Advanced (Equations & Papers)
          </button>
        </div>
      </div>

      {/* 7-Step Progress Stepper */}
      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {STORY_STEPS.map((s, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isPassed = idx < currentStepIndex;
          return (
            <button
              key={s.step}
              onClick={() => setCurrentStepIndex(idx)}
              className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                  : isPassed
                  ? isDark
                    ? 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                    : 'bg-purple-50 text-purple-800 border-purple-200'
                  : isDark
                  ? 'bg-slate-800/40 text-slate-500 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-[10px] font-mono block font-bold">Step {s.step}</span>
              <span className="text-xs font-semibold truncate block">{s.badge}</span>
            </button>
          );
        })}
      </div>

      {/* Main Story Content Card */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-800/50 border-slate-700 text-slate-200' : 'bg-slate-50/80 border-slate-200 text-slate-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500 text-white shadow-md">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold block">
                Stage {step.step} of 7 • {step.badge}
              </span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {step.title}
              </h4>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {step.subtitle}
          </span>
        </div>

        {/* Story Body */}
        {!isAdvanced ? (
          /* BEGINNER MODE */
          <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p className="font-normal">{step.beginnerText}</p>
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Everyday Analogy: </strong>
                {step.beginnerAnalogy}
              </div>
            </div>
          </div>
        ) : (
          /* ADVANCED SCIENTIFIC MODE */
          <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <p className="font-medium text-slate-800 dark:text-slate-200">{step.advancedText}</p>

            {/* Governing Equations Block */}
            {step.advancedEquations.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-900 text-sky-300 border border-slate-700 font-mono space-y-1.5 shadow-inner">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                  Governing Continuum Relationships:
                </span>
                {step.advancedEquations.map((eq, i) => (
                  <div key={i} className="text-xs font-bold text-sky-400 py-0.5">
                    {eq}
                  </div>
                ))}
              </div>
            )}

            {/* Research References */}
            {step.advancedReferences.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span className="font-bold uppercase tracking-wider block text-slate-600 dark:text-slate-300">
                  Peer-Reviewed Research Citations:
                </span>
                {step.advancedReferences.map((ref, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>{ref}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
            className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 disabled:opacity-30 cursor-pointer flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Step
          </button>

          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {currentStepIndex + 1} / {STORY_STEPS.length}
          </span>

          <button
            onClick={() => setCurrentStepIndex(Math.min(STORY_STEPS.length - 1, currentStepIndex + 1))}
            disabled={currentStepIndex === STORY_STEPS.length - 1}
            className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-purple-600 text-white disabled:opacity-30 cursor-pointer flex items-center gap-1 hover:bg-purple-500 shadow-sm transition-colors"
          >
            Next Step <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
