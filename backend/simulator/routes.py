"""
FastAPI routes for the Microgravity Combustion Simulator.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from .models import (
    SimulationInput, SimulationOutput, FuelType, GravityEnvironment,
    FUEL_PROPERTIES, GRAVITY_VALUES, GRAVITY_LABELS,
    ScenarioRecord
)
from .engine import (
    run_simulation, save_scenario, get_scenario_history,
    compare_scenarios, MODEL_VERSION, MODEL_ASSUMPTIONS,
    MODEL_LIMITATIONS, SUPPORTED_RANGES
)

router = APIRouter(prefix="/api/simulator", tags=["simulator"])


@router.get("/info")
def get_simulator_info():
    """Get simulator metadata, supported fuels, gravity environments, and model info."""
    fuels = {}
    for ft in FuelType:
        props = FUEL_PROPERTIES[ft]
        fuels[ft.value] = {
            "name": props["name"],
            "description": props["description"],
            "phase": props["phase"],
            "min_oxygen_pct": props["min_oxygen_pct"],
            "adiabatic_flame_temp_K": props["adiabatic_flame_temp_K"],
            "heat_of_combustion_kJ_per_g": props["heat_of_combustion_kJ_per_g"],
            "nasa_investigations": props["nasa_investigations"],
        }

    environments = {}
    for env in GravityEnvironment:
        if env != GravityEnvironment.CUSTOM:
            environments[env.value] = {
                "label": GRAVITY_LABELS[env],
                "gravity_m_s2": GRAVITY_VALUES[env],
                "g_fraction": round(GRAVITY_VALUES[env] / 9.81, 4),
            }

    return {
        "model_version": MODEL_VERSION,
        "model_type": "Reduced-Order Analytical Combustion Model",
        "disclaimer": (
            "This simulator uses simplified analytical relationships from classical combustion theory. "
            "It is NOT a CFD simulation and does NOT reproduce NASA experiments. "
            "Results are educational estimates with significant uncertainty."
        ),
        "fuels": fuels,
        "gravity_environments": environments,
        "supported_parameter_ranges": SUPPORTED_RANGES,
        "assumptions": MODEL_ASSUMPTIONS,
        "limitations": MODEL_LIMITATIONS,
    }


@router.post("/run")
def run_simulation_endpoint(params: SimulationInput):
    """
    Run a simulation with the given parameters.
    Returns comprehensive results including flame behavior, temperatures,
    dimensionless numbers, and model metadata.
    """
    try:
        result = run_simulation(params)
        return result.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


class SaveScenarioRequest(BaseModel):
    name: str
    params: SimulationInput


@router.post("/scenarios/save")
def save_scenario_endpoint(request: SaveScenarioRequest):
    """Save a simulation scenario for later comparison."""
    try:
        result = run_simulation(request.params)
        record = save_scenario(request.name, request.params, result)
        return {
            "status": "saved",
            "scenario_id": record.id,
            "scenario_name": record.name,
            "timestamp": record.timestamp,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save scenario: {str(e)}")


@router.get("/scenarios")
def get_scenarios():
    """Get all saved scenarios."""
    history = get_scenario_history()
    return {
        "count": len(history),
        "scenarios": [
            {
                "id": s.id,
                "name": s.name,
                "timestamp": s.timestamp,
                "gravity": s.input_params.gravity_environment.value,
                "oxygen_pct": s.input_params.oxygen_pct,
                "fuel": s.input_params.fuel_type.value,
                "flame_exists": s.output.flame_exists,
                "flame_temp_K": s.output.flame_temperature_K,
            }
            for s in history
        ],
    }


class CompareRequest(BaseModel):
    scenario_ids: List[str]


@router.post("/scenarios/compare")
def compare_scenarios_endpoint(request: CompareRequest):
    """Compare two or more saved scenarios."""
    if len(request.scenario_ids) < 2:
        raise HTTPException(status_code=400, detail="At least two scenario IDs required for comparison")
    
    result = compare_scenarios(request.scenario_ids)
    return {
        "compared_count": len(result.scenarios),
        "scenarios": [
            {
                "id": s.id,
                "name": s.name,
                "timestamp": s.timestamp,
                "input": s.input_params.model_dump(),
                "output": s.output.model_dump(),
            }
            for s in result.scenarios
        ],
        "differences": result.differences,
        "model_limitations": result.model_limitations,
    }


@router.get("/research-context/{gravity_env}")
def get_research_context(gravity_env: str):
    """
    Get relevant NASA research investigations for a given gravity environment.
    Links the simulator to the existing research database.
    """
    context = {
        "earth": {
            "description": "Earth-gravity (1g) serves as the baseline for all microgravity combustion comparisons.",
            "relevant_investigations": [
                {
                    "name": "BASS / BASS-II",
                    "objective": "Baseline solid material burning behavior measurements",
                    "relevance": "BASS experiments compare 1g ground tests with ISS microgravity to quantify buoyancy effects on flame spread",
                },
                {
                    "name": "SAFFIRE",
                    "objective": "Large-scale spacecraft fire safety demonstration",
                    "relevance": "Ground-based (1g) tests established baseline heat release rates before Cygnus vehicle tests",
                },
            ],
            "key_physics": "At 1g, buoyancy-driven natural convection creates tall, teardrop-shaped flames with strong upward airflow entrainment.",
        },
        "iss": {
            "description": "ISS microgravity (≈0g) is the primary environment for NASA combustion experiments.",
            "relevant_investigations": [
                {
                    "name": "FLEX / FLEX-2",
                    "objective": "Droplet combustion and cool flame discovery in microgravity",
                    "relevance": "FLEX experiments revealed that flames become spherical in 0g and can transition to invisible 'cool flame' combustion",
                },
                {
                    "name": "BASS / BASS-II",
                    "objective": "Solid material flammability limits in microgravity",
                    "relevance": "Discovered that materials can burn at lower oxygen concentrations with gentle airflow in microgravity",
                },
                {
                    "name": "ACME",
                    "objective": "Structure and response of spherical diffusion flames",
                    "relevance": "Studied the unique spherical flame geometry that occurs only in microgravity due to absence of buoyancy",
                },
                {
                    "name": "SoFIE",
                    "objective": "Solid fuel ignition and extinction in microgravity",
                    "relevance": "Investigating material flammability for future exploration atmospheres (34% O2)",
                },
            ],
            "key_physics": "Without buoyancy, flames become spherical, oxygen transport is purely diffusive, and combustion products accumulate around the flame. This leads to larger, cooler, bluer flames that can persist as invisible cool flames.",
        },
        "moon": {
            "description": "Lunar gravity (0.166g) represents a partial-gravity environment relevant to Artemis missions.",
            "relevant_investigations": [
                {
                    "name": "SAFFIRE",
                    "objective": "Spacecraft fire behavior extrapolation to exploration environments",
                    "relevance": "SAFFIRE results inform fire safety for lunar habitat modules but direct 0.166g testing has not been performed",
                },
                {
                    "name": "SoFIE",
                    "objective": "Material behavior in Exploration Atmosphere",
                    "relevance": "SoFIE-MIST tests at 34% O2 are directly relevant to planned Artemis habitat atmospheres",
                },
            ],
            "key_physics": "At 0.166g, buoyancy exists but is weak. Flames would be slightly elongated but much less than on Earth. This is a largely unexplored regime — most data comes from ISS (0g) and Earth (1g).",
            "data_gap_warning": "No combustion experiments have been conducted at actual lunar gravity. Model predictions at 0.166g are interpolations between 0g and 1g data with significant uncertainty.",
        },
        "mars": {
            "description": "Martian gravity (0.38g) with a CO2-dominated atmosphere presents unique fire challenges.",
            "relevant_investigations": [
                {
                    "name": "SAFFIRE",
                    "objective": "Large-scale fire behavior for transit vehicles",
                    "relevance": "Mars transit vehicles will experience extended microgravity, making SAFFIRE data critical for mission planning",
                },
                {
                    "name": "ACME",
                    "objective": "Fundamental flame structure studies",
                    "relevance": "ACME-BRE burner experiments provide data on flame dynamics that can inform partial-gravity predictions",
                },
            ],
            "key_physics": "At 0.38g, buoyancy provides moderate natural convection. Mars surface habitats face additional complexity from the CO2-rich atmosphere (95% CO2), which suppresses combustion differently than N2-diluted air.",
            "data_gap_warning": "No combustion experiments have been conducted at Mars gravity or in CO2-rich atmospheres representative of Mars. This simulator uses N2-diluted air assumptions only.",
        },
    }
    
    env_key = gravity_env.lower()
    if env_key not in context:
        raise HTTPException(status_code=404, detail=f"Unknown gravity environment: {gravity_env}")
    
    return context[env_key]
