import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Sparkles,
  Flame,
  Satellite,
  Activity,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';

interface HeroScrollBarProps {
  onNavigate?: (module: string, param?: string) => void;
}

interface ChapterData {
  id: string;
  name: string;
  badge: string;
  frameStart: number;
  frameEnd: number;
  title: string;
  subtitle: string;
  description: string;
  telemetry: {
    label: string;
    value: string;
    detail: string;
  }[];
  nasaInsight: string;
  missionBadge: string;
}

const TOTAL_FRAMES = 30;

const CHAPTERS: ChapterData[] = [
  {
    id: 'orbit',
    name: 'Orbit Ingress',
    badge: 'STAGE 01 • LEO TRAJECTORY',
    frameStart: 1,
    frameEnd: 10,
    title: 'Orbital Microgravity & Buoyancy Suppression',
    subtitle: 'Suppressing 1-g natural convection to uncover true chemical combustion kinetics',
    description:
      'In terrestrial 1-g gravity, buoyant upwelling stretches combustion flames into elongated teardrops and causes chaotic mixing. In low Earth orbit aboard the ISS and Cygnus cargo spacecraft, gravity forces vanish down to 10⁻⁶ g, enabling researchers to study combustion without natural buoyant convection.',
    telemetry: [
      { label: 'GRAVITY ACCEL', value: '1.2 × 10⁻⁶ g', detail: 'Quasi-steady microgravity' },
      { label: 'ORBITAL VELOCITY', value: '7.66 km/s', detail: '408 km Low Earth Orbit' },
      { label: 'GRASHOF NUMBER', value: 'Gr ≈ 0.00', detail: 'Zero buoyancy-driven flow' },
      { label: 'RESEARCH PLATFORM', value: 'Cygnus & ISS', detail: 'Saffire / CIR flight series' },
    ],
    nasaInsight: 'NASA Saffire tests aboard departed Cygnus spacecraft ignited large-scale fires up to 1-meter in length to quantify spacecraft cargo hull survivability.',
    missionBadge: 'NASA Glenn Research Center • Saffire Program',
  },
  {
    id: 'chamber',
    name: 'CIR Core Facility',
    badge: 'STAGE 02 • DIAGNOSTIC CHAMBER',
    frameStart: 11,
    frameEnd: 20,
    title: 'The Combustion Integrated Rack (CIR)',
    subtitle: 'Hermetic 100-liter chamber diagnostics with multi-angle optical pyrometry',
    description:
      'Housed within the US Destiny laboratory module, the CIR features a 100-liter containment chamber equipped with high-speed color videography, intensified UV OH* chemiluminescence, and laser diagnostics. Atmospheric composition, pressure (0.2–3.0 atm), and forced airflow are tuned to emulate Artemis and Gateway cabins.',
    telemetry: [
      { label: 'CHAMBER VOLUME', value: '100 Liters', detail: 'Triple-sealed containment' },
      { label: 'OXYGEN INDEX', value: '15.0% – 34.0%', detail: 'Controlled O₂ enrichment' },
      { label: 'OPTICAL SENSORS', value: 'Dual High-Speed', detail: 'UV OH* + Infrared radiometry' },
      { label: 'VENTILATION FLOW', value: '0 – 20 cm/s', detail: 'Low-speed forced oxidizer' },
    ],
    nasaInsight: 'The CIR MDCA and SoFIE test inserts isolate fuel geometry, measuring flame propagation across PMMA, Nomex, and silicone tubing under lunar ventilation conditions.',
    missionBadge: 'ISS National Lab • CIR MDCA / SoFIE Facility',
  },
  {
    id: 'droplet',
    name: 'Spherical Flame',
    badge: 'STAGE 03 • REACTION KINETICS',
    frameStart: 21,
    frameEnd: 30,
    title: 'Spherical Diffusion & Cool Flame Kinetics',
    subtitle: 'Perfect spherical symmetry revealing low-temperature quasi-steady burning',
    description:
      'Without upward buoyancy, the flame front expands into a tranquil, glowing blue sphere governed purely by molecular oxygen diffusion. During the FLEX experiment series, NASA scientists observed sustained "cool flames" burning at 500–800 K after apparent extinction—prompting new fire-detection protocols for deep space vehicles.',
    telemetry: [
      { label: 'FLAME GEOMETRY', value: 'Spherical Sphere', detail: 'Pure radial symmetry' },
      { label: 'COOL FLAME TEMP', value: '550 – 780 K', detail: 'Non-luminous low-T reaction' },
      { label: 'BURNING RATE (K)', value: '0.42 mm²/s', detail: 'Quasi-steady d²-law decay' },
      { label: 'EXPLORATION IMPACT', value: 'Artemis & Mars', detail: 'ECLSS fire detection safety' },
    ],
    nasaInsight: 'Cool flame combustion produces zero visible light but continues consuming fuel and generating carbon monoxide, fundamentally changing spacecraft sensor placement.',
    missionBadge: 'NASA PSI Database • FLEX / ACME Flight Data',
  },
];

export const HeroScrollBar: React.FC<HeroScrollBarProps> = ({ onNavigate }) => {
  const [currentFrame, setCurrentFrame] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [firstFrameReady, setFirstFrameReady] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        const img = imagesRef.current[currentFrame - 1];
        if (img && img.complete) {
          renderFrameToCanvas(img);
        }
      }, 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [currentFrame]);

  // Preload all 30 frames
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = i.toString().padStart(2, '0');
      img.src = `/hero-frames/frame_${frameNum}.jpg`;

      img.onload = () => {
        loadedCount++;
        setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
        if (i === 1) {
          setFirstFrameReady(true);
        }
        if (loadedCount === TOTAL_FRAMES) {
          setIsLoaded(true);
        }
        // If first frame loaded, draw immediately
        if (i === 1 && canvasRef.current) {
          renderFrameToCanvas(img);
        }
      };

      img.onerror = () => {
        console.warn(`Frame ${frameNum} failed to load.`);
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) setIsLoaded(true);
      };

      images.push(img);
    }

    imagesRef.current = images;

    return () => {
      imagesRef.current = [];
    };
  }, []);

  // Render specific image onto canvas
  const renderFrameToCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const targetWidth = Math.round(rect.width * dpr);
    const targetHeight = Math.round(rect.height * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Aspect cover calculation
    const cWidth = rect.width;
    const cHeight = rect.height;
    const iWidth = img.naturalWidth;
    const iHeight = img.naturalHeight;

    const scale = Math.max(cWidth / iWidth, cHeight / iHeight);
    const renderWidth = iWidth * scale;
    const renderHeight = iHeight * scale;
    const offsetX = (cWidth - renderWidth) / 2;
    const offsetY = (cHeight - renderHeight) / 2;

    ctx.clearRect(0, 0, cWidth, cHeight);
    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);

    // Subtle technical scanline / vignette effect for aerospace HUD aesthetic
    const gradient = ctx.createRadialGradient(
      cWidth / 2,
      cHeight / 2,
      Math.min(cWidth, cHeight) * 0.35,
      cWidth / 2,
      cHeight / 2,
      Math.max(cWidth, cHeight) * 0.85
    );
    gradient.addColorStop(0, 'rgba(11, 17, 32, 0)');
    gradient.addColorStop(0.7, 'rgba(11, 17, 32, 0.35)');
    gradient.addColorStop(1, 'rgba(11, 17, 32, 0.85)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cWidth, cHeight);

    ctx.restore();
  }, []);

  // Update canvas when currentFrame changes or frames become ready
  useEffect(() => {
    const img = imagesRef.current[currentFrame - 1];
    if (img && img.complete) {
      renderFrameToCanvas(img);
    }
  }, [currentFrame, firstFrameReady, isLoaded, renderFrameToCanvas]);

  // Handle window resize to re-render canvas crispness
  useEffect(() => {
    const handleResize = () => {
      const img = imagesRef.current[currentFrame - 1];
      if (img && img.complete) {
        renderFrameToCanvas(img);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentFrame, renderFrameToCanvas]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    const fps = 12 * playbackSpeed;
    const interval = 1000 / fps;

    const step = (now: number) => {
      const elapsed = now - lastTime;
      if (elapsed >= interval) {
        lastTime = now - (elapsed % interval);
        setCurrentFrame((prev) => {
          if (prev >= TOTAL_FRAMES) return 1;
          return prev + 1;
        });
      }
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // Mouse wheel scrubber over hero container
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 4) return;
    const direction = e.deltaY > 0 ? 1 : -1;

    // When at frame 30 and scrolling down, allow smooth page scroll down into the next section
    if (currentFrame === TOTAL_FRAMES && direction > 0) {
      return;
    }
    // When at frame 1 and scrolling up, allow normal scroll
    if (currentFrame === 1 && direction < 0) {
      return;
    }

    e.preventDefault();
    setCurrentFrame((prev) => Math.max(1, Math.min(TOTAL_FRAMES, prev + direction)));
  };

  // Window-level wheel handler so scrolling anywhere advances frames when at hero
  useEffect(() => {
    const onWindowWheel = (e: WheelEvent) => {
      // If user has scrolled down into the research workstation, let them scroll naturally!
      if (window.scrollY > 40) return;

      if (Math.abs(e.deltaY) < 4) return;
      const direction = e.deltaY > 0 ? 1 : -1;

      // When at frame 30 and scrolling down, let page scroll down!
      if (currentFrame === TOTAL_FRAMES && direction > 0) {
        return;
      }
      if (currentFrame === 1 && direction < 0) {
        return;
      }

      e.preventDefault();
      setCurrentFrame((prev) => Math.max(1, Math.min(TOTAL_FRAMES, prev + direction)));
    };

    window.addEventListener('wheel', onWindowWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWindowWheel);
  }, [currentFrame]);

  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const touchStartFrameRef = useRef<number>(1);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchStartFrameRef.current = currentFrame;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - touchStartXRef.current;
      const deltaY = e.touches[0].clientY - touchStartYRef.current;
      const dominant = Math.abs(deltaY) > Math.abs(deltaX) ? -deltaY : deltaX;
      const frameDelta = Math.round(dominant / 25);
      const newFrame = Math.max(1, Math.min(TOTAL_FRAMES, touchStartFrameRef.current + frameDelta));
      setCurrentFrame(newFrame);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setCurrentFrame((prev) => Math.min(TOTAL_FRAMES, prev + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setCurrentFrame((prev) => Math.max(1, prev - 1));
    } else if (e.key === ' ') {
      e.preventDefault();
      setIsPlaying((prev) => !prev);
    }
  };

  // Active Chapter calculation
  const currentChapter =
    CHAPTERS.find((ch) => currentFrame >= ch.frameStart && currentFrame <= ch.frameEnd) ||
    CHAPTERS[0];

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="relative w-screen h-screen overflow-hidden bg-black text-white focus:outline-none select-none m-0 p-0"
      aria-label="NASA Microgravity Flight Scene Scroller"
    >
      {/* 1. CINEMATIC FULL-SCREEN CANVAS VIEWPORT */}
      <div className="relative w-full h-full overflow-hidden bg-black">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover block cursor-ns-resize"
          title="Scroll mouse wheel or swipe to traverse microgravity combustion sequence"
        />

        {/* Loading overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center space-y-3 z-30">
            <div className="flex items-center space-x-2 text-sky-400 font-mono text-sm">
              <Flame className="w-5 h-5 animate-pulse text-amber-400" />
              <span>CACHING NASA FLIGHT FRAMES ({loadProgress}%)</span>
            </div>
            <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-amber-400 transition-all duration-150"
                style={{ width: `${loadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* TOP STATUS BAR & MISSION TELEMETRY STRIP */}
        <div className="absolute top-0 left-0 right-0 p-3 sm:p-5 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700/60 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-400 font-bold">DIGITIZED FLIGHT TELEMETRY</span>
              <span className="text-slate-500">•</span>
              <span className="text-sky-300 font-medium">{currentChapter.badge}</span>
            </div>

            {/* Chapter Jump Pills in HUD */}
            <div className="hidden sm:flex items-center space-x-1 bg-slate-900/80 backdrop-blur-md p-1 rounded-lg border border-slate-700/60 text-[11px] font-mono pointer-events-auto">
              {CHAPTERS.map((ch, idx) => {
                const isActive = currentChapter.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setCurrentFrame(ch.frameStart)}
                    className={`px-2.5 py-1 rounded transition-all ${
                      isActive
                        ? 'bg-sky-500 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    0{idx + 1} {ch.name}
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex items-center space-x-1.5 bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
              <Satellite className="w-3.5 h-3.5 text-sky-400" />
              <span>CIR MDCA • ISS DESTINY LAB</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 pointer-events-auto">
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors backdrop-blur-md"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 2. CENTERED STAGE NARRATIVE DISPLAY (IN THE MIDDLE OF THE SCREEN) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 sm:p-6 md:p-8 z-10 select-none">
          <div className="max-w-3xl flex flex-col items-center text-center transition-all duration-300">
            {/* Mission & Stage Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-900/85 border border-sky-400/40 text-sky-300 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider mb-3.5 backdrop-blur-xl shadow-2xl">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{currentChapter.badge}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">{currentChapter.missionBadge}</span>
            </div>

            {/* Stage Title in Center */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] leading-tight">
              {currentChapter.title}
            </h1>

            {/* Stage Subtitle */}
            <p className="text-sm sm:text-lg md:text-xl text-sky-200 font-mono font-medium mt-2.5 max-w-2xl drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]">
              {currentChapter.subtitle}
            </p>

            {/* Stage Detailed Description */}
            <div className="mt-4 max-w-2xl bg-slate-950/75 backdrop-blur-xl px-5 sm:px-8 py-3.5 sm:py-4 rounded-2xl border border-slate-800/80 shadow-2xl">
              <p className="text-xs sm:text-sm md:text-base text-slate-200 font-normal leading-relaxed drop-shadow">
                {currentChapter.description}
              </p>
            </div>

            {/* Micro scroll hint */}
            <div className="mt-4 flex items-center space-x-2 text-[11px] font-mono text-slate-400 bg-slate-900/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-slate-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              <span>SCROLL TO ADVANCE EXPERIMENT</span>
            </div>
          </div>
        </div>

        {/* FLOATING TOPIC TELEMETRY CARD (DESKTOP) */}
        <div className="hidden lg:block absolute top-20 right-6 w-72 bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 rounded-xl p-3.5 text-xs shadow-2xl z-20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center space-x-1">
              <Activity className="w-3 h-3 text-sky-400" />
              <span>Digitized Flight Sensor Feed</span>
            </span>
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
              SYNCHRONIZED
            </span>
          </div>

          <div className="space-y-2">
            {currentChapter.telemetry.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/60 px-2 py-1.5 rounded border border-slate-800/60 font-mono text-[11px]">
                <div>
                  <div className="text-[10px] text-slate-400">{t.label}</div>
                  <div className="text-[9px] text-slate-500">{t.detail}</div>
                </div>
                <div className="text-right font-bold text-sky-300">{t.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-start space-x-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-tight text-slate-300">{currentChapter.nasaInsight}</span>
          </div>
        </div>

        {/* Scroll Down to Workstation Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <button
            onClick={() => {
              const el = document.getElementById('research-workstation');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-2 bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-1.5 rounded-full border border-slate-700/70 text-xs font-mono transition-all backdrop-blur-md shadow-2xl group cursor-pointer"
          >
            <span>RESEARCH WORKSTATION & TELEMETRY</span>
            <ChevronDown className="w-4 h-4 text-sky-400 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroScrollBar;
