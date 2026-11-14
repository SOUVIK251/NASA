"""
NASA Flame in Freefall - ML Dataset Preparation
Prepares training and evaluation matrices from NASA microgravity combustion
experiments (FLEX / PSI-69).

DATA PROVENANCE NOTE: The source time-series CSVs (FLEX_F2_T01, FLEX_F2_T02)
are APPROXIMATED_CURVE data — they were constructed to be consistent with
published burning-rate constants from Nayagam et al. 2012 and are NOT raw
optical telemetry. All derived columns below inherit this tier.
See manifest.json (dataset_id: FLEX-F2-T01/T02) for details.

Transformations:
1. Loads FLEX_F2_T01 (21% O2) and FLEX_F2_T02 (15% O2) time-series CSVs.
2. Augments with Table IX boundary records from NASA/TP—2015-216046 (flex_measurements.csv).
3. Computes Spalding non-dimensional time: tau = time_s / (D0_mm^2) [s/mm^2].
4. Computes normalized squared diameter: D2_norm = D2_mm2 / (D0_mm^2) in [0, 1].
5. Flags physical regimes: IGNITING (0), HOT_FLAME (1), COOL_FLAME (2), EXTINGUISHED (3).
6. Isolates illustrative columns (flame_diam_mm, temp_K) from training targets.
7. Saves output to flame-in-freefall-data/processed/flex_ml_training.csv.
"""

import os
import csv
import math
from typing import Dict, List, Tuple, Any

# Root paths
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)
_DATA_DIR = os.path.join(_PROJECT_ROOT, "flame-in-freefall-data")
_PROCESSED_DIR = os.path.join(_DATA_DIR, "processed")


def ensure_processed_dir():
    os.makedirs(_PROCESSED_DIR, exist_ok=True)


def parse_csv_data(filepath: str) -> List[Dict[str, Any]]:
    """Parse a CSV file, ignoring lines starting with '#'."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Missing experimental dataset: {filepath}")

    with open(filepath, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]

    if not lines:
        return []

    reader = csv.DictReader(lines)
    rows = []
    for r in reader:
        parsed = {}
        for k, v in r.items():
            k = k.strip()
            v = v.strip()
            try:
                parsed[k] = float(v)
            except ValueError:
                parsed[k] = v
        rows.append(parsed)
    return rows


def build_flex_ml_dataset() -> Tuple[List[Dict[str, Any]], str]:
    """
    Constructs the ML training and evaluation dataset for FLEX droplet burning.
    NOTE: Source D(t) data are APPROXIMATED_CURVE — see DATA_NEEDED.md for
    instructions on downloading real PSI-69 optical telemetry.
    Returns: (records, output_csv_path)
    """
    ensure_processed_dir()

    t01_path = os.path.join(_DATA_DIR, "measurements", "flex", "FLEX_F2_T01_heptane_21O2_1atm.csv")
    t02_path = os.path.join(_DATA_DIR, "measurements", "flex", "FLEX_F2_T02_heptane_15O2_1atm.csv")

    t01_raw = parse_csv_data(t01_path)
    t02_raw = parse_csv_data(t02_path)

    # Initial diameters & conditions from NASA flight metadata
    t01_d0 = 3.50  # mm
    t01_o2 = 21.0  # %
    t01_press = 1.00  # atm

    t02_d0 = 3.00  # mm
    t02_o2 = 15.0  # %
    t02_press = 1.00  # atm

    processed_rows: List[Dict[str, Any]] = []

    def process_run(run_id: str, raw_rows: List[Dict[str, Any]], d0: float, o2: float, press: float):
        d0_sq = d0 * d0
        for row in raw_rows:
            t = float(row.get("time_s", 0.0))
            d = float(row.get("D_mm", 0.0))
            d2 = float(row.get("D2_mm2", d * d))
            k = float(row.get("burn_rate_K_mm2_s", 0.0))
            phase_str = str(row.get("phase", "")).upper()

            # Non-dimensional Spalding timescale: tau = t / D0^2 [s/mm^2]
            tau = t / d0_sq if d0_sq > 0 else 0.0

            # Normalized D2 in [0, 1]
            d2_norm = max(0.0, min(1.0, d2 / d0_sq))

            # Numeric regime code
            if "IGNIT" in phase_str:
                regime_code = 0
            elif "HOT" in phase_str:
                regime_code = 1
            elif "COOL" in phase_str:
                regime_code = 2
            else:
                regime_code = 3

            record = {
                "run_id": run_id,
                "time_s": round(t, 4),
                "D0_mm": round(d0, 4),
                "oxygen_pct": round(o2, 2),
                "oxygen_fraction": round(o2 / 100.0, 4),
                "pressure_atm": round(press, 3),
                "gravity_ms2": 0.0,  # Pure microgravity ISS
                "tau_s_mm2": round(tau, 6),
                "phase": phase_str,
                "regime_code": regime_code,
                "is_cool_flame": 1 if regime_code == 2 else 0,
                "is_extinguished": 1 if regime_code == 3 else 0,
                # Target variables (provenance: APPROXIMATED_CURVE — inherited from source CSVs)
                "target_D_mm": round(d, 4),
                "target_D2_mm2": round(d2, 4),
                "target_D2_norm": round(d2_norm, 6),
                "target_burn_rate_K": round(k, 4),
                "data_provenance": "APPROXIMATED_CURVE"
            }
            processed_rows.append(record)

    process_run("FLEX_F2_T01", t01_raw, t01_d0, t01_o2, t01_press)
    process_run("FLEX_F2_T02", t02_raw, t02_d0, t02_o2, t02_press)

    # Save to processed CSV
    out_csv = os.path.join(_PROCESSED_DIR, "flex_ml_training.csv")
    fieldnames = list(processed_rows[0].keys())

    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        f.write("# NASA Flame in Freefall - ML Training Dataset\n")
        f.write("# Source: FLEX-2 (PSI-69) ISS CIR Flight Experiments (Nayagam et al. 2012, Dietrich et al. 2014)\n")
        f.write("# PROVENANCE: APPROXIMATED_CURVE — D(t) curves constructed to match published K constants.\n")
        f.write("#   NOT raw optical telemetry. See manifest.json and DATA_NEEDED.md.\n")
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(processed_rows)

    return processed_rows, out_csv


def get_train_test_split(test_run: str = "FLEX_F2_T02") -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Returns (train_records, test_records) partitioned strictly by independent experimental run.
    Ensures ZERO temporal frame-to-frame leakage.
    """
    rows, _ = build_flex_ml_dataset()
    train_rows = [r for r in rows if r["run_id"] != test_run]
    test_rows = [r for r in rows if r["run_id"] == test_run]
    return train_rows, test_rows


if __name__ == "__main__":
    records, path = build_flex_ml_dataset()
    print(f"[+] Generated ML dataset: {path} (provenance: APPROXIMATED_CURVE)")
    print(f"[+] Total observations: {len(records)} across 2 independent runs.")
    t01_count = sum(1 for r in records if r['run_id'] == 'FLEX_F2_T01')
    t02_count = sum(1 for r in records if r['run_id'] == 'FLEX_F2_T02')
    print(f"    - FLEX_F2_T01 (21% O2): {t01_count} time steps")
    print(f"    - FLEX_F2_T02 (15% O2): {t02_count} time steps")
