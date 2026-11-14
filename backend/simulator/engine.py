"""
Main simulation engine that orchestrates all physics calculations.

This module ties together the parameter models, physics computations,
and validation to produce a complete simulation result.
"""

import math
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any

from .models import (
    SimulationInput, SimulationOutput, FuelType, GravityEnvironment,
    FUEL_PROPERTIES, GRAVITY_VALUES, GRAVITY_LABELS,
    ScenarioRecord, ComparisonResult
)
from .physics import (
    compute_gas_properties,
    compute_grashof_number,
    compute_reynolds_number,
    compute_natural_convection_velocity,
    compute_adiabatic_flame_temperature,
    compute_heat_loss_factor,
    compute_flame_geometry,
    compute_burning_rate,
    compute_damkohler_number,
    estimate_chemical_timescale,
    estimate_extinction_risk,
    compute_flame_color,
    compute_temperature_distribution,
    compute_stoichiometric_mixture_fraction,
    GRAVITY_EARTH,
)


MODEL_VERSION = "1.0.0-reduced-order"

SUPPORTED_RANGES = {
    "gravity_m_s2": {"min": 0.0, "max": 15.0, "unit": "m/s²"},
    "oxygen_pct": {"min": 0.0, "max": 100.0, "unit": "%"},
    "airflow_velocity_cm_s": {"min": 0.0, "max": 100.0, "unit": "cm/s"},
    "pressure_kPa": {"min": 10.0, "max": 200.0, "unit": "kPa"},
    "initial_temperature_K": {"min": 200.0, "max": 500.0, "unit": "K"},
}

MODEL_ASSUMPTIONS = [
    "Single-step global reaction mechanism (no detailed chemistry)",
    "Steady-state flame (no transient ignition/extinction dynamics)",
    "Ideal gas behavior for all gas properties",
    "Binary gas mixture (O2 + N2) — trace species neglected",
    "Optically thin flame (no radiation reabsorption)",
    "No soot formation or transport model",
    "No turbulence model (laminar flame assumption)",
    "Flame geometry from dimensionless scaling correlations",
    "Temperature field from algebraic correlations, not energy equation",
    "Burning rate from simplified Spalding B-number analysis",
]

MODEL_LIMITATIONS = [
    "This is a reduced-order educational model, not a CFD simulation",
    "Flame dimensions are order-of-magnitude scaling estimates",
    "Temperature values carry ±30% uncertainty or more",
    "Burning rates are approximate and not validated against specific NASA measurements",
    "Extinction predictions are qualitative indicators only",
    "The model does not account for fuel geometry, sample size, or regression",
    "Cool flame (low-temperature) combustion is flagged but not modeled kinetically",
    "Results should not be used for spacecraft design decisions",
]


# In-memory scenario storage
_scenario_history: List[ScenarioRecord] = []


def validate_inputs(params: SimulationInput) -> List[str]:
    """Validate input parameters and return any warnings."""
    warnings = []
    fuel = FUEL_PROPERTIES[params.fuel_type]
    
    if params.oxygen_pct < fuel["min_oxygen_pct"]:
        warnings.append(
            f"Oxygen concentration ({params.oxygen_pct}%) is below the minimum "
            f"({fuel['min_oxygen_pct']}%) for {fuel['name']}. "
            f"Combustion is unlikely. Results represent a non-burning state."
        )
    
    if params.oxygen_pct > 50:
        warnings.append(
            "Oxygen concentration above 50% — fire behavior becomes extremely aggressive. "
            "Material flammability limits may be dramatically different from standard conditions."
        )
    
    if params.pressure_kPa < 30:
        warnings.append(
            "Very low pressure may cause flame instability and non-standard combustion behavior. "
            "Model accuracy is reduced below ~30 kPa."
        )
    
    if params.airflow_velocity_cm_s > 50:
        warnings.append(
            "High airflow velocity (>50 cm/s) may cause blow-off extinction. "
            "This regime is at the edge of model validity."
        )
    
    if params.initial_temperature_K > 400:
        warnings.append(
            "High initial temperature may pre-heat the fuel, altering ignition characteristics. "
            "SoFIE-GEL experiments showed pre-heated materials burn at lower O2 limits."
        )
    
    # Exploration atmosphere warning
    if params.oxygen_pct > 30 and params.pressure_kPa < 70:
        warnings.append(
            "This combination resembles NASA's Exploration Atmosphere (34% O2, 56.5 kPa). "
            "SAFFIRE-IV/V/VI and SoFIE experiments studied fire behavior in this environment."
        )
    
    return warnings


def run_simulation(params: SimulationInput) -> SimulationOutput:
    """
    Execute a complete simulation run.
    
    Steps:
    1. Validate inputs and collect warnings
    2. Compute gas properties at initial conditions
    3. Compute dimensionless numbers (Gr, Re, Da)
    4. Estimate flame temperature
    5. Compute flame geometry
    6. Compute burning rate and heat release
    7. Compute temperature distribution
    8. Assess extinction risk
    9. Package results with metadata
    """
    gravity = params.get_gravity_m_s2()
    gravity_label = params.get_gravity_label()
    fuel = FUEL_PROPERTIES[params.fuel_type]
    warnings = validate_inputs(params)
    
    # Step 1: Determine if combustion is possible
    combustion_possible = params.oxygen_pct >= fuel["min_oxygen_pct"]
    
    # Step 2: Gas properties at initial conditions
    gas_props = compute_gas_properties(
        params.initial_temperature_K,
        params.pressure_kPa,
        params.oxygen_pct
    )
    
    # Step 3: Estimate flame temperature (for Gr calculation)
    T_ad = compute_adiabatic_flame_temperature(
        fuel["adiabatic_flame_temp_K"],
        params.oxygen_pct,
        params.pressure_kPa,
        params.initial_temperature_K
    )
    
    delta_T = T_ad - params.initial_temperature_K if combustion_possible else 0
    
    # Characteristic length scale (use estimated flame diameter ~10mm as initial guess)
    L_char = 0.012  # 12mm in meters
    
    # Step 4: Grashof and Reynolds numbers
    grashof = compute_grashof_number(
        gravity,
        gas_props["beta_1_K"],
        delta_T,
        L_char,
        gas_props["kinematic_viscosity_m2_s"]
    )
    
    airflow_m_s = params.airflow_velocity_cm_s / 100.0
    reynolds = compute_reynolds_number(
        airflow_m_s,
        L_char,
        gas_props["kinematic_viscosity_m2_s"]
    )
    
    # Natural convection velocity
    v_nat = compute_natural_convection_velocity(
        gravity, gas_props["beta_1_K"], delta_T, L_char
    )
    v_nat_cm_s = v_nat * 100
    
    # Effective velocity: max of natural convection and forced flow
    effective_velocity = max(v_nat, airflow_m_s)
    effective_velocity_cm_s = effective_velocity * 100
    
    # Buoyancy assessment
    if grashof > 10000:
        buoyancy = "dominant"
    elif grashof > 100:
        buoyancy = "moderate"
    elif grashof > 1:
        buoyancy = "weak"
    else:
        buoyancy = "negligible"
    
    # Step 5: Flame geometry
    if combustion_possible:
        geometry = compute_flame_geometry(
            grashof, reynolds, gravity, params.oxygen_pct,
            fuel, effective_velocity, gas_props
        )
        
        flame_size_m = geometry["diameter_mm"] / 1000.0
        
        # Recompute heat loss with actual flame size
        heat_loss_eta = compute_heat_loss_factor(
            gravity, T_ad, params.initial_temperature_K, flame_size_m
        )
        
        actual_flame_temp = T_ad * heat_loss_eta
        
        # Step 6: Burning rate
        burn_result = compute_burning_rate(
            fuel, params.oxygen_pct, gas_props,
            flame_size_m, effective_velocity, gravity
        )
        
        # Step 7: Chemical timescale and Damköhler
        tau_chem = estimate_chemical_timescale(actual_flame_temp, params.pressure_kPa, fuel)
        
        # Flow timescale
        if effective_velocity > 1e-4:
            tau_flow = flame_size_m / effective_velocity
        else:
            # Diffusion timescale
            tau_flow = flame_size_m ** 2 / max(gas_props["thermal_diffusivity_m2_s"], 1e-8)
        
        damkohler = compute_damkohler_number(tau_flow, tau_chem)
        
        # Step 8: Temperature distribution
        temp_dist = compute_temperature_distribution(
            actual_flame_temp,
            params.initial_temperature_K,
            flame_size_m,
            gravity,
            heat_loss_eta
        )
        
        # Step 9: Extinction risk
        extinction_risk, extinction_mechanism = estimate_extinction_risk(
            damkohler, params.oxygen_pct, fuel["min_oxygen_pct"],
            actual_flame_temp, fuel["ignition_temp_K"]
        )
        
        # Flame color
        flame_color = compute_flame_color(actual_flame_temp, params.oxygen_pct, fuel, gravity)
        
        # Oxygen transport mode
        if grashof > 1000 and airflow_m_s < 0.01:
            o2_transport = "buoyancy-driven natural convection"
        elif airflow_m_s > 0.05:
            o2_transport = "forced convection (ventilation flow)"
        elif grashof < 10:
            o2_transport = "molecular diffusion only (microgravity)"
        else:
            o2_transport = "mixed convection (buoyancy + diffusion)"
        
        # Stoichiometric mixture fraction
        Z_st = compute_stoichiometric_mixture_fraction(fuel)
        
        # Estimated burn duration (very rough)
        # Assume 1g of fuel for reference
        fuel_mass_mg = 1000  # 1g
        if burn_result["mass_burning_rate_mg_s"] > 0.001:
            burn_duration = fuel_mass_mg / burn_result["mass_burning_rate_mg_s"]
        else:
            burn_duration = 9999
        
    else:
        # No combustion case
        geometry = {"shape": "no_flame", "diameter_mm": 0, "height_mm": 0, "width_mm": 0, "aspect_ratio": 0}
        actual_flame_temp = params.initial_temperature_K
        burn_result = {"mass_burning_rate_mg_s": 0, "heat_release_rate_W": 0, "transfer_number_B": 0}
        damkohler = 0
        temp_dist = {
            "max_flame_temperature_K": params.initial_temperature_K,
            "near_field_temperature_K": params.initial_temperature_K,
            "far_field_temperature_K": params.initial_temperature_K,
            "chamber_wall_temperature_K": params.initial_temperature_K,
        }
        extinction_risk = "certain"
        extinction_mechanism = f"Oxygen ({params.oxygen_pct}%) below minimum for {fuel['name']}"
        flame_color = "none"
        o2_transport = "no combustion"
        Z_st = 0
        burn_duration = 0
        v_nat_cm_s = 0
        effective_velocity_cm_s = airflow_m_s * 100
    
    # Data category classification
    data_categories = {
        "flame_temperature": "PHYSICS_MODEL",
        "flame_geometry": "PHYSICS_MODEL",
        "grashof_number": "PHYSICS_MODEL",
        "reynolds_number": "PHYSICS_MODEL",
        "damkohler_number": "PHYSICS_MODEL",
        "burning_rate": "PHYSICS_MODEL",
        "heat_release_rate": "PHYSICS_MODEL",
        "temperature_distribution": "PHYSICS_MODEL",
        "extinction_risk": "PHYSICS_MODEL",
        "flame_color": "VISUAL_DEMONSTRATION",
        "flame_shape_visualization": "VISUAL_DEMONSTRATION",
        "oxygen_particle_animation": "VISUAL_DEMONSTRATION",
        "fuel_properties": "EXPERIMENTAL_DATA",
        "gravity_values": "EXPERIMENTAL_DATA",
    }
    
    uncertainty_notes = [
        "Flame temperature: ±30% (no detailed chemistry or radiation model)",
        "Flame dimensions: order-of-magnitude estimates (±50%)",
        "Burning rate: ±50% (simplified B-number analysis)",
        "Damköhler number: qualitative indicator only",
        "Extinction predictions: risk-level classification, not quantitative threshold",
    ]
    
    return SimulationOutput(
        input_parameters={
            "gravity_environment": params.gravity_environment.value,
            "gravity_m_s2": gravity,
            "oxygen_pct": params.oxygen_pct,
            "airflow_velocity_cm_s": params.airflow_velocity_cm_s,
            "pressure_kPa": params.pressure_kPa,
            "initial_temperature_K": params.initial_temperature_K,
            "fuel_type": params.fuel_type.value,
            "fuel_name": fuel["name"],
        },
        gravity_label=gravity_label,
        gravity_m_s2=gravity,
        
        flame_exists=combustion_possible,
        flame_shape=geometry["shape"],
        flame_diameter_mm=geometry["diameter_mm"],
        flame_height_mm=geometry["height_mm"],
        flame_width_mm=geometry["width_mm"],
        flame_color_indicator=flame_color,
        flame_temperature_K=round(actual_flame_temp, 1),
        flame_temperature_C=round(actual_flame_temp - 273.15, 1),
        
        grashof_number=round(grashof, 2),
        reynolds_number=round(reynolds, 4),
        buoyancy_strength=buoyancy,
        natural_convection_velocity_cm_s=round(v_nat_cm_s, 3),
        effective_flow_velocity_cm_s=round(effective_velocity_cm_s, 3),
        
        damkohler_number=round(damkohler, 4),
        oxygen_transport_mode=o2_transport,
        mass_burning_rate_mg_s=burn_result["mass_burning_rate_mg_s"],
        heat_release_rate_W=burn_result["heat_release_rate_W"],
        stoichiometric_mixture_fraction=Z_st,
        
        max_flame_temperature_K=temp_dist["max_flame_temperature_K"],
        near_field_temperature_K=temp_dist["near_field_temperature_K"],
        far_field_temperature_K=temp_dist["far_field_temperature_K"],
        chamber_wall_temperature_K=temp_dist["chamber_wall_temperature_K"],
        
        estimated_burn_duration_s=round(min(burn_duration, 99999), 1),
        extinction_risk=extinction_risk,
        extinction_mechanism=extinction_mechanism,
        
        warnings=warnings,
        model_limitations=MODEL_LIMITATIONS,
        model_version=MODEL_VERSION,
        calculation_status="success" if combustion_possible else "partial",
        data_categories=data_categories,
        assumptions=MODEL_ASSUMPTIONS,
        supported_parameter_ranges=SUPPORTED_RANGES,
        uncertainty_notes=uncertainty_notes,
    )


def save_scenario(name: str, params: SimulationInput, output: SimulationOutput) -> ScenarioRecord:
    """Save a simulation scenario to in-memory history."""
    record = ScenarioRecord(
        id=str(uuid.uuid4())[:8],
        name=name,
        timestamp=datetime.now(timezone.utc).isoformat(),
        input_params=params,
        output=output,
    )
    _scenario_history.append(record)
    # Keep last 50 scenarios
    if len(_scenario_history) > 50:
        _scenario_history.pop(0)
    return record


def get_scenario_history() -> List[ScenarioRecord]:
    """Get all saved scenarios."""
    return list(_scenario_history)


def compare_scenarios(scenario_ids: List[str]) -> ComparisonResult:
    """Compare multiple saved scenarios."""
    scenarios = [s for s in _scenario_history if s.id in scenario_ids]
    
    if len(scenarios) < 2:
        return ComparisonResult(
            scenarios=scenarios,
            differences={},
            model_limitations=MODEL_LIMITATIONS
        )
    
    # Compute differences
    diffs = {}
    keys_to_compare = [
        "flame_exists", "flame_shape", "flame_diameter_mm", "flame_height_mm",
        "flame_temperature_K", "grashof_number", "buoyancy_strength",
        "mass_burning_rate_mg_s", "heat_release_rate_W", "damkohler_number",
        "extinction_risk", "oxygen_transport_mode", "max_flame_temperature_K",
    ]
    
    for key in keys_to_compare:
        values = []
        for s in scenarios:
            val = getattr(s.output, key, None)
            values.append({"scenario_id": s.id, "scenario_name": s.name, "value": val})
        diffs[key] = values
    
    return ComparisonResult(
        scenarios=scenarios,
        differences=diffs,
        model_limitations=MODEL_LIMITATIONS
    )
