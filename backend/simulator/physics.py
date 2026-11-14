"""
Reduced-Order Microgravity Combustion Physics Engine.

SCIENTIFIC DISCLAIMER:
This module implements a simplified analytical model for educational purposes.
It is NOT a CFD simulation and does NOT claim to reproduce NASA experimental
results exactly. The relationships used are based on classical combustion theory
references (Turns, "An Introduction to Combustion"; Law, "Combustion Physics")
adapted with empirical corrections for reduced-gravity conditions.

KEY EQUATIONS AND ASSUMPTIONS:
1. Grashof number: Gr = g * β * ΔT * L³ / ν²
   - Characterizes buoyancy vs. viscous forces
   - β ≈ 1/T_mean for ideal gas assumption

2. Natural convection velocity: v_nc ~ sqrt(g * β * ΔT * L)
   - Derived from scaling of buoyancy-driven momentum

3. Flame temperature: T_flame = T_ad * η_loss * f(O2, P)
   - T_ad: adiabatic flame temperature for given fuel
   - η_loss: heat loss factor (radiation + conduction), typically 0.5-0.8
   - f(O2, P): oxygen and pressure correction

4. Flame geometry: 
   - High Gr (>1000): elongated/teardrop (buoyancy-dominated)
   - Low Gr (<10): nearly spherical (diffusion-dominated)
   - Intermediate: transitional ellipsoid

5. Burning rate: m_dot ~ D * ρ * Y_O2 * L_flame
   - Simplified diffusion-controlled burning rate

6. Damköhler number: Da = τ_flow / τ_chem
   - Ratio of flow to chemical time scales
   - Da >> 1: chemistry-fast, diffusion-controlled
   - Da << 1: chemistry-slow, extinction likely

LIMITATIONS:
- Assumes single-step global reaction mechanism
- No soot formation model
- No radiation reabsorption
- No transient flame dynamics (steady-state only)
- No turbulence model
- Temperature field is approximate (not solved from energy equation)
- Flame dimensions are scaling estimates, not precise predictions
"""

import math
from typing import Dict, List, Tuple, Any


# Physical constants
R_UNIVERSAL = 8.314  # J/(mol·K)
STEFAN_BOLTZMANN = 5.67e-8  # W/(m²·K⁴)
AIR_MOLECULAR_WEIGHT = 28.97e-3  # kg/mol
O2_MOLECULAR_WEIGHT = 32.0e-3  # kg/mol
GRAVITY_EARTH = 9.81  # m/s²

# Reference gas properties at STP
AIR_DENSITY_STP = 1.225  # kg/m³
AIR_VISCOSITY_STP = 1.81e-5  # Pa·s (dynamic)
AIR_THERMAL_DIFFUSIVITY_STP = 2.2e-5  # m²/s
O2_DIFFUSIVITY_IN_N2_STP = 2.08e-5  # m²/s


def compute_gas_properties(temperature_K: float, pressure_kPa: float, oxygen_pct: float) -> Dict[str, float]:
    """
    Compute gas mixture properties adjusted for temperature and pressure.
    Uses ideal gas relations with temperature-dependent viscosity (Sutherland's law).
    
    Assumptions:
    - Ideal gas behavior (valid for T > 200K, P < 5 atm)
    - Binary mixture of O2 and N2 (simplified)
    - Sutherland's law for viscosity: μ/μ_ref = (T/T_ref)^(3/2) * (T_ref + S)/(T + S)
    """
    T_ref = 273.15  # K
    S_air = 110.4  # K (Sutherland constant for air)
    P_ratio = pressure_kPa / 101.325
    T_ratio = temperature_K / T_ref
    
    # Density via ideal gas law
    density = AIR_DENSITY_STP * P_ratio / T_ratio
    
    # Viscosity via Sutherland's law
    viscosity = AIR_VISCOSITY_STP * (T_ratio ** 1.5) * (T_ref + S_air) / (temperature_K + S_air)
    
    # Kinematic viscosity
    kinematic_viscosity = viscosity / max(density, 1e-6)
    
    # Thermal diffusivity scales with T^1.5 / P
    thermal_diffusivity = AIR_THERMAL_DIFFUSIVITY_STP * (T_ratio ** 1.5) / P_ratio
    
    # Mass diffusivity of O2 (Chapman-Enskog scaling: D ~ T^1.75 / P)
    mass_diffusivity_O2 = O2_DIFFUSIVITY_IN_N2_STP * (T_ratio ** 1.75) / P_ratio
    
    # Oxygen mass fraction
    Y_O2 = oxygen_pct / 100.0 * (O2_MOLECULAR_WEIGHT / AIR_MOLECULAR_WEIGHT)
    
    # Thermal expansion coefficient (ideal gas)
    beta = 1.0 / temperature_K
    
    return {
        "density_kg_m3": density,
        "viscosity_Pa_s": viscosity,
        "kinematic_viscosity_m2_s": kinematic_viscosity,
        "thermal_diffusivity_m2_s": thermal_diffusivity,
        "mass_diffusivity_O2_m2_s": mass_diffusivity_O2,
        "Y_O2": Y_O2,
        "beta_1_K": beta,
    }


def compute_grashof_number(
    gravity_m_s2: float,
    beta: float,
    delta_T: float,
    length_scale: float,
    kinematic_viscosity: float
) -> float:
    """
    Grashof number: Gr = g * β * ΔT * L³ / ν²
    
    Characterizes the ratio of buoyancy to viscous forces.
    - Gr > 10^4: strong buoyancy (Earth-like flame behavior)
    - Gr < 10: negligible buoyancy (microgravity-like)
    
    Reference: Turns, "An Introduction to Combustion", Ch. 9
    """
    if kinematic_viscosity < 1e-10:
        return 0.0
    return abs(gravity_m_s2) * beta * abs(delta_T) * (length_scale ** 3) / (kinematic_viscosity ** 2)


def compute_reynolds_number(
    velocity_m_s: float,
    length_scale: float,
    kinematic_viscosity: float
) -> float:
    """
    Reynolds number: Re = V * L / ν
    Ratio of inertial to viscous forces for forced flow.
    """
    if kinematic_viscosity < 1e-10:
        return 0.0
    return abs(velocity_m_s) * length_scale / kinematic_viscosity


def compute_natural_convection_velocity(
    gravity_m_s2: float,
    beta: float,
    delta_T: float,
    length_scale: float
) -> float:
    """
    Scaling estimate for natural convection velocity:
    v_nc ~ sqrt(g * β * ΔT * L)
    
    This is a characteristic velocity from buoyancy scaling,
    not a spatially-resolved flow field.
    
    Returns velocity in m/s.
    """
    product = abs(gravity_m_s2) * beta * abs(delta_T) * length_scale
    if product < 0:
        return 0.0
    return math.sqrt(product)


def compute_adiabatic_flame_temperature(
    T_ad_stoich: float,
    oxygen_pct: float,
    pressure_kPa: float,
    initial_temp_K: float
) -> float:
    """
    Estimate adiabatic flame temperature with corrections.
    
    T_flame = T_ad,stoich * f_O2 * f_P + (T_initial - 298.15)
    
    f_O2: Oxygen correction factor.
      - At stoichiometric O2 (for air, ~21%), f_O2 = 1.0
      - Lean mixtures: lower T_ad roughly linearly
      - Rich O2: modest increase (diminishing returns above ~40%)
    
    f_P: Pressure correction.
      - Near-atmospheric: f_P ≈ 1.0
      - At low pressures, dissociation increases, reducing T_ad slightly
    
    Assumptions:
    - Single-step global mechanism
    - No dissociation model (simplified)
    - Linear O2 correction is approximate for educational use
    """
    # Oxygen correction: normalized to 21% as baseline
    if oxygen_pct <= 0:
        return initial_temp_K
    
    f_O2 = min(1.15, 0.3 + 0.7 * (oxygen_pct / 21.0))
    if oxygen_pct > 21.0:
        # Diminishing returns above stoichiometric air
        excess = (oxygen_pct - 21.0) / 79.0
        f_O2 = 1.0 + 0.15 * excess
        f_O2 = min(f_O2, 1.2)
    
    # Pressure correction: mild effect
    P_atm = pressure_kPa / 101.325
    f_P = 1.0 + 0.02 * math.log(max(P_atm, 0.1))
    f_P = max(0.85, min(f_P, 1.05))
    
    T_ad = T_ad_stoich * f_O2 * f_P + (initial_temp_K - 298.15)
    return max(initial_temp_K, T_ad)


def compute_heat_loss_factor(
    gravity_m_s2: float,
    flame_temp_K: float,
    ambient_temp_K: float,
    flame_size_m: float
) -> float:
    """
    Estimate heat loss factor η accounting for radiation and conduction.
    
    In microgravity:
    - No buoyant convective cooling
    - Radiation loss increases (flame is more spherical, larger surface area relative to volume)
    - Conduction to fuel surface is primary heat feedback
    
    In Earth gravity:
    - Buoyant convection efficiently removes heat
    - Flame is smaller, more compact
    
    η ranges from ~0.4 (high loss) to ~0.85 (well-insulated).
    
    This is an empirical correlation, not a first-principles calculation.
    """
    # Radiation loss estimate: P_rad ~ σ * ε * A * T⁴
    # Relative to total heat release
    epsilon_flame = 0.15  # typical soot-free flame emissivity
    A_flame = 4 * math.pi * (flame_size_m / 2) ** 2 if flame_size_m > 0 else 0.001
    Q_rad = STEFAN_BOLTZMANN * epsilon_flame * A_flame * (flame_temp_K ** 4 - ambient_temp_K ** 4)
    
    # Base heat loss fraction
    g_ratio = gravity_m_s2 / GRAVITY_EARTH if GRAVITY_EARTH > 0 else 0
    
    # In microgravity: less convective loss but more radiation (hotter, slower-dissipating flame)
    # On Earth: strong convective loss
    convective_loss = 0.15 * math.sqrt(g_ratio) if g_ratio > 0 else 0.0
    radiative_loss = 0.1 + 0.1 * (1.0 - min(g_ratio, 1.0))  # higher in 0-g
    
    total_loss = convective_loss + radiative_loss
    eta = max(0.35, min(0.85, 1.0 - total_loss))
    
    return eta


def compute_flame_geometry(
    grashof: float,
    reynolds: float,
    gravity_m_s2: float,
    oxygen_pct: float,
    fuel_properties: dict,
    effective_velocity_m_s: float,
    gas_props: dict
) -> Dict[str, float]:
    """
    Estimate flame shape and dimensions from dimensionless analysis.
    
    Flame shape regimes:
    1. Gr >> Re²: Buoyancy-dominated → elongated teardrop
    2. Gr << Re²: Forced-flow dominated → stretched/elongated
    3. Gr ~ 0, Re ~ 0: Pure diffusion → spherical
    4. Gr ~ 0, Re > 0: Forced flow in microgravity → slightly elongated sphere
    
    Flame size scaling (diffusion flame):
    L_flame ~ (m_dot * Y_fuel / (ρ * D))^(1/3) for spherical
    L_flame ~ m_dot / (ρ * D * v) for elongated
    
    These are ORDER-OF-MAGNITUDE estimates for visualization guidance.
    They should NOT be interpreted as quantitative predictions.
    """
    # Base flame size from fuel properties and oxygen
    # Reference size: ~10mm diameter for a small lab burner flame
    base_size_mm = 12.0
    
    # Oxygen effect: more O2 → slightly smaller, hotter flame (faster combustion)
    O2_factor = math.sqrt(21.0 / max(oxygen_pct, 1.0))
    
    # Gravity effect on flame size
    g_ratio = gravity_m_s2 / GRAVITY_EARTH if GRAVITY_EARTH > 0 else 0
    
    if g_ratio < 0.01:
        # Microgravity: flame is larger and more spherical
        # In 0-g, flames can be 2-3x larger diameter than in 1-g
        size_factor = 2.0
        aspect_ratio = 1.05  # nearly spherical
        shape = "spherical"
    elif g_ratio < 0.25:
        # Weak gravity (Moon-like): slightly elongated
        size_factor = 1.6 - 0.4 * g_ratio / 0.25
        aspect_ratio = 1.2 + 0.5 * g_ratio / 0.25
        shape = "near-spherical"
    elif g_ratio < 0.5:
        # Moderate gravity (Mars-like): moderately elongated
        size_factor = 1.4 - 0.4 * (g_ratio - 0.25) / 0.25
        aspect_ratio = 1.7 + 0.8 * (g_ratio - 0.25) / 0.25
        shape = "ellipsoidal"
    else:
        # Strong gravity (Earth-like): elongated teardrop
        size_factor = 1.0
        aspect_ratio = 2.5 + 1.5 * min(g_ratio, 1.0)
        shape = "teardrop"
    
    # Airflow effect: increases flame length
    v_cm_s = effective_velocity_m_s * 100
    if v_cm_s > 5:
        flow_stretch = 1.0 + 0.05 * v_cm_s
        aspect_ratio *= flow_stretch
        if g_ratio < 0.01 and v_cm_s > 10:
            shape = "elongated-sphere"
    
    # Pressure effect: higher pressure → slightly smaller, more intense flame
    # Lower pressure → larger, more diffuse
    P_atm = gas_props.get("density_kg_m3", AIR_DENSITY_STP) / AIR_DENSITY_STP
    pressure_factor = 1.0 / max(math.sqrt(P_atm), 0.5)
    
    diameter_mm = base_size_mm * size_factor * O2_factor * pressure_factor
    diameter_mm = max(2.0, min(diameter_mm, 80.0))  # clamp to reasonable range
    
    height_mm = diameter_mm * aspect_ratio
    width_mm = diameter_mm
    
    return {
        "shape": shape,
        "diameter_mm": round(diameter_mm, 1),
        "height_mm": round(height_mm, 1),
        "width_mm": round(width_mm, 1),
        "aspect_ratio": round(aspect_ratio, 2),
    }


def compute_burning_rate(
    fuel_properties: dict,
    oxygen_pct: float,
    gas_props: dict,
    flame_size_m: float,
    effective_velocity_m_s: float,
    gravity_m_s2: float
) -> Dict[str, float]:
    """
    Estimate mass burning rate and heat release rate.
    
    For diffusion flames:
    m_dot ≈ 4π * ρ * D_O2 * r_flame * ln(1 + B)
    where B is the transfer number (Spalding number).
    
    B = Y_O2_∞ * ΔH_c / (s * c_p * (T_flame - T_s))
    
    This is highly simplified. Real burning rates depend on:
    - Detailed flame structure
    - Surface regression (for solids)
    - Droplet evaporation (for liquids)
    - Gas-phase kinetics
    
    Uncertainty: ±50% or more for this reduced-order estimate.
    """
    D_O2 = gas_props["mass_diffusivity_O2_m2_s"]
    rho = gas_props["density_kg_m3"]
    Y_O2 = gas_props["Y_O2"]
    
    # Transfer number (simplified)
    delta_H = fuel_properties["heat_of_combustion_kJ_per_g"] * 1000  # J/g
    s = fuel_properties["stoich_air_fuel_ratio"]
    c_p = 1005  # J/(kg·K) for air (approximate)
    T_flame = fuel_properties["adiabatic_flame_temp_K"]
    T_surface = fuel_properties.get("ignition_temp_K", 500)
    
    B_numerator = Y_O2 * delta_H
    B_denominator = s * c_p * max(T_flame - T_surface, 100)
    B = max(0.01, B_numerator / B_denominator)
    
    # Mass burning rate for spherical diffusion flame
    r_flame = flame_size_m / 2
    m_dot = 4 * math.pi * rho * D_O2 * r_flame * math.log(1 + B)
    
    # Gravity correction: in 1-g, buoyant convection enhances burning rate
    g_ratio = gravity_m_s2 / GRAVITY_EARTH if GRAVITY_EARTH > 0 else 0
    convection_enhancement = 1.0 + 0.3 * math.sqrt(g_ratio)
    
    # Forced flow enhancement
    if effective_velocity_m_s > 0.01:
        flow_enhancement = 1.0 + 0.1 * math.sqrt(effective_velocity_m_s * 100)
    else:
        flow_enhancement = 1.0
    
    m_dot *= convection_enhancement * flow_enhancement
    m_dot_mg_s = m_dot * 1e6  # convert to mg/s
    
    # Heat release rate
    Q_dot = m_dot * fuel_properties["heat_of_combustion_kJ_per_g"] * 1000  # W (J/s)
    
    return {
        "mass_burning_rate_mg_s": round(max(0.001, m_dot_mg_s), 3),
        "heat_release_rate_W": round(max(0.001, Q_dot), 3),
        "transfer_number_B": round(B, 3),
    }


def compute_damkohler_number(
    flow_time_s: float,
    chemical_time_s: float
) -> float:
    """
    Damköhler number: Da = τ_flow / τ_chem
    
    Da >> 1: chemistry is fast relative to transport → stable flame
    Da ~ 1: marginal → potential oscillation or partial extinction
    Da << 1: transport overwhelms chemistry → flame extinction
    
    Chemical time is estimated from activation energy and temperature.
    Flow time is L/V for the characteristic flame length and velocity.
    """
    if chemical_time_s < 1e-10:
        return 1e6  # effectively infinite Da
    return flow_time_s / chemical_time_s


def estimate_chemical_timescale(
    flame_temp_K: float,
    pressure_kPa: float,
    fuel_properties: dict
) -> float:
    """
    Estimate chemical reaction timescale using Arrhenius-type scaling.
    
    τ_chem ~ (1/A) * exp(E_a / R / T)
    
    We use representative values:
    - A ~ 10^8 s^-1 (pre-exponential, order of magnitude)
    - E_a ~ 120-200 kJ/mol depending on fuel
    
    This is a GROSS simplification. Real kinetics involve hundreds of reactions.
    """
    # Representative activation energies by fuel type
    E_a = {
        "pmma": 160e3,
        "cellulose": 150e3,
        "heptane": 125e3,
        "methane": 200e3,
    }
    fuel_key = fuel_properties.get("phase", "solid")
    if "PMMA" in fuel_properties.get("name", ""):
        E_a_val = E_a["pmma"]
    elif "Cellulose" in fuel_properties.get("name", ""):
        E_a_val = E_a["cellulose"]
    elif "Heptane" in fuel_properties.get("name", ""):
        E_a_val = E_a["heptane"]
    else:
        E_a_val = E_a["methane"]
    
    A_pre = 1e8  # s^-1
    P_factor = (pressure_kPa / 101.325) ** 1.5  # pressure dependence
    
    tau_chem = (1.0 / (A_pre * P_factor)) * math.exp(E_a_val / (R_UNIVERSAL * max(flame_temp_K, 300)))
    return max(1e-6, tau_chem)


def estimate_extinction_risk(
    damkohler: float,
    oxygen_pct: float,
    fuel_min_oxygen: float,
    flame_temp_K: float,
    fuel_ignition_temp_K: float
) -> Tuple[str, str]:
    """
    Assess extinction risk and mechanism.
    
    Extinction can occur from:
    1. Insufficient oxygen (below LOI)
    2. Excessive heat loss (radiative quenching) — important in 0-g
    3. Blow-off (excessive flow velocity)
    4. Chemical quenching (Da << 1)
    """
    mechanisms = []
    
    if oxygen_pct < fuel_min_oxygen:
        return "certain", f"Oxygen ({oxygen_pct}%) below minimum ({fuel_min_oxygen}%) for this fuel"
    
    if oxygen_pct < fuel_min_oxygen * 1.2:
        mechanisms.append("near-limit oxygen concentration")
    
    if damkohler < 0.5:
        mechanisms.append("flow-induced chemical quenching (Da < 0.5)")
    elif damkohler < 2.0:
        mechanisms.append("marginal Damköhler number")
    
    if flame_temp_K < fuel_ignition_temp_K * 1.5:
        mechanisms.append("insufficient flame temperature for sustained combustion")
    
    if len(mechanisms) >= 2:
        risk = "high"
    elif len(mechanisms) == 1:
        risk = "moderate"
    else:
        risk = "low"
    
    mechanism_str = "; ".join(mechanisms) if mechanisms else "Stable combustion expected within model validity range"
    return risk, mechanism_str


def compute_flame_color(
    flame_temp_K: float,
    oxygen_pct: float,
    fuel_properties: dict,
    gravity_m_s2: float
) -> str:
    """
    Estimate visible flame color indicator based on temperature and chemistry.
    
    This is qualitative and for visualization guidance only.
    
    General trends:
    - Blue: high temperature, lean/clean combustion (>1800K, high O2)
    - Yellow/Orange: soot incandescence (>1200K, lower O2 or rich)
    - Red: lower temperature or marginally burning
    - Invisible/dim blue: cool flames (~600-800K) — key microgravity finding
    
    In microgravity, flames tend to be bluer due to more complete combustion
    (spherical diffusion allows uniform O2 access) and reduced soot.
    """
    g_ratio = gravity_m_s2 / GRAVITY_EARTH if GRAVITY_EARTH > 0 else 0
    
    if flame_temp_K < 800:
        return "dim-blue (cool flame regime)"
    elif flame_temp_K < 1200:
        if g_ratio < 0.1:
            return "faint-blue"
        else:
            return "dull-red"
    elif flame_temp_K < 1600:
        if g_ratio < 0.1:
            return "blue"
        else:
            return "orange-red"
    elif flame_temp_K < 2000:
        if g_ratio < 0.1:
            return "blue-core"
        elif oxygen_pct > 25:
            return "blue-core-yellow-mantle"
        else:
            return "yellow-orange with blue base"
    else:
        if g_ratio < 0.1:
            return "bright-blue"
        elif oxygen_pct > 30:
            return "intense-blue-white"
        else:
            return "blue-core-yellow-orange-mantle"


def compute_temperature_distribution(
    flame_temp_K: float,
    ambient_temp_K: float,
    flame_size_m: float,
    gravity_m_s2: float,
    heat_loss_factor: float
) -> Dict[str, float]:
    """
    Estimate temperature at key locations relative to flame.
    
    Simplified model:
    - Max flame temp: T_flame * η_loss
    - Near-field (1-2 flame radii): exponential decay
    - Far-field (5-10 flame radii): near-ambient
    - Chamber wall: slightly above ambient
    
    In microgravity, temperature gradients are shallower because
    diffusion (not convection) dominates heat transport.
    """
    T_max = flame_temp_K * heat_loss_factor
    
    g_ratio = gravity_m_s2 / GRAVITY_EARTH if GRAVITY_EARTH > 0 else 0
    
    # In 0-g, heat dissipates more slowly → higher near-field temperatures
    # In 1-g, buoyancy carries heat upward → strong plume, cooler near-field below
    dissipation_factor = 0.3 + 0.3 * math.sqrt(g_ratio)  # higher in 1-g
    
    T_near = T_max * (1 - dissipation_factor * 0.6) + ambient_temp_K * dissipation_factor * 0.6
    T_far = ambient_temp_K + (T_max - ambient_temp_K) * 0.05 * (1 - 0.5 * g_ratio)
    T_wall = ambient_temp_K + (T_max - ambient_temp_K) * 0.02
    
    return {
        "max_flame_temperature_K": round(T_max, 1),
        "near_field_temperature_K": round(max(T_near, ambient_temp_K), 1),
        "far_field_temperature_K": round(max(T_far, ambient_temp_K), 1),
        "chamber_wall_temperature_K": round(max(T_wall, ambient_temp_K), 1),
    }


def compute_stoichiometric_mixture_fraction(fuel_properties: dict) -> float:
    """
    Stoichiometric mixture fraction: Z_st = 1 / (1 + s * Y_F / Y_O2)
    For air (Y_O2 ≈ 0.233), s = stoich air/fuel ratio.
    """
    s = fuel_properties["stoich_air_fuel_ratio"]
    Y_O2_air = 0.233
    Z_st = 1.0 / (1.0 + s)
    return round(Z_st, 4)
