"""
NASA Dataset Pipeline for Flame in Freefall.

This module handles loading, parsing, validating and serving
real NASA experimental datasets from the local data store.

Data sources:
- FLEX (PSI-69): n-Heptane droplet combustion, cool flame discovery
- BASS-II (PSI-25): Solid material flame spread in microgravity
- SAFFIRE (PSI-98): Large-scale spacecraft fire experiments

Data quality labels:
  MEASURED       - Direct instrument measurement from the experiment
  PUBLISHED_LITERATURE - Digitized from peer-reviewed journal figures/tables
  PUBLISHED_REPORTS    - Derived from NASA technical reports / press releases
  ILLUSTRATIVE   - Physically reasonable estimate for visualization only
  METADATA_ONLY  - Only experiment metadata, no time-series data available
"""

import os
import json
import csv
import math
import hashlib
from typing import Dict, List, Any, Optional, Tuple
from functools import lru_cache
from datetime import datetime, timezone

# ─── Path Configuration ────────────────────────────────────────────────────────

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.abspath(os.path.join(_BACKEND_DIR, ".."))
_DATA_ROOT = os.path.join(_PROJECT_ROOT, "flame-in-freefall-data")
_MEASUREMENTS_ROOT = os.path.join(_DATA_ROOT, "measurements")
_INDEX_PATH = os.path.join(_DATA_ROOT, "dataset_index.json")
_MANIFEST_PATH = os.path.join(_DATA_ROOT, "manifest.json")

# In-memory cache (populated on first access)
_DATASET_CACHE: Dict[str, Any] = {}
_TIMESERIES_CACHE: Dict[str, List[Dict]] = {}


# ─── Dataset Index & Manifest ──────────────────────────────────────────────────

def load_dataset_manifest() -> Dict[str, Any]:
    """Load the Phase 1 data provenance manifest JSON."""
    if "manifest" in _DATASET_CACHE:
        return _DATASET_CACHE["manifest"]

    if not os.path.exists(_MANIFEST_PATH):
        raise FileNotFoundError(f"Dataset manifest not found at {_MANIFEST_PATH}")

    with open(_MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    _DATASET_CACHE["manifest"] = manifest
    return manifest


def load_dataset_index() -> Dict[str, Any]:
    """Load the master dataset index JSON."""
    if "index" in _DATASET_CACHE:
        return _DATASET_CACHE["index"]

    if not os.path.exists(_INDEX_PATH):
        raise FileNotFoundError(f"Dataset index not found at {_INDEX_PATH}")

    with open(_INDEX_PATH, "r", encoding="utf-8") as f:
        index = json.load(f)

    _DATASET_CACHE["index"] = index
    return index


def get_all_datasets() -> List[Dict[str, Any]]:
    """Return a summary list of all datasets."""
    index = load_dataset_index()
    summaries = []
    for ds in index.get("datasets", []):
        summaries.append({
            "dataset_id": ds["dataset_id"],
            "psi_id": ds["psi_id"],
            "name": ds["name"],
            "investigation_type": ds["investigation_type"],
            "platform": ds["platform"],
            "gravity": ds["gravity"],
            "gravity_ms2": ds["gravity_ms2"],
            "principal_investigator": ds["principal_investigator"],
            "years": ds["years"],
            "description": ds["description"],
            "key_discovery": ds["key_discovery"],
            "psi_url": ds["psi_url"],
            "data_status": ds["data_status"],
            "experiment_count": len(ds.get("experiments", [])),
        })
    return summaries


def get_dataset_by_id(dataset_id: str) -> Optional[Dict[str, Any]]:
    """Return the full dataset record by ID."""
    index = load_dataset_index()
    for ds in index.get("datasets", []):
        if ds["dataset_id"].upper() == dataset_id.upper():
            return ds
    return None


def get_experiments_for_dataset(dataset_id: str) -> List[Dict[str, Any]]:
    """Return all experiments for a given dataset."""
    ds = get_dataset_by_id(dataset_id)
    if not ds:
        return []
    return ds.get("experiments", [])


def get_experiment_metadata(experiment_id: str) -> Optional[Dict[str, Any]]:
    """Find an experiment by its ID across all datasets."""
    index = load_dataset_index()
    for ds in index.get("datasets", []):
        for exp in ds.get("experiments", []):
            if exp["experiment_id"] == experiment_id:
                return {
                    **exp,
                    "dataset_id": ds["dataset_id"],
                    "psi_id": ds["psi_id"],
                    "dataset_name": ds["name"],
                    "investigation_type": ds["investigation_type"],
                    "platform": ds["platform"],
                    "gravity_ms2": ds["gravity_ms2"],
                    "data_attribution": ds["data_attribution"],
                }
    return None


# ─── CSV Parser ───────────────────────────────────────────────────────────────

def _detect_numeric(value: str) -> Any:
    """Convert string to int, float, or leave as string."""
    value = value.strip()
    if value.lower() == "true":
        return True
    if value.lower() == "false":
        return False
    try:
        if "." in value:
            return float(value)
        return int(value)
    except ValueError:
        return value


def parse_csv_file(filepath: str) -> Tuple[List[Dict], List[str]]:
    """
    Parse a NASA measurement CSV file.

    Returns:
        (rows, warnings)
        rows: list of dicts with numeric values where possible
        warnings: list of data quality warnings
    """
    if not os.path.exists(filepath):
        return [], [f"File not found: {filepath}"]

    rows = []
    warnings = []
    comment_lines = []

    with open(filepath, "r", encoding="utf-8") as f:
        raw_lines = f.readlines()

    # Strip comment lines (starting with #)
    data_lines = []
    for line in raw_lines:
        stripped = line.strip()
        if stripped.startswith("#"):
            comment_lines.append(stripped)
        elif stripped:
            data_lines.append(stripped)

    if not data_lines:
        return [], ["Empty or comment-only file"]

    reader = csv.DictReader(data_lines)
    for i, row in enumerate(reader):
        parsed = {}
        for k, v in row.items():
            k = k.strip()
            if k:
                parsed[k] = _detect_numeric(v) if v is not None else None
        # Skip rows with all None/missing values
        if any(v is not None for v in parsed.values()):
            rows.append(parsed)

    # Check for placeholder data
    for row in rows:
        for v in row.values():
            if isinstance(v, str) and "PLACEHOLDER" in v.upper():
                warnings.append("Dataset contains PLACEHOLDER values – do not present as NASA measurements.")
                break

    return rows, warnings


# ─── Timeseries Loading ───────────────────────────────────────────────────────

def load_experiment_timeseries(experiment_id: str) -> Dict[str, Any]:
    """
    Load the full time-series data for an experiment.

    Returns a structured dict with:
    - data: list of time-step dicts
    - columns: column names and their types
    - warnings: data quality warnings
    - metadata: experiment metadata
    """
    cache_key = f"ts_{experiment_id}"
    if cache_key in _TIMESERIES_CACHE:
        return _TIMESERIES_CACHE[cache_key]

    meta = get_experiment_metadata(experiment_id)
    if not meta:
        return {"error": f"Experiment {experiment_id} not found", "data": []}

    dataset_id = meta["dataset_id"]
    data_file = meta.get("data_file")

    if not data_file:
        return {
            "experiment_id": experiment_id,
            "data_status": "METADATA_ONLY",
            "data": [],
            "metadata": meta,
            "warnings": ["No data file available for this experiment. Check PSI portal for data."],
            "columns": {}
        }

    # Resolve file path
    folder_map = {
        "FLEX": "flex",
        "BASS-II": "bass",
        "SAFFIRE": "saffire",
        "SOFIE-GEL": "sofie_gel",
        "SPICE": "spice",
    }
    folder = folder_map.get(dataset_id.upper(), dataset_id.lower())
    filepath = os.path.join(_MEASUREMENTS_ROOT, folder, data_file)

    rows, warnings = parse_csv_file(filepath)

    if not rows:
        return {
            "experiment_id": experiment_id,
            "data_status": "FILE_ERROR",
            "data": [],
            "metadata": meta,
            "warnings": warnings or ["File exists but no data rows found."],
            "columns": {}
        }

    # Analyze columns
    columns = {}
    if rows:
        for col in rows[0].keys():
            col_values = [r.get(col) for r in rows if r.get(col) is not None]
            col_type = type(col_values[0]).__name__ if col_values else "str"
            columns[col] = {
                "type": col_type,
                "min": min((v for v in col_values if isinstance(v, (int, float))), default=None),
                "max": max((v for v in col_values if isinstance(v, (int, float))), default=None),
                "is_measured": col in meta.get("measured_measurements", []),
                "is_illustrative": col in meta.get("illustrative_measurements", []),
            }

    # Compute derived fields
    enhanced_rows = _enhance_rows(rows, meta)

    result = {
        "experiment_id": experiment_id,
        "dataset_id": dataset_id,
        "data_file": data_file,
        "data_status": meta.get("data_quality", "UNKNOWN"),
        "data": enhanced_rows,
        "row_count": len(enhanced_rows),
        "duration_s": enhanced_rows[-1].get("time_s", 0) if enhanced_rows else 0,
        "metadata": meta,
        "columns": columns,
        "warnings": warnings,
        "measurement_labels": meta.get("measured_measurements", []),
        "illustrative_labels": meta.get("illustrative_measurements", []),
    }

    _TIMESERIES_CACHE[cache_key] = result
    return result


def _enhance_rows(rows: List[Dict], meta: Dict) -> List[Dict]:
    """Add computed/derived fields to each row for visualization."""
    investigation_type = meta.get("investigation_type", "")

    for row in rows:
        # Add data quality label for each row's primary measurement
        row["_data_quality"] = row.get("data_quality", meta.get("data_quality", "UNKNOWN"))

        if investigation_type == "DROPLET_COMBUSTION":
            # Normalize droplet diameter for visualization (0-1 scale)
            d = row.get("D_mm", 0) or 0
            d0 = meta.get("initial_droplet_diameter_mm", 3.5)
            row["_norm_diameter"] = d / d0 if d0 > 0 else 0

            # Map phase to numeric
            phase = str(row.get("phase", "")).upper()
            row["_phase_numeric"] = {
                "IGNITING": 0, "HOT_FLAME": 1, "HOT_FLAME_WEAKENING": 2,
                "HOT_FLAME_EXTINCTION": 3, "COOL_FLAME": 4, "COOL_FLAME_WEAKENING": 5,
                "EXTINGUISHED": 6
            }.get(phase, -1)

            # Is visible flame present?
            row["_has_hot_flame"] = phase in ("HOT_FLAME", "HOT_FLAME_WEAKENING", "IGNITING")
            row["_has_cool_flame"] = phase in ("COOL_FLAME", "COOL_FLAME_WEAKENING")
            row["_is_extinguished"] = phase == "EXTINGUISHED"

            # Flame diameter for 3D (mm) - may be 0 for cool flame
            fd = row.get("flame_diam_mm", 0) or 0
            row["_flame_diameter_mm"] = fd if fd > 0 else (d * 0.5 if row.get("_has_cool_flame") else 0)

        elif investigation_type == "SOLID_MATERIAL_COMBUSTION":
            phase = str(row.get("phase", "")).upper()
            row["_has_flame"] = "SPREAD" in phase or "IGNIT" in phase or "PEAK" in phase
            row["_spread_rate_norm"] = min(1.0, (row.get("spread_rate_cm_s", 0) or 0) / 0.10)
            row["_flame_length_norm"] = min(1.0, (row.get("flame_length_mm", 0) or 0) / 12.5)

        elif investigation_type == "LARGE_SCALE_SPACECRAFT_FIRE":
            fl = row.get("flame_length_cm", 0) or 0
            fw = row.get("flame_width_cm", 0) or 0
            row["_flame_area_cm2"] = fl * fw
            row["_has_flame"] = row.get("flame_exists", False)

    return rows


# ─── Chunked / Windowed Data ──────────────────────────────────────────────────

def get_timeseries_at_time(experiment_id: str, time_s: float) -> Optional[Dict]:
    """
    Get the interpolated measurement state at a specific time.
    Returns interpolated values between the two nearest recorded points.
    """
    ts = load_experiment_timeseries(experiment_id)
    rows = ts.get("data", [])
    if not rows:
        return None

    # Find surrounding rows
    prev_row = rows[0]
    next_row = rows[-1]

    for i, row in enumerate(rows):
        t = row.get("time_s", 0)
        if t <= time_s:
            prev_row = row
        if t >= time_s:
            next_row = row
            break

    # Interpolate numeric fields
    t0 = prev_row.get("time_s", 0)
    t1 = next_row.get("time_s", 0)

    if t0 == t1:
        result = dict(prev_row)
    else:
        alpha = (time_s - t0) / (t1 - t0)
        result = {}
        for k in prev_row.keys():
            v0 = prev_row.get(k)
            v1 = next_row.get(k)
            if isinstance(v0, (int, float)) and isinstance(v1, (int, float)):
                result[k] = v0 + (v1 - v0) * alpha
            else:
                result[k] = prev_row.get(k)  # Use prev for non-numeric

    result["_interpolated"] = (t0 != t1)
    result["_query_time_s"] = time_s
    return result


def get_summary_statistics(experiment_id: str) -> Dict[str, Any]:
    """Compute summary statistics for an experiment's measurements."""
    ts = load_experiment_timeseries(experiment_id)
    rows = ts.get("data", [])
    meta = ts.get("metadata", {})
    investigation_type = meta.get("investigation_type", "")

    if not rows:
        return {"error": "No data available"}

    stats = {
        "experiment_id": experiment_id,
        "investigation_type": investigation_type,
        "total_rows": len(rows),
        "duration_s": rows[-1].get("time_s", 0) if rows else 0,
    }

    if investigation_type == "DROPLET_COMBUSTION":
        hot_rows = [r for r in rows if r.get("_has_hot_flame")]
        cool_rows = [r for r in rows if r.get("_has_cool_flame")]
        d_values = [r["D_mm"] for r in rows if isinstance(r.get("D_mm"), (int, float))]
        d2_values = [r["D2_mm2"] for r in rows if isinstance(r.get("D2_mm2"), (int, float))]
        k_values = [r["burn_rate_K_mm2_s"] for r in rows if isinstance(r.get("burn_rate_K_mm2_s"), (int, float)) and r.get("burn_rate_K_mm2_s", 0) > 0]

        # Hot flame K-value (D² burning rate constant)
        hot_k_values = [r["burn_rate_K_mm2_s"] for r in hot_rows if isinstance(r.get("burn_rate_K_mm2_s"), (int, float)) and r.get("burn_rate_K_mm2_s", 0) > 0]

        stats.update({
            "initial_diameter_mm": d_values[0] if d_values else None,
            "final_diameter_mm": d_values[-1] if d_values else None,
            "hot_flame_duration_s": hot_rows[-1].get("time_s", 0) - hot_rows[0].get("time_s", 0) if hot_rows else 0,
            "cool_flame_duration_s": cool_rows[-1].get("time_s", 0) - cool_rows[0].get("time_s", 0) if cool_rows else 0,
            "hot_flame_K_mm2_s": sum(hot_k_values) / len(hot_k_values) if hot_k_values else 0,
            "cool_flame_K_mm2_s": None,
            "has_cool_flame": len(cool_rows) > 0,
            "has_hot_flame": len(hot_rows) > 0,
        })

    elif investigation_type == "SOLID_MATERIAL_COMBUSTION":
        spread_values = [r["spread_rate_cm_s"] for r in rows if isinstance(r.get("spread_rate_cm_s"), (int, float))]
        fl_values = [r["flame_length_mm"] for r in rows if isinstance(r.get("flame_length_mm"), (int, float))]
        steady = [r for r in rows if "STEADY" in str(r.get("phase", "")).upper()]
        pos_values = [r["flame_pos_mm"] for r in rows if isinstance(r.get("flame_pos_mm"), (int, float))]

        stats.update({
            "max_spread_rate_cm_s": max(spread_values) if spread_values else None,
            "mean_steady_spread_rate_cm_s": sum(r.get("spread_rate_cm_s", 0) for r in steady) / len(steady) if steady else None,
            "max_flame_length_mm": max(fl_values) if fl_values else None,
            "total_burn_length_mm": max(pos_values) if pos_values else None,
        })

    elif investigation_type == "LARGE_SCALE_SPACECRAFT_FIRE":
        fl_values = [r["flame_length_cm"] for r in rows if isinstance(r.get("flame_length_cm"), (int, float))]
        temp_values = [r["peak_temp_K"] for r in rows if isinstance(r.get("peak_temp_K"), (int, float))]
        spread_values = [r["spread_rate_cm_s"] for r in rows if isinstance(r.get("spread_rate_cm_s"), (int, float))]
        pos_values = [r["flame_pos_cm"] for r in rows if isinstance(r.get("flame_pos_cm"), (int, float))]
        power_values = [r["flame_power_W"] for r in rows if isinstance(r.get("flame_power_W"), (int, float))]

        stats.update({
            "max_flame_length_cm": max(fl_values) if fl_values else None,
            "max_temperature_K": max(temp_values) if temp_values else None,
            "burn_duration_s": rows[-1].get("time_s", 0),
            "steady_spread_rate_cm_s": max(spread_values) if spread_values else None,
            "total_burn_length_cm": max(pos_values) if pos_values else None,
            "mean_flame_power_W": sum(power_values) / len(power_values) if power_values else None,
        })

    return stats
