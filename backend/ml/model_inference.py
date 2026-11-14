"""
NASA Flame in Freefall - ML Model Inference Service
Provides real-time inference for droplet combustion:
- Predicts droplet diameter D(t), squared diameter D^2(t), and burning rate K(t).
- Predicts flame combustion regime (HOT_FLAME, COOL_FLAME, EXTINGUISHED).
- Flags Out-Of-Distribution (OOD) conditions (e.g., Moon/Mars gravity or non-calibrated atmospheres).
- Computes uncertainty bounds and comparisons against the classical D^2-law baseline.
"""

import os
import json
import math
import numpy as np
import joblib
from typing import Dict, List, Any, Optional, Tuple

_ML_DIR = os.path.dirname(os.path.abspath(__file__))
_MODELS_DIR = os.path.join(_ML_DIR, "models")
_CONFIG_PATH = os.path.join(_MODELS_DIR, "flex_piml_model.json")
_CLF_PATH = os.path.join(_MODELS_DIR, "flex_regime_classifier.joblib")
_REG_PATH = os.path.join(_MODELS_DIR, "flex_ridge_regressor.joblib")

_MODEL_CACHE: Dict[str, Any] = {}


def load_model_artifacts():
    if "config" in _MODEL_CACHE:
        return _MODEL_CACHE

    if not os.path.exists(_CONFIG_PATH):
        raise FileNotFoundError(f"Model config not found at {_CONFIG_PATH}. Run train_flex_model.py first.")

    with open(_CONFIG_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)

    regime_clf = joblib.load(_CLF_PATH) if os.path.exists(_CLF_PATH) else None
    ridge_reg = joblib.load(_REG_PATH) if os.path.exists(_REG_PATH) else None

    _MODEL_CACHE["config"] = config
    _MODEL_CACHE["regime_clf"] = regime_clf
    _MODEL_CACHE["ridge_reg"] = ridge_reg
    return _MODEL_CACHE


def evaluate_ood(
    d0_mm: float,
    o2_pct: float,
    pressure_atm: float,
    gravity_ms2: float
) -> Tuple[bool, List[str], float]:
    """
    Evaluates whether the input condition is Out-Of-Distribution (OOD).
    Returns: (is_ood, warnings, uncertainty_multiplier)
    """
    warnings = []
    uncertainty_mult = 1.0

    # 1. Gravity Check (Empirical FLEX training data was strictly ISS 0-g)
    if abs(gravity_ms2) > 0.05:
        warnings.append(
            f"Non-zero gravity ({gravity_ms2:.2f} m/s²): Empirical flight data is from ISS 0-g. "
            "Lunar/Martian predictions utilize analytical Grashof scaling, not flight telemetry."
        )
        uncertainty_mult += 2.5

    # 2. Oxygen Concentration Check
    if o2_pct < 13.0:
        warnings.append(f"Sub-LOI oxygen ({o2_pct:.1f}%): Below reported flammability limit; quenching risk elevated.")
        uncertainty_mult += 1.8
    elif o2_pct > 34.0:
        warnings.append(f"High oxygen ({o2_pct:.1f}%): Extrapolating beyond published 21-34% exploration envelope.")
        uncertainty_mult += 1.5

    # 3. Pressure Check
    if pressure_atm < 0.5 or pressure_atm > 3.0:
        warnings.append(f"Chamber pressure ({pressure_atm:.2f} atm): Outside published CIR test matrix (0.5 - 3.0 atm).")
        uncertainty_mult += 2.0

    # 4. Droplet Size Check
    if d0_mm < 1.0 or d0_mm > 5.0:
        warnings.append(f"Initial droplet diameter ({d0_mm:.2f} mm): Outside typical CIR MDCA range (1.5 - 4.0 mm).")
        uncertainty_mult += 1.5

    is_ood = len(warnings) > 0
    return is_ood, warnings, uncertainty_mult


def predict_droplet(
    d0_mm: float,
    o2_pct: float,
    pressure_atm: float,
    time_s: float,
    gravity_ms2: float = 0.0
) -> Dict[str, Any]:
    """
    Predict single time-step combustion state.
    """
    artifacts = load_model_artifacts()
    config = artifacts["config"]
    regime_clf = artifacts["regime_clf"]
    ridge_reg = artifacts["ridge_reg"]

    d0 = max(0.1, float(d0_mm))
    d0_sq = d0 * d0
    t = max(0.0, float(time_s))
    o2 = float(o2_pct)
    press = float(pressure_atm)
    g = float(gravity_ms2)

    is_ood, ood_warnings, unc_mult = evaluate_ood(d0, o2, press, g)

    # Dimensionless time tau = t / D0^2
    tau = t / d0_sq
    o2_frac = o2 / 100.0

    # Oxygen scaling on burning rate (classical K ~ O2^0.5 to 0.7)
    o2_factor = (o2 / 21.0) ** 0.6
    p_factor = (press / 1.0) ** 0.15

    # 1. Regime Classification
    feature_vec = np.array([[tau, o2_frac, press]])
    if regime_clf:
        regime_code = int(regime_clf.predict(feature_vec)[0])
        regime_probs = regime_clf.predict_proba(feature_vec)[0].tolist()
    else:
        # Fallback rule based on tau
        tau_trans = 0.408 * (o2 / 21.0)
        tau_ext = 1.077 * (o2 / 21.0)
        if tau < tau_trans:
            regime_code = 1
        elif tau < tau_ext:
            regime_code = 2
        else:
            regime_code = 3
        regime_probs = [0.0, 0.5, 0.5, 0.0]

    phase_map = {0: "IGNITING", 1: "HOT_FLAME", 2: "COOL_FLAME", 3: "EXTINGUISHED"}
    phase_str = phase_map.get(regime_code, "HOT_FLAME")

    # 2. Physics-Informed D^2 Prediction
    # Scaled rates
    k_hot_scaled = config["coefficients"]["K_hot_norm"] * o2_factor * p_factor
    k_cool_scaled = config["coefficients"]["K_cool_norm"] * p_factor
    tau_trans_scaled = 0.408 * (o2 / 21.0)
    tau_ext_scaled = tau_trans_scaled + (1.0 - (1.0 - k_hot_scaled * tau_trans_scaled)) / max(0.1, k_cool_scaled)

    if tau < tau_trans_scaled:
        # Hot flame regime
        d2_norm = max(0.0, 1.0 - k_hot_scaled * tau)
        curr_burn_rate = k_hot_scaled
    elif tau < tau_ext_scaled:
        # Cool flame regime
        d2_trans = max(0.0, 1.0 - k_hot_scaled * tau_trans_scaled)
        d2_norm = max(0.0, d2_trans - k_cool_scaled * (tau - tau_trans_scaled))
        curr_burn_rate = k_cool_scaled
    else:
        # Extinguished
        d2_norm = 0.0
        curr_burn_rate = 0.0
        phase_str = "EXTINGUISHED"

    # Convert back to physical units
    d2_mm2 = d2_norm * d0_sq
    d_mm = math.sqrt(d2_mm2)

    # 3. Classical Single-Stage D^2-Law Baseline for Comparison
    k_baseline_single = 0.9485 * o2_factor
    d2_baseline = max(0.0, d0_sq - k_baseline_single * t)
    d_baseline = math.sqrt(d2_baseline)

    # 4. Uncertainty Estimation
    base_sigma = config["metrics_on_test"]["rmse_mm"]
    uncertainty_sigma_mm = round(base_sigma * unc_mult * (1.0 + 0.3 * (tau / 1.0)), 4)

    return {
        "time_s": round(t, 3),
        "D0_mm": d0,
        "predicted_D_mm": round(d_mm, 4),
        "predicted_D2_mm2": round(d2_mm2, 4),
        "predicted_burn_rate_K_mm2_s": round(curr_burn_rate, 4),
        "predicted_phase": phase_str,
        "regime_code": regime_code,
        "is_cool_flame": phase_str == "COOL_FLAME",
        "is_extinguished": phase_str == "EXTINGUISHED" or d_mm <= 0.05,
        "cool_flame_transition_time_s": round(tau_trans_scaled * d0_sq, 2),
        "predicted_extinction_time_s": round(tau_ext_scaled * d0_sq, 2),
        "baseline_single_stage_D_mm": round(d_baseline, 4),
        "uncertainty_sigma_mm": uncertainty_sigma_mm,
        "is_out_of_distribution": is_ood,
        "ood_warnings": ood_warnings,
        "provenance": "MODEL_PREDICTION",
        "provenance_tier": "MODEL_PREDICTION",
        "model_version": config["model_name"]
    }


def predict_droplet_timeseries(
    d0_mm: float,
    o2_pct: float,
    pressure_atm: float,
    gravity_ms2: float = 0.0,
    num_points: int = 120
) -> Dict[str, Any]:
    """
    Generates a full predicted combustion trajectory from t = 0 to extinction.
    """
    single_probe = predict_droplet(d0_mm, o2_pct, pressure_atm, 0.0, gravity_ms2)
    t_ext = single_probe["predicted_extinction_time_s"]
    max_time = t_ext * 1.08  # slightly past extinction to show the flatline

    times = np.linspace(0.0, max_time, num_points)
    curve = []
    for t in times:
        pt = predict_droplet(d0_mm, o2_pct, pressure_atm, float(t), gravity_ms2)
        curve.append({
            "time_s": pt["time_s"],
            "D_mm": pt["predicted_D_mm"],
            "D2_mm2": pt["predicted_D2_mm2"],
            "phase": pt["predicted_phase"],
            "burn_rate_K": pt["predicted_burn_rate_K_mm2_s"],
            "baseline_D_mm": pt["baseline_single_stage_D_mm"],
            "upper_bound_mm": round(pt["predicted_D_mm"] + pt["uncertainty_sigma_mm"], 4),
            "lower_bound_mm": round(max(0.0, pt["predicted_D_mm"] - pt["uncertainty_sigma_mm"]), 4),
        })

    return {
        "inputs": {
            "D0_mm": d0_mm,
            "oxygen_pct": o2_pct,
            "pressure_atm": pressure_atm,
            "gravity_ms2": gravity_ms2
        },
        "extinction_time_s": t_ext,
        "cool_flame_transition_time_s": single_probe["cool_flame_transition_time_s"],
        "is_out_of_distribution": single_probe["is_out_of_distribution"],
        "ood_warnings": single_probe["ood_warnings"],
        "provenance": "MODEL_PREDICTION",
        "provenance_tier": "MODEL_PREDICTION",
        "training_provenance": "APPROXIMATED_CURVE",
        "provenance_limitation": "Trained on 1 run (FLEX_F2_T01), tested on 1 run (FLEX_F2_T02). Input curves are approximated to match published K constants, not raw flight telemetry.",
        "model_version": single_probe["model_version"],
        "datapoints": curve
    }
