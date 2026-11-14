"""
FastAPI routes for the NASA Dataset-Driven 3D Combustion Simulator.

Endpoints:
  GET  /api/datasets                           - List all available datasets
  GET  /api/datasets/{dataset_id}              - Full dataset record with experiments
  GET  /api/datasets/{dataset_id}/experiments  - Experiments for a dataset
  GET  /api/experiments/{experiment_id}/metadata   - Experiment metadata
  GET  /api/experiments/{experiment_id}/timeseries - Full time-series data
  GET  /api/experiments/{experiment_id}/at/{time_s} - Interpolated snapshot
  GET  /api/experiments/{experiment_id}/statistics - Summary statistics
  POST /api/simulator/dataset-compare          - Compare experiments
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List

from dataset_pipeline import (
    get_all_datasets,
    get_dataset_by_id,
    get_experiments_for_dataset,
    get_experiment_metadata,
    load_experiment_timeseries,
    get_timeseries_at_time,
    get_summary_statistics,
    load_dataset_manifest,
)

dataset_router = APIRouter(prefix="/api", tags=["datasets"])


# ─── Dataset-level Endpoints ──────────────────────────────────────────────────

@dataset_router.get("/manifest")
def get_manifest():
    """Get the complete data provenance manifest with DOI citations and tiers."""
    try:
        return load_dataset_manifest()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"Dataset manifest not found: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load manifest: {str(e)}")


@dataset_router.get("/datasets")
def list_datasets():
    """List all available NASA datasets with summary information."""
    try:
        datasets = get_all_datasets()
        return {
            "count": len(datasets),
            "datasets": datasets,
            "note": "Data derived from published NASA research. See each dataset's data_attribution field."
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"Dataset index not found: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load datasets: {str(e)}")


@dataset_router.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: str):
    """Get full dataset record including all experiments."""
    ds = get_dataset_by_id(dataset_id)
    if not ds:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset '{dataset_id}' not found. Available: FLEX, BASS-II, SAFFIRE, SPICE"
        )
    return ds


@dataset_router.get("/datasets/{dataset_id}/experiments")
def list_experiments(dataset_id: str):
    """List all experiments for a dataset."""
    ds = get_dataset_by_id(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")

    experiments = get_experiments_for_dataset(dataset_id)
    return {
        "dataset_id": dataset_id,
        "dataset_name": ds["name"],
        "investigation_type": ds["investigation_type"],
        "count": len(experiments),
        "experiments": experiments
    }


# ─── Experiment-level Endpoints ───────────────────────────────────────────────

@dataset_router.get("/experiments/{experiment_id}/metadata")
def get_experiment_meta(experiment_id: str):
    """Get metadata for a specific experiment."""
    meta = get_experiment_metadata(experiment_id)
    if not meta:
        raise HTTPException(
            status_code=404,
            detail=f"Experiment '{experiment_id}' not found."
        )
    return meta


@dataset_router.get("/experiments/{experiment_id}/timeseries")
def get_timeseries(
    experiment_id: str,
    start_s: Optional[float] = Query(None, description="Start time in seconds"),
    end_s: Optional[float] = Query(None, description="End time in seconds"),
    max_points: Optional[int] = Query(None, ge=10, le=2000, description="Max data points to return")
):
    """
    Get the full time-series data for an experiment.
    
    Supports optional time windowing and downsampling.
    All measurements are labeled with their data quality.
    """
    ts = load_experiment_timeseries(experiment_id)

    if "error" in ts and not ts.get("data"):
        raise HTTPException(status_code=404, detail=ts["error"])

    data = ts.get("data", [])

    # Time window filter
    if start_s is not None:
        data = [r for r in data if r.get("time_s", 0) >= start_s]
    if end_s is not None:
        data = [r for r in data if r.get("time_s", 0) <= end_s]

    # Downsample if requested
    if max_points is not None and len(data) > max_points:
        step = max(1, len(data) // max_points)
        data = data[::step]
        if data[-1] != ts["data"][-1]:  # Ensure last point included
            data.append(ts["data"][-1])

    return {
        "experiment_id": experiment_id,
        "dataset_id": ts.get("dataset_id"),
        "data_status": ts.get("data_status"),
        "data_attribution": ts.get("metadata", {}).get("data_attribution", ""),
        "row_count": len(data),
        "duration_s": ts.get("duration_s"),
        "columns": ts.get("columns", {}),
        "measurement_labels": ts.get("measurement_labels", []),
        "illustrative_labels": ts.get("illustrative_labels", []),
        "warnings": ts.get("warnings", []),
        "data": data,
    }


@dataset_router.get("/experiments/{experiment_id}/at/{time_s}")
def get_state_at_time(experiment_id: str, time_s: float):
    """
    Get the interpolated experiment state at a specific time.
    
    Returns measured values, interpolation flag, and data quality labels.
    Values between recorded timestamps are linearly interpolated.
    Interpolated values are clearly flagged.
    """
    if time_s < 0:
        raise HTTPException(status_code=400, detail="time_s must be >= 0")

    state = get_timeseries_at_time(experiment_id, time_s)
    if state is None:
        raise HTTPException(status_code=404, detail=f"No data for experiment {experiment_id}")

    meta = get_experiment_metadata(experiment_id)
    return {
        "experiment_id": experiment_id,
        "query_time_s": time_s,
        "state": state,
        "is_interpolated": state.get("_interpolated", False),
        "measurement_labels": meta.get("measured_measurements", []) if meta else [],
        "illustrative_labels": meta.get("illustrative_measurements", []) if meta else [],
        "data_quality": state.get("data_quality", "UNKNOWN"),
        "data_quality_warning": (
            "Values at this timestamp are linearly interpolated between recorded measurements."
            if state.get("_interpolated") else None
        )
    }


@dataset_router.get("/experiments/{experiment_id}/statistics")
def get_experiment_statistics(experiment_id: str):
    """Get summary statistics for an experiment's measurements."""
    stats = get_summary_statistics(experiment_id)
    if "error" in stats:
        raise HTTPException(status_code=404, detail=stats["error"])
    return stats


# ─── Multi-experiment comparison ──────────────────────────────────────────────

class DatasetCompareRequest(BaseModel):
    experiment_ids: List[str]


@dataset_router.post("/simulator/dataset-compare")
def compare_experiments(request: DatasetCompareRequest):
    """
    Compare metadata and summary statistics from multiple experiments.
    Experiments must be from the same investigation type for meaningful comparison.
    """
    if len(request.experiment_ids) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 experiment IDs to compare.")
    if len(request.experiment_ids) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 experiments can be compared at once.")

    results = []
    investigation_types = set()

    for eid in request.experiment_ids:
        meta = get_experiment_metadata(eid)
        if not meta:
            raise HTTPException(status_code=404, detail=f"Experiment '{eid}' not found.")

        stats = get_summary_statistics(eid)
        investigation_types.add(meta.get("investigation_type", "UNKNOWN"))

        results.append({
            "experiment_id": eid,
            "metadata": meta,
            "statistics": stats,
        })

    cross_type_warning = None
    if len(investigation_types) > 1:
        cross_type_warning = (
            f"WARNING: Comparing experiments from different investigation types: {', '.join(investigation_types)}. "
            "This is scientifically misleading. Please compare experiments of the same type."
        )

    return {
        "compared_count": len(results),
        "investigation_types": list(investigation_types),
        "cross_type_warning": cross_type_warning,
        "comparisons": results,
    }
