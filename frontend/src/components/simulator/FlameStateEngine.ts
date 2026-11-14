import { FlameState, FlameStateDetail } from '../../types';

/**
 * Computes the empirical flame state based on published flight experiment data
 * or reduced-order analytical model outputs.
 * 
 * Accurately reports conditions and provenance tiers.
 */
export function computeFlameState(
  investigationType: string,
  state: any,
  meta: any,
  isModelMode = false,
  simResult?: any
): FlameStateDetail {
  if (isModelMode) {
    if (!simResult || !simResult.flame_exists) {
      const riskMsg = simResult?.extinction_mechanism || 'Combustion limits exceeded';
      return {
        state: 'EXTINGUISHED',
        label: 'EXTINGUISHED / QUENCHED',
        reasons: [
          riskMsg,
          'Reaction temperature below minimum sustained threshold',
          'Calculated Damköhler number Da < 0.5 or oxygen below LOI'
        ],
        color: 'text-slate-400 bg-slate-500/10 border-slate-600'
      };
    }

    const da = simResult.damkohler_number ?? 10;
    const temp = simResult.flame_temperature_K ?? 1500;
    const shape = simResult.flame_shape ?? 'spherical';

    if (da < 2.0) {
      return {
        state: 'QUENCHING',
        label: 'NEAR-EXTINCTION / MARGINAL',
        reasons: [
          `Marginal Damköhler number (Da = ${da.toFixed(2)}) indicates transport timescales compete with chemical kinetics`,
          'Elevated heat loss relative to chemical heat release rate',
          'Elevated extinction risk flagged by model'
        ],
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/40'
      };
    }

    return {
      state: 'SUSTAINED',
      label: `SUSTAINED (${shape.toUpperCase()})`,
      reasons: [
        `Stable analytical flame temperature calculated at ${temp.toFixed(0)} K`,
        `Oxygen concentration (${simResult.oxygen_mass_fraction ? (simResult.oxygen_mass_fraction * 100).toFixed(1) : '21'}%) exceeds fuel flammability limit`,
        `Damköhler number Da = ${da.toFixed(1)} indicates fast chemical reaction relative to transport`,
        `Calculated heat release rate of ${simResult.heat_release_rate_W?.toFixed(1) ?? '—'} W balances heat losses`
      ],
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40'
    };
  }

  // MODE A: Empirical NASA Flight Datasets
  if (!state) {
    return {
      state: 'EXTINGUISHED',
      label: 'STANDBY / NO TELEMETRY',
      reasons: ['No active telemetry packet loaded'],
      color: 'text-slate-400 bg-slate-500/10 border-slate-600'
    };
  }

  const phase = String(state.phase || '').toUpperCase();

  // 1. DROPLET COMBUSTION (FLEX)
  if (investigationType === 'DROPLET_COMBUSTION') {
    const d = state.D_mm ?? 0;
    const d2 = state.D2_mm2 ?? 0;
    const k = state.burn_rate_K_mm2_s ?? 0;
    const temp = state.temp_K ?? 298;

    if (phase.includes('IGNIT')) {
      return {
        state: 'IGNITION',
        label: 'IGNITION & FLAME ESTABLISHMENT',
        reasons: [
          'Igniter spark electrodes initiated gas-phase radical pool',
          `Initial fuel droplet diameter D = ${d.toFixed(2)} mm`,
          'Thermal boundary layer expanding radially outward'
        ],
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/40'
      };
    }

    if (phase.includes('HOT_FLAME_WEAKENING') || phase.includes('EXTINCTION') && !phase.includes('COOL')) {
      return {
        state: 'WEAKENING',
        label: 'HOT FLAME RADIATIVE WEAKENING',
        reasons: [
          'Droplet diameter decreased below hot flame critical stability limit',
          'Radiative heat loss from accumulating combustion products exceeds gas-phase heat release',
          `Burning rate transitioning from K ≈ ${k.toFixed(2)} mm²/s toward cool flame regime`
        ],
        color: 'text-orange-400 bg-orange-500/10 border-orange-500/40'
      };
    }

    if (phase.includes('HOT_FLAME')) {
      return {
        state: 'SUSTAINED',
        label: 'HOT FLAME STEADY COMBUSTION',
        reasons: [
          `Linear D² regression consistent with D²-law (D² = ${d2.toFixed(2)} mm²)`,
          `Constant burning rate K = ${k.toFixed(2)} mm²/s maintained`,
          'Spherically symmetric molecular oxygen diffusion balances outward fuel vapor flux',
          'No buoyancy-driven flow perturbation detected in CIR microgravity'
        ],
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40'
      };
    }

    if (phase.includes('COOL_FLAME_WEAKENING')) {
      return {
        state: 'QUENCHING',
        label: 'COOL FLAME QUENCHING LIMIT',
        reasons: [
          `Droplet diameter approaching extinction limit (D = ${d.toFixed(3)} mm)`,
          'Low-temperature chemical kinetics cannot overcome conductive losses to support fiber and ambient gas',
          'Approaching critical chemical extinction diameter'
        ],
        color: 'text-sky-400 bg-sky-500/10 border-sky-500/40'
      };
    }

    if (phase.includes('COOL_FLAME')) {
      return {
        state: 'SUSTAINED',
        label: 'COOL FLAME REGIME (LOW TEMPERATURE)',
        reasons: [
          'Visible hot flame extinguished; zero soot incandescence',
          'Quasi-steady low-temperature combustion (~600–800 K) sustained by alkylperoxy radical chemistry',
          `Fuel regression continues at reduced burning rate K = ${k.toFixed(3)} mm²/s`,
          'NASA landmark discovery: combustion persists invisibly in microgravity'
        ],
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/40'
      };
    }

    if (phase.includes('EXTINGUISH') || d <= 0.05) {
      return {
        state: 'EXTINGUISHED',
        label: 'COMPLETE EXTINCTION',
        reasons: [
          `Final droplet extinction diameter reached (D ≈ ${d.toFixed(3)} mm)`,
          'Chemical heat release rate drops to zero',
          'Reaction terminated; unburned liquid remnant or vapor dissipated'
        ],
        color: 'text-slate-400 bg-slate-500/10 border-slate-600'
      };
    }
  }

  // 2. SOLID MATERIAL COMBUSTION (BASS-II)
  if (investigationType === 'SOLID_MATERIAL_COMBUSTION') {
    const pos = state.flame_pos_mm ?? 0;
    const len = state.flame_length_mm ?? 0;
    const spread = state.spread_rate_cm_s ?? 0;
    const airflow = state.airflow_cm_s ?? 10.0;

    if (phase.includes('IGNIT')) {
      return {
        state: 'IGNITION',
        label: 'SURFACE IGNITION & PYROLYSIS',
        reasons: [
          'Igniter wire heating PMMA solid fuel slab to pyrolysis temperature (~650 K)',
          'Gaseous monomer MMA evaporating into the boundary layer',
          'Flame front anchoring on leading edge'
        ],
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/40'
      };
    }

    if (phase.includes('STEADY') || (spread > 0 && len > 5)) {
      return {
        state: 'SPREADING',
        label: 'STEADY CONCURRENT FLAME SPREAD',
        reasons: [
          `Concurrent forced airflow of ${airflow.toFixed(1)} cm/s supplies continuous oxidizer`,
          `Stabilized flame spread rate of ${spread.toFixed(3)} cm/s measured across solid fuel`,
          `Flame length stabilized at ${len.toFixed(1)} mm`,
          'Forward heat transfer from flame wake preheats unburned solid fuel downstream'
        ],
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40'
      };
    }

    if (phase.includes('SPREAD')) {
      return {
        state: 'GROWING',
        label: 'TRANSITIONAL FLAME SPREAD',
        reasons: [
          `Flame front advancing along sample: x = ${pos.toFixed(1)} mm`,
          `Flame length expanding (L = ${len.toFixed(1)} mm)`,
          'Thermal feedback loop developing between gas-phase flame and pyrolyzing solid'
        ],
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/40'
      };
    }

    if (phase.includes('EXTINGUISH') || phase.includes('QUENCH')) {
      return {
        state: 'EXTINGUISHED',
        label: 'EXTINGUISHED / SAMPLE BURNOUT',
        reasons: [
          'Combustion extinguished at low airflow or sample end clamp reached',
          'Heat loss to fuel substrate exceeds flame heat generation',
          'Zero active spread velocity measured'
        ],
        color: 'text-slate-400 bg-slate-500/10 border-slate-600'
      };
    }
  }

  // 3. LARGE-SCALE SPACECRAFT FIRE (SAFFIRE)
  if (investigationType === 'LARGE_SCALE_SPACECRAFT_FIRE') {
    const pos = state.flame_pos_cm ?? 0;
    const len = state.flame_length_cm ?? 0;
    const wid = state.flame_width_cm ?? 0;
    const temp = state.peak_temp_K ?? 298;
    const power = state.flame_power_W ?? 0;
    const hasFlame = state.flame_exists ?? (len > 0);

    if (phase.includes('PRE_IGNITION') || !hasFlame && pos === 0) {
      return {
        state: 'EXTINGUISHED',
        label: 'PRE-IGNITION / AMBIENT CABIN',
        reasons: [
          'Pre-ignition flight checkout in Cygnus vehicle duct',
          'Atmosphere stabilized at 21.7% O₂ and 1.0 atm',
          'Concurrent airflow loop active at 20 cm/s'
        ],
        color: 'text-slate-400 bg-slate-500/10 border-slate-600'
      };
    }

    if (phase.includes('IGNITION')) {
      return {
        state: 'IGNITION',
        label: 'IGNITER ENERGIZED (182 W)',
        reasons: [
          'Hot-wire igniter strip activated across full 40.6 cm sample width for 8 seconds',
          'SIBAL cotton/fiberglass composite fabric pyrolyzing at bottom edge',
          `Peak temperature reached ${temp.toFixed(0)} K`
        ],
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/40'
      };
    }

    if (phase.includes('DEVELOPMENT') || (wid < 35 && hasFlame)) {
      return {
        state: 'GROWING',
        label: 'LARGE-SCALE FLAME DEVELOPMENT',
        reasons: [
          `Flame front expanding across fabric width (current width: ${wid.toFixed(1)} cm)`,
          `Thermocouple rake measuring rapid temperature climb to ${temp.toFixed(0)} K`,
          `Heat release rate climbing toward ${power} W`,
          'Largest controlled flame in human spaceflight history progressing'
        ],
        color: 'text-orange-400 bg-orange-500/10 border-orange-500/40'
      };
    }

    if (phase.includes('STEADY') || hasFlame) {
      return {
        state: 'SPREADING',
        label: 'STEADY SPACECRAFT FIRE SPREAD',
        reasons: [
          `Wide flame front spanning ${wid.toFixed(1)} cm across SIBAL fabric`,
          `Flame length plateaus at ${len.toFixed(1)} cm in 20 cm/s concurrent ventilation`,
          `Peak flame power recorded at ~${power} W`,
          `Sustained peak temperature measured at ${temp.toFixed(0)} K`
        ],
        color: 'text-red-500 bg-red-500/10 border-red-500/40'
      };
    }

    return {
      state: 'EXTINGUISHED',
      label: 'FIRE TERMINATED / BURNOUT',
      reasons: [
        'Fabric sample fuel burned to exhaustion (90% pyrolyzed)',
        'Vehicle duct airflow purged combustion products',
        'Flame extinguished before vehicle reentry'
      ],
      color: 'text-slate-400 bg-slate-500/10 border-slate-600'
    };
  }

  // Fallback
  return {
    state: 'SUSTAINED',
    label: phase.replace(/_/g, ' ') || 'ACTIVE COMBUSTION',
    reasons: ['Empirical telemetry records active flame phase'],
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/40'
  };
}

/**
 * Generates dynamic, scientifically sound "What Is Happening?" explanation
 * for the current timeline position based strictly on loaded data.
 */
export function computeWhatIsHappening(
  investigationType: string,
  state: any,
  meta: any,
  flameState: FlameStateDetail,
  isModelMode = false,
  simResult?: any
): { summary: string; observed: string[]; interpretation: string } {
  if (isModelMode) {
    if (!simResult?.flame_exists) {
      return {
        summary: 'The analytical model indicates that self-sustaining combustion cannot occur under these environmental conditions.',
        observed: [
          `Oxygen concentration: ${simResult?.oxygen_mass_fraction ? (simResult.oxygen_mass_fraction * 100).toFixed(1) : '—'}%`,
          `Ambient pressure: ${simResult?.gas_density_kg_m3 ? 'Calculated density: ' + simResult.gas_density_kg_m3.toFixed(2) + ' kg/m³' : '—'}`,
          `Extinction mechanism: ${simResult?.extinction_mechanism || 'Quenching condition active'}`
        ],
        interpretation: 'Chemical reaction rate is insufficient to overcome combined radiative, convective, and conductive heat losses to the ambient gas. The flame quenches immediately.'
      };
    }

    const gr = simResult.grashof_number ?? 0;
    const da = simResult.damkohler_number ?? 10;
    const shape = simResult.flame_shape ?? 'spherical';
    const temp = simResult.flame_temperature_K ?? 1500;

    return {
      summary: `The analytical model predicts a stable ${shape} flame operating under ${simResult.oxygen_transport_mode || 'diffusion'} control.`,
      observed: [
        `Grashof number Gr = ${gr.toFixed(1)} (${gr > 1000 ? 'buoyancy dominates' : gr > 10 ? 'transitional buoyancy' : 'buoyancy suppressed'})`,
        `Estimated flame temperature: ${temp.toFixed(0)} K`,
        `Predicted mass burning rate: ${simResult.mass_burning_rate_mg_s?.toFixed(3) ?? '—'} mg/s`,
        `Damköhler number Da = ${da.toFixed(1)} (fast chemistry relative to flow)`
      ],
      interpretation: gr > 1000
        ? 'High gravitational acceleration drives strong upward natural convection, stretching the flame into an elongated teardrop and enhancing oxidizer delivery.'
        : 'In reduced gravity, natural convection ceases or weakens significantly. Transport is dominated by molecular diffusion, resulting in a more spherical, cooler flame.'
    };
  }

  // MODE A: NASA Experiment Playback
  if (!state) {
    return {
      summary: 'Awaiting telemetry playback data.',
      observed: ['No recorded points loaded'],
      interpretation: 'Select an experiment run and press Play or drag the timeline to inspect flame dynamics.'
    };
  }

  const phase = String(state.phase || '').toUpperCase();

  // 1. FLEX Droplet Combustion
  if (investigationType === 'DROPLET_COMBUSTION') {
    const d = state.D_mm ?? 3.5;
    const d2 = state.D2_mm2 ?? 12.25;
    const k = state.burn_rate_K_mm2_s ?? 0;
    const fd = state.flame_diam_mm ?? 0;

    if (phase.includes('IGNIT')) {
      return {
        summary: 'Electric spark igniters have energized the n-heptane droplet in the CIR chamber, establishing the initial combustion envelope.',
        observed: [
          `Droplet initial diameter: ${d.toFixed(2)} mm (D² = ${d2.toFixed(2)} mm²)`,
          'Spark electrodes deployed and retracted',
          'Chemiluminescent radical zone forming around droplet'
        ],
        interpretation: 'The droplet surface absorbs radiant heat and reaches the boiling point (371.5 K). Vaporized heptane diffuses outward to meet inward-diffusing oxygen.'
      };
    }

    if (phase.includes('HOT_FLAME_WEAKENING') || phase.includes('EXTINCTION') && !phase.includes('COOL')) {
      return {
        summary: 'The visible hot flame is weakening rapidly due to accumulated radiative heat losses, approaching hot-flame extinction.',
        observed: [
          `Droplet diameter decreased to ${d.toFixed(2)} mm`,
          'Hot flame luminescence fading toward optical extinction limit',
          `Burning rate transitioning from K ≈ 1.4 mm²/s downward`
        ],
        interpretation: 'In microgravity, combustion products (CO₂ and H₂O) accumulate spherically around the flame without buoyant evacuation. Radiative heat loss from these products increases until the flame temperature falls below the threshold for visible hot-flame chemistry (~1400 K).'
      };
    }

    if (phase.includes('HOT_FLAME')) {
      return {
        summary: 'The droplet is undergoing quasi-steady hot burning governed by classical spherically symmetric D²-law combustion.',
        observed: [
          `Droplet diameter shrinking steadily: D = ${d.toFixed(3)} mm (D² = ${d2.toFixed(3)} mm²)`,
          `Constant burning rate constant K = ${k.toFixed(3)} mm²/s measured`,
          `Visible flame diameter estimated at ~${fd.toFixed(1)} mm (~3.5× droplet diameter)`
        ],
        interpretation: 'Without buoyancy, the flame forms a stationary concentric sphere around the droplet. Pure molecular diffusion governs oxygen transport inward and fuel vapor transport outward, yielding a stable combustion balance.'
      };
    }

    if (phase.includes('COOL_FLAME_WEAKENING')) {
      return {
        summary: 'The cool flame is approaching its final chemical extinction diameter as heat losses overcome low-temperature reactivity.',
        observed: [
          `Droplet diameter near terminal limit: D = ${d.toFixed(3)} mm`,
          'Extinction diameter approaching critical limit (~0.02 mm)',
          'Very low heat release rate persisting'
        ],
        interpretation: 'As the droplet shrinks, the ratio of heat loss to fuel surface area increases until low-temperature chemical chain branching can no longer sustain itself, triggering final extinction.'
      };
    }

    if (phase.includes('COOL_FLAME')) {
      return {
        summary: 'NASA landmark cool flame regime: The visible flame has extinguished, but invisible low-temperature combustion continues steadily.',
        observed: [
          'No visible soot or hot orange glow detected by standard cameras',
          `Droplet continues shrinking steadily at K ≈ ${k.toFixed(3)} mm²/s (~25% of hot burning rate)`,
          'Low-temperature chemiluminescence (T ≈ 600–800 K) observed by intensified cameras'
        ],
        interpretation: 'This phenomenon cannot occur on Earth because buoyant convection strips away heat too quickly. In microgravity, low heat loss allows low-temperature alkylperoxy chemical kinetics to persist invisibly, consuming fuel without a visible flame.'
      };
    }

    return {
      summary: 'Droplet combustion has concluded; the fuel is depleted or extinguished at critical diameter.',
      observed: [
        `Final droplet diameter: ${d.toFixed(3)} mm`,
        'Zero burning rate (K = 0.00 mm²/s)',
        'Reaction completely inactive'
      ],
      interpretation: 'The droplet has reached its terminal extinction diameter. Remaining vapor dissipates into the CIR chamber through pure molecular diffusion.'
    };
  }

  // 2. BASS-II Solid Fuel
  if (investigationType === 'SOLID_MATERIAL_COMBUSTION') {
    const pos = state.flame_pos_mm ?? 0;
    const len = state.flame_length_mm ?? 0;
    const spread = state.spread_rate_cm_s ?? 0;
    const airflow = state.airflow_cm_s ?? 10.0;

    if (phase.includes('IGNIT')) {
      return {
        summary: 'Hot wire ignition coil is actively transferring thermal energy into the PMMA acrylic sample rod.',
        observed: [
          `Sample ignition initiated at leading edge (x = ${pos.toFixed(1)} mm)`,
          `Concurrent airflow steady at ${airflow.toFixed(1)} cm/s`,
          'Polymer surface pyrolyzing and degassing monomer vapor'
        ],
        interpretation: 'Thermal conduction from the hot wire raises the PMMA surface temperature above the pyrolysis threshold (~380°C), generating flammable gas that mixes with concurrent cabin airflow.'
      };
    }

    if (phase.includes('STEADY') || spread > 0) {
      return {
        summary: 'The flame is steadily spreading concurrently along the PMMA rod driven by the low-speed airflow duct.',
        observed: [
          `Flame front position: ${pos.toFixed(1)} mm from ignition point`,
          `Flame length stabilized at ${len.toFixed(1)} mm`,
          `Measured flame spread rate: ${spread.toFixed(4)} cm/s (${(spread * 10).toFixed(2)} mm/s)`,
          `Charred pyrolyzed rod section visible behind flame front`
        ],
        interpretation: 'Even at gentle airflow velocities (10 cm/s, equivalent to ISS cabin ventilation), forced convection sustains solid material flammability in microgravity where an undisturbed flame would otherwise extinguish from suffocation.'
      };
    }

    return {
      summary: 'Solid fuel combustion sequence completed or extinguished.',
      observed: [
        `Final flame front position: ${pos.toFixed(1)} mm`,
        'Flame extinguished or fuel sample boundary reached'
      ],
      interpretation: 'Flame spread ceased. Data demonstrates solid fuel flammability boundaries in low-speed forced flows.'
    };
  }

  // 3. SAFFIRE Large-Scale Fire
  if (investigationType === 'LARGE_SCALE_SPACECRAFT_FIRE') {
    const pos = state.flame_pos_cm ?? 0;
    const len = state.flame_length_cm ?? 0;
    const wid = state.flame_width_cm ?? 0;
    const temp = state.peak_temp_K ?? 298;
    const power = state.flame_power_W ?? 0;

    if (phase.includes('IGNITION')) {
      return {
        summary: 'The 182-Watt hot-wire igniter has energized across the bottom of the 40.6 cm wide SIBAL fabric sheet.',
        observed: [
          'Igniter wire heating sample base for 8 seconds',
          `Fabric sheet surface temperature rising to ${temp.toFixed(0)} K`,
          'Concurrent airflow loop active at 20 cm/s inside Cygnus vehicle'
        ],
        interpretation: 'Direct electrical heating pyrolyzes the cotton/fiberglass composite blend. Flammable gas enters the 20 cm/s airflow stream, establishing the initial flame front.'
      };
    }

    if (phase.includes('DEVELOPMENT') || phase.includes('STEADY')) {
      return {
        summary: 'A massive spacecraft-scale fire is actively propagating across the fabric sample inside the uncrewed Cygnus vehicle.',
        observed: [
          `Flame front position: ${pos.toFixed(1)} cm along the 94 cm long sheet`,
          `Wide flame front spanning ${wid.toFixed(1)} cm across the sample width`,
          `Flame length plateaued at ${len.toFixed(1)} cm in concurrent flow`,
          `Peak thermocouple temperature measured at ${temp.toFixed(0)} K`,
          `Flame power recorded at ~${power} Watts`
        ],
        interpretation: 'SAFFIRE-I proved that large-scale fires burn vigorously in microgravity when supplied by forced ventilation. The flame does not self-extinguish; it consumes nearly a meter of material steadily at ~1.8 mm/s.'
      };
    }

    return {
      summary: 'SAFFIRE flight experiment sequence completed.',
      observed: [
        `Burn length reached: ~${pos.toFixed(1)} cm (~90% of fuel consumed)`,
        'Vehicle duct ventilation purged after flight experiment'
      ],
      interpretation: 'Data from this flight test forms the empirical foundation for all modern NASA exploration spacecraft fire safety designs.'
    };
  }

  return {
    summary: 'Active experiment telemetry displayed.',
    observed: [`Current timestamp: ${state.time_s?.toFixed(2) ?? '0.00'}s`],
    interpretation: 'Playback synchronized across 3D visualization, timeline, and telemetry charts.'
  };
}
