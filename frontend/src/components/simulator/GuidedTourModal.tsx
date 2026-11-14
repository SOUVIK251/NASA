import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  Flame,
  CircleDot,
  Clock,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Volume2
} from 'lucide-react';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

interface TourStep {
  title: string;
  subtitle: string;
  icon: any;
  accentColor: string;
  badge: string;
  bulletPoints: string[];
  takeaway: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Why Flames Are Round in Space',
    subtitle: 'Without gravity, hot air has nowhere to rise',
    icon: Flame,
    accentColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    badge: 'Step 1 of 5 • Physics Foundation',
    bulletPoints: [
      'On Earth, cold heavy air sinks and pushes warm light air UP (buoyancy), making candle flames teardrop-shaped.',
      'In orbit aboard the Space Station, everything is in freefall—there is no "up" or "down".',
      'Fuel vapor and oxygen diffuse equally in all directions, so flames become calm, glowing spheres.'
    ],
    takeaway: 'Takeaway: Microgravity reveals pure molecular diffusion unmasked by Earth’s chaotic upward draft.'
  },
  {
    title: 'What the Droplet Is',
    subtitle: 'A miniature fuel bead suspended on ceramic needles',
    icon: CircleDot,
    accentColor: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
    badge: 'Step 2 of 5 • Test Setup',
    bulletPoints: [
      'In NASA’s FLEX experiment, astronauts deploy a tiny bead of liquid fuel (n-heptane, ~3 mm wide) on thin fibers.',
      'Two spark electrodes ignite the droplet into a spherical flame.',
      'As the fuel evaporates and burns, the droplet shrinks until it runs out of fuel or quenches.'
    ],
    takeaway: 'Takeaway: Watching a single droplet is the cleanest way in the universe to measure how fuels burn.'
  },
  {
    title: 'How to Read the Timeline',
    subtitle: 'Hot Flame → Cool Flame → Extinction',
    icon: Clock,
    accentColor: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    badge: 'Step 3 of 5 • Combustion Timeline',
    bulletPoints: [
      'Stage 1 (0 to ~5 s): HOT FLAME. Burns bright yellow/orange at ~1700 K. Droplet shrinks rapidly.',
      'Stage 2 (at ~5 s): RADIATIVE EXTINCTION. The visible flame vanishes. On Earth, the fire would be dead.',
      'Stage 3 (5 to 13 s): COOL FLAME. In space, the fuel secretly keeps burning at 600–800 K with ZERO visible light!',
      'Stage 4 (at ~13 s): FINAL EXTINCTION. Fuel is completely consumed.'
    ],
    takeaway: 'Takeaway: Cool flames are invisible. Spacecraft fires can keep burning even when astronauts see nothing.'
  },
  {
    title: 'What Colors & Layers Mean',
    subtitle: 'Blue reactions, yellow soot, and airflow overlays',
    icon: Layers,
    accentColor: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
    badge: 'Step 4 of 5 • Visual Guide',
    bulletPoints: [
      'Blue glow = Clean gas-phase reaction zones where fuel vapor meets incoming oxygen.',
      'Yellow/Orange glow = Hot glowing soot particles (unburned carbon).',
      'Physics Vision toggles = Turn on buoyancy plumes, forced airflow arrows, and oxygen diffusion fields.'
    ],
    takeaway: 'Takeaway: Use the "Physics Vision" toolbar to reveal invisible gas flows around the flame.'
  },
  {
    title: 'Data vs Models: Our Scientific Promise',
    subtitle: 'Every number is tagged so you always know its origin',
    icon: ShieldCheck,
    accentColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    badge: 'Step 5 of 5 • Data Honesty',
    bulletPoints: [
      'MEASURED (TABLE) = Direct scalar number copied from an official NASA report table.',
      'APPROXIMATED CURVE = Time curve constructed to match published burn rates (see DATA_NEEDED.md).',
      'MODEL PREDICTION = Computed by our physics formulas or machine learning.',
      'ILLUSTRATIVE = Artistic rendering estimate where no sensor data exists. You can toggle these OFF!'
    ],
    takeaway: 'Takeaway: We never call a model calculation a "NASA measurement." Science demands transparency.'
  }
];

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({
  isOpen,
  onClose,
  isDark = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('flame_in_freefall_tour_seen', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('flame_in_freefall_tour_seen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden font-sans ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                FLAME IN FREEFALL • 60-SECOND ORIENTATION
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {step.badge}
              </span>
            </div>
          </div>

          <button
            onClick={handleSkip}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Close Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex px-5 pt-3 gap-1.5">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                idx === currentStep
                  ? 'bg-sky-500 shadow-sm'
                  : idx < currentStep
                  ? 'bg-emerald-500'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Main Step Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-2xl border ${step.accentColor} shrink-0`}>
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="text-xs font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                {step.subtitle}
              </p>
            </div>
          </div>

          {/* Bullet Points */}
          <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {step.bulletPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-2" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          {/* Bottom Key Takeaway Box */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">
            {step.takeaway}
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="text-xs font-mono text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>{currentStep === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
