"""
FastAPI Routes for NASA Machine-Learning Combustion Inference.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

from ml.model_inference import (
    predict_droplet,
    predict_droplet_timeseries,
    load_model_artifacts
)

router = APIRouter(prefix="/api/ml", tags=["Machine Learning Inference"])


class DropletPredictionRequest(BaseModel):
    initial_diameter_mm: float = Field(default=3.0, ge=0.5, le=10.0, description="Initial droplet diameter D0 in mm")
    oxygen_pct: float = Field(default=21.0, ge=5.0, le=50.0, description="Ambient oxygen concentration in %")
    pressure_atm: float = Field(default=1.0, ge=0.2, le=5.0, description="Ambient chamber pressure in atm")
    time_s: float = Field(default=0.0, ge=0.0, description="Current combustion elapsed time in seconds")
    gravity_m_s2: float = Field(default=0.0, ge=0.0, le=9.81, description="Gravitational acceleration in m/s^2 (0 = ISS)")


class DropletTimeseriesRequest(BaseModel):
    initial_diameter_mm: float = Field(default=3.0, ge=0.5, le=10.0)
    oxygen_pct: float = Field(default=21.0, ge=5.0, le=50.0)
    pressure_atm: float = Field(default=1.0, ge=0.2, le=5.0)
    gravity_m_s2: float = Field(default=0.0, ge=0.0, le=9.81)
    num_points: int = Field(default=100, ge=10, le=500)


@router.post("/predict-droplet")
def endpoint_predict_droplet(req: DropletPredictionRequest):
    """
    Predict instantaneous droplet diameter, burning rate, and flame regime
    at elapsed time t using the Two-Stage Physics-Informed ML model (APPROXIMATED_CURVE input data).
    """
    try:
        return predict_droplet(
            d0_mm=req.initial_diameter_mm,
            o2_pct=req.oxygen_pct,
            pressure_atm=req.pressure_atm,
            time_s=req.time_s,
            gravity_ms2=req.gravity_m_s2
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Inference error: {str(e)}")


@router.post("/predict-timeseries")
def endpoint_predict_timeseries(req: DropletTimeseriesRequest):
    """
    Generate full predicted combustion trajectory from t=0 to extinction
    with uncertainty bounds and physics baseline curves.
    """
    try:
        return predict_droplet_timeseries(
            d0_mm=req.initial_diameter_mm,
            o2_pct=req.oxygen_pct,
            pressure_atm=req.pressure_atm,
            gravity_ms2=req.gravity_m_s2,
            num_points=req.num_points
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Timeseries error: {str(e)}")


@router.get("/model-info")
def endpoint_model_info():
    """
    Return training provenance, holdout test metrics, and baseline comparisons.
    """
    try:
        artifacts = load_model_artifacts()
        return artifacts["config"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model info: {str(e)}")
