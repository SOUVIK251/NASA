"""
Simulation parameter definitions and validation.

All parameter boundaries are documented with physical justification.
Units are SI unless noted otherwise.

ASSUMPTIONS DOCUMENT:
- This model uses simplified analytical relationships derived from classical
  combustion theory (Burke-Schumann, Damköhler analysis) adapted for reduced gravity.
- It is NOT a CFD solver. It provides reduced-order estimates.
- Flame shape transitions between buoyancy-dominated (teardrop) and 
  diffusion-dominated (spherical) geometries based on Grashof/Reynolds analysis.
- Temperature estimates use adiabatic flame temperature correlations 
  with empirical correction factors for heat loss.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal, Dict, Any
from enum import Enum
import math


class GravityEnvironment(str, Enum):
    EARTH = "earth"
    ISS = "iss"
    MOON = "moon"
    MARS = "mars"
    CUSTOM = "custom"


GRAVITY_VALUES = {
    GravityEnvironment.EARTH: 9.81,
    GravityEnvironment.ISS: 0.0,
    GravityEnvironment.MOON: 1.62,
    GravityEnvironment.MARS: 3.72,
}

GRAVITY_LABELS = {
    GravityEnvironment.EARTH: "Earth (1 g = 9.81 m/s²)",
    GravityEnvironment.ISS: "ISS Microgravity (≈ 0 g)",
    GravityEnvironment.MOON: "Moon (0.166 g = 1.62 m/s²)",
    GravityEnvironment.MARS: "Mars (0.38 g = 3.72 m/s²)",
}


class FuelType(str, Enum):
    PMMA = "pmma"
    CELLULOSE = "cellulose"
    HEPTANE = "heptane"
    METHANE = "methane"


FUEL_PROPERTIES = {
    FuelType.PMMA: {
        "name": "PMMA (Polymethyl Methacrylate / Acrylic)",
        "description": "A transparent thermoplastic commonly used in spacecraft windows and structural panels. Studied extensively in BASS and SAFFIRE experiments.",
        "heat_of_combustion_kJ_per_g": 25.2,
        "stoich_air_fuel_ratio": 8.3,
        "adiabatic_flame_temp_K": 2200,
        "min_oxygen_pct": 15.0,
        "density_kg_m3": 1190,
        "thermal_conductivity_W_mK": 0.19,
        "specific_heat_J_kgK": 1420,
        "ignition_temp_K": 573,
        "phase": "solid",
        "nasa_investigations": ["BASS", "BASS-II", "SAFFIRE"],
    },
    FuelType.CELLULOSE: {
        "name": "Cellulose / Cotton-Based Fabric",
        "description": "Representative of fabric materials aboard spacecraft. SIBAL fabric blends and cotton strips studied in SAFFIRE and BASS experiments.",
        "heat_of_combustion_kJ_per_g": 17.0,
        "stoich_air_fuel_ratio": 6.1,
        "adiabatic_flame_temp_K": 1900,
        "min_oxygen_pct": 16.0,
        "density_kg_m3": 1500,
        "thermal_conductivity_W_mK": 0.04,
        "specific_heat_J_kgK": 1300,
        "ignition_temp_K": 533,
        "phase": "solid",
        "nasa_investigations": ["SAFFIRE", "BASS"],
    },
    FuelType.HEPTANE: {
        "name": "n-Heptane (Liquid Fuel Droplet)",
        "description": "A liquid hydrocarbon studied in FLEX and FLEX-2 droplet combustion experiments aboard the ISS CIR. Central to the 'cool flame' discovery.",
        "heat_of_combustion_kJ_per_g": 48.1,
        "stoich_air_fuel_ratio": 15.1,
        "adiabatic_flame_temp_K": 2370,
        "min_oxygen_pct": 12.0,
        "density_kg_m3": 684,
        "thermal_conductivity_W_mK": 0.14,
        "specific_heat_J_kgK": 2240,
        "ignition_temp_K": 488,
        "phase": "liquid",
        "nasa_investigations": ["FLEX", "FLEX-2"],
    },
    FuelType.METHANE: {
        "name": "Methane (Gaseous Fuel)",
        "description": "The simplest hydrocarbon gas, used as a reference fuel in fundamental combustion studies. Relevant to ISRU propellant systems on Mars.",
        "heat_of_combustion_kJ_per_g": 55.5,
        "stoich_air_fuel_ratio": 17.2,
        "adiabatic_flame_temp_K": 2230,
        "min_oxygen_pct": 5.0,
        "density_kg_m3": 0.657,
        "thermal_conductivity_W_mK": 0.034,
        "specific_heat_J_kgK": 2220,
        "ignition_temp_K": 810,
        "phase": "gas",
        "nasa_investigations": ["ACME"],
    },
}


class SimulationInput(BaseModel):
    """Input parameters for a simulation run."""
    
    gravity_environment: GravityEnvironment = Field(
        default=GravityEnvironment.ISS,
        description="Gravitational environment selection"
    )
    custom_gravity_m_s2: Optional[float] = Field(
        default=None,
        description="Custom gravity value in m/s² (only used if gravity_environment is 'custom')",
        ge=0.0,
        le=20.0
    )
    oxygen_pct: float = Field(
        default=21.0,
        description="Oxygen concentration as volume percentage (Earth standard: 21%)",
        ge=0.0,
        le=100.0
    )
    airflow_velocity_cm_s: float = Field(
        default=0.0,
        description="Forced airflow velocity in cm/s (0 = quiescent, ISS ventilation typically 5-20 cm/s)",
        ge=0.0,
        le=100.0
    )
    pressure_kPa: float = Field(
        default=101.325,
        description="Chamber pressure in kilopascals (Earth sea level: 101.325 kPa)",
        ge=10.0,
        le=200.0
    )
    initial_temperature_K: float = Field(
        default=298.15,
        description="Initial environmental temperature in Kelvin (25°C = 298.15 K)",
        ge=200.0,
        le=500.0
    )
    fuel_type: FuelType = Field(
        default=FuelType.PMMA,
        description="Fuel or material type"
    )

    @field_validator('custom_gravity_m_s2')
    @classmethod
    def validate_custom_gravity(cls, v, info):
        if info.data.get('gravity_environment') == GravityEnvironment.CUSTOM and v is None:
            raise ValueError("custom_gravity_m_s2 must be provided when gravity_environment is 'custom'")
        return v

    def get_gravity_m_s2(self) -> float:
        if self.gravity_environment == GravityEnvironment.CUSTOM:
            return self.custom_gravity_m_s2 or 0.0
        return GRAVITY_VALUES[self.gravity_environment]

    def get_gravity_label(self) -> str:
        if self.gravity_environment == GravityEnvironment.CUSTOM:
            return f"Custom ({self.custom_gravity_m_s2:.3f} m/s²)"
        return GRAVITY_LABELS[self.gravity_environment]


class SimulationOutput(BaseModel):
    """Structured output from a simulation run."""
    
    # Input echo
    input_parameters: Dict[str, Any]
    gravity_label: str
    gravity_m_s2: float
    
    # Flame behavior indicators
    flame_exists: bool
    flame_shape: str  # "spherical", "teardrop", "elongated", "no_flame"
    flame_diameter_mm: float
    flame_height_mm: float
    flame_width_mm: float
    flame_color_indicator: str  # descriptive, e.g. "blue-core-yellow-mantle"
    flame_temperature_K: float
    flame_temperature_C: float
    
    # Buoyancy and flow
    grashof_number: float
    reynolds_number: float
    buoyancy_strength: str  # "dominant", "moderate", "negligible"
    natural_convection_velocity_cm_s: float
    effective_flow_velocity_cm_s: float
    
    # Oxygen and combustion
    damkohler_number: float
    oxygen_transport_mode: str
    mass_burning_rate_mg_s: float
    heat_release_rate_W: float
    stoichiometric_mixture_fraction: float
    
    # Temperature distribution
    max_flame_temperature_K: float
    near_field_temperature_K: float
    far_field_temperature_K: float
    chamber_wall_temperature_K: float
    
    # Time indicators
    estimated_burn_duration_s: float
    extinction_risk: str  # "low", "moderate", "high", "certain"
    extinction_mechanism: str
    
    # Model metadata
    warnings: List[str]
    model_limitations: List[str]
    model_version: str
    calculation_status: str  # "success", "partial", "invalid_parameters"
    data_categories: Dict[str, Any]  # maps each output to "PHYSICS_MODEL", "EXPERIMENTAL_DATA", "VISUAL_DEMONSTRATION"
    assumptions: List[str]
    supported_parameter_ranges: Dict[str, Any]
    uncertainty_notes: List[str]


class ScenarioRecord(BaseModel):
    """A saved simulation scenario for comparison."""
    id: str
    name: str
    timestamp: str
    input_params: SimulationInput
    output: SimulationOutput


class ComparisonResult(BaseModel):
    """Result of comparing multiple scenarios."""
    scenarios: List[ScenarioRecord]
    differences: Dict[str, Any]
    model_limitations: List[str]
