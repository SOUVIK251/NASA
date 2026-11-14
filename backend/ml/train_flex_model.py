"""
NASA Flame in Freefall - Physics-Informed ML (PIML) Training Pipeline
Trains a Two-Stage Physics-Informed model on FLEX-2 time-series data:
1. Stage 1: Regime Transition Classifier (Hot Flame -> Cool Flame -> Extinction)
2. Stage 2: Spalding Non-Dimensional Diameter Regressor with Physical Monotonicity Constraints
3. Benchmarks against classical D^2-law physics baselines on independent holdout test run.

PROVENANCE NOTE: Training data (FLEX_F2_T01) and test data (FLEX_F2_T02) are
APPROXIMATED_CURVE — constructed to match published burning-rate constants, not
raw CIR optical telemetry. Model metrics reflect fit to these constructed curves.
See manifest.json and DATA_NEEDED.md.
"""

import os
import sys
import json
import math
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
import joblib

from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Add backend directory to sys.path
_ML_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_ML_DIR)
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from ml.dataset_preparer import build_flex_ml_dataset, get_train_test_split

_MODELS_DIR = os.path.join(_ML_DIR, "models")
os.makedirs(_MODELS_DIR, exist_ok=True)


def train_piml_model():
    print("=" * 80)
    print(" TRAINING NASA FLEX PHYSICS-INFORMED ML (PIML) MODEL")
    print("=" * 80)

    # 1. Load leakage-free train/test split partitioned strictly by independent test runs
    train_records, test_records = get_train_test_split(test_run="FLEX_F2_T02")
    df_train = pd.DataFrame(train_records)
    df_test = pd.DataFrame(test_records)

    print(f"[+] Training Set:   Run '{df_train['run_id'].iloc[0]}' ({len(df_train)} observations, 21% O2, D0=3.5mm) [APPROXIMATED_CURVE]")
    print(f"[+] Holdout Test Set: Run '{df_test['run_id'].iloc[0]}' ({len(df_test)} observations, 15% O2, D0=3.0mm) [APPROXIMATED_CURVE]")
    print("[!] PROVENANCE: D(t) data are approximated curves consistent with published K constants.")
    print("    Metrics reflect fit to these curves, not raw optical telemetry variability.\n")

    # Features: tau = t / D0^2, oxygen_fraction, pressure_atm
    feature_cols = ["tau_s_mm2", "oxygen_fraction", "pressure_atm"]

    X_train = df_train[feature_cols].values
    y_regime_train = df_train["regime_code"].values  # 0: Igniting, 1: Hot, 2: Cool, 3: Extinguished
    y_d2_norm_train = df_train["target_D2_norm"].values

    X_test = df_test[feature_cols].values
    y_regime_test = df_test["regime_code"].values
    y_d2_norm_test = df_test["target_D2_norm"].values
    y_d_test = df_test["target_D_mm"].values
    d0_test = df_test["D0_mm"].iloc[0]

    # ─────────────────────────────────────────────────────────────────
    # STAGE 1: REGIME CLASSIFIER (Predicts Hot vs. Cool Flame vs. Extinction)
    # ─────────────────────────────────────────────────────────────────
    print("[+] Training Stage 1: Regime Transition Classifier...")
    regime_clf = GradientBoostingClassifier(
        n_estimators=60,
        learning_rate=0.1,
        max_depth=3,
        random_state=42
    )
    regime_clf.fit(X_train, y_regime_train)

    # Transition points in non-dimensional time (tau)
    # In T01 (21% O2): Hot flame lasts up to t=5.0s -> tau_trans = 5.0 / 3.5^2 ≈ 0.408 s/mm^2
    # Extinction at t=13.2s -> tau_ext = 13.2 / 3.5^2 ≈ 1.077 s/mm^2
    hot_mask_train = (y_regime_train == 1)
    cool_mask_train = (y_regime_train == 2)

    # ─────────────────────────────────────────────────────────────────
    # STAGE 2: PHYSICS-INFORMED REGRESSOR (Spalding d^2 slope per regime)
    # ─────────────────────────────────────────────────────────────────
    print("[+] Training Stage 2: Spalding Non-Dimensional Burning Trajectory Regressor...")

    # Classical d^2 burning rate in non-dimensional space:
    # d(D^2/D0^2) / d(tau) = -K_eff
    # In hot flame: K_hot_eff = -d(D2_norm)/d(tau)
    tau_train = df_train["tau_s_mm2"].values
    d2_norm_train = df_train["target_D2_norm"].values

    # Fit linear slope in hot flame segment
    tau_hot = tau_train[hot_mask_train]
    d2_hot = d2_norm_train[hot_mask_train]
    slope_hot = np.polyfit(tau_hot, d2_hot, 1)[0]
    K_hot_norm = -slope_hot

    # Fit linear slope in cool flame segment
    tau_cool = tau_train[cool_mask_train]
    d2_cool = d2_norm_train[cool_mask_train]
    slope_cool = np.polyfit(tau_cool, d2_cool, 1)[0]
    K_cool_norm = -slope_cool

    # Also fit dynamic ridge polynomial for smooth curve blending
    tau_poly_train = np.column_stack([tau_train, tau_train**2, tau_train**3])
    ridge_reg = Ridge(alpha=0.01)
    ridge_reg.fit(tau_poly_train, d2_norm_train)

    print(f"    - Fitted Normalized Hot Flame Rate  K_hot_norm  = {K_hot_norm:.4f} (equiv K_hot ≈ {K_hot_norm:.2f} mm²/s)")
    print(f"    - Fitted Normalized Cool Flame Rate K_cool_norm = {K_cool_norm:.4f} (equiv K_cool ≈ {K_cool_norm:.2f} mm²/s)")

    # ─────────────────────────────────────────────────────────────────
    # PREDICTION FUNCTION WITH STRICT PHYSICAL MONOTONICITY
    # ─────────────────────────────────────────────────────────────────
    def predict_piml(X_eval, d0):
        preds_d2_norm = []
        preds_d_mm = []
        preds_regime = regime_clf.predict(X_eval)

        # Predict smooth polynomial values with monotonicity clipping
        poly_eval = np.column_stack([X_eval[:, 0], X_eval[:, 0]**2, X_eval[:, 0]**3])
        poly_d2_norm = ridge_reg.predict(poly_eval)

        curr_d2_norm = 1.0
        for i in range(len(X_eval)):
            tau = X_eval[i, 0]
            regime = preds_regime[i]

            val = poly_d2_norm[i]
            # Enforce physical constraints: D^2/D0^2 <= 1.0, monotonically non-increasing, >= 0.0
            val = min(curr_d2_norm, max(0.0, val))
            if regime == 3:  # Extinguished
                val = 0.0
            curr_d2_norm = val

            d_val = d0 * math.sqrt(val)
            preds_d2_norm.append(val)
            preds_d_mm.append(d_val)

        return np.array(preds_d_mm), np.array(preds_d2_norm), preds_regime

    # ─────────────────────────────────────────────────────────────────
    # EVALUATION ON UNSEEN TEST RUN (FLEX_F2_T02, 15% O2)
    # ─────────────────────────────────────────────────────────────────
    preds_d_test, preds_d2_norm_test, preds_regime_test = predict_piml(X_test, d0_test)

    # 1. Single-Stage Physics Baseline (Overall K = 0.9485 mm²/s from T01)
    t_test = df_test["time_s"].values
    baseline_single_d2 = np.maximum(0.0, d0_test**2 - 0.9485 * t_test)
    baseline_single_d = np.sqrt(baseline_single_d2)

    # 2. Two-Stage Piecewise Physics Baseline (K_hot=1.86, K_cool=0.35, trans at t=5.0s)
    baseline_two_stage_d2 = []
    t_trans = 5.0 * (15.0 / 21.0)  # simple linear O2 scaling estimate
    d2_trans = max(0.0, d0_test**2 - 1.86 * t_trans)
    for t in t_test:
        if t < t_trans:
            d2_val = max(0.0, d0_test**2 - 1.86 * t)
        else:
            d2_val = max(0.0, d2_trans - 0.40 * (t - t_trans))
        baseline_two_stage_d2.append(d2_val)
    baseline_two_stage_d = np.sqrt(np.array(baseline_two_stage_d2))

    # Compute Metrics on D [mm]
    rmse_piml = math.sqrt(mean_squared_error(y_d_test, preds_d_test))
    mae_piml = mean_absolute_error(y_d_test, preds_d_test)
    mape_piml = np.mean(np.abs((y_d_test - preds_d_test) / np.maximum(y_d_test, 1e-4))) * 100.0
    r2_piml = r2_score(y_d_test, preds_d_test)

    rmse_base1 = math.sqrt(mean_squared_error(y_d_test, baseline_single_d))
    r2_base1 = r2_score(y_d_test, baseline_single_d)

    rmse_base2 = math.sqrt(mean_squared_error(y_d_test, baseline_two_stage_d))
    r2_base2 = r2_score(y_d_test, baseline_two_stage_d)

    print("\n" + "=" * 80)
    print(" EVALUATION RESULTS ON INDEPENDENT HOLDOUT RUN (FLEX_F2_T02)")
    print("=" * 80)
    print(f" PIML Model Performance:")
    print(f"   • RMSE:  {rmse_piml:.4f} mm")
    print(f"   • MAE:   {mae_piml:.4f} mm")
    print(f"   • MAPE:  {mape_piml:.2f}%")
    print(f"   • R²:    {r2_piml:.4f}")
    print(f"\n Baseline Comparisons:")
    print(f"   • Single-Stage D² Law (K=0.95 mm²/s): RMSE = {rmse_base1:.4f} mm | R² = {r2_base1:.4f}")
    print(f"   • Two-Stage Classical D² Law:        RMSE = {rmse_base2:.4f} mm | R² = {r2_base2:.4f}")
    improvement_pct = ((rmse_base1 - rmse_piml) / rmse_base1) * 100.0
    print(f"   • PIML Error Reduction vs Single-Stage Baseline: {improvement_pct:.1f}%")

    # ─────────────────────────────────────────────────────────────────
    # SERIALIZE MODEL & ARTIFACTS
    # ─────────────────────────────────────────────────────────────────
    model_metadata = {
        "model_name": "NASA-FLEX-PIML-v1.0",
        "training_run": "FLEX_F2_T01 (Nayagam 2012, 21% O2)",
        "holdout_run": "FLEX_F2_T02 (15% O2)",
        "training_provenance": "APPROXIMATED_CURVE",
        "provenance_limitation": "Trained on 1 run (FLEX_F2_T01), tested on 1 run (FLEX_F2_T02). Input curves are approximated to match published K constants, not raw flight telemetry.",
        "features": feature_cols,
        "metrics_on_test": {
            "rmse_mm": round(rmse_piml, 4),
            "mae_mm": round(mae_piml, 4),
            "mape_pct": round(mape_piml, 2),
            "r2": round(r2_piml, 4),
            "baseline_single_stage_rmse_mm": round(rmse_base1, 4),
            "baseline_two_stage_rmse_mm": round(rmse_base2, 4)
        },
        "coefficients": {
            "K_hot_norm": round(K_hot_norm, 5),
            "K_cool_norm": round(K_cool_norm, 5),
            "ridge_coef": [round(float(c), 6) for c in ridge_reg.coef_],
            "ridge_intercept": round(float(ridge_reg.intercept_), 6)
        },
        "physics_bounds": {
            "min_o2_pct": 12.0,
            "max_o2_pct": 30.0,
            "min_pressure_atm": 0.5,
            "max_pressure_atm": 3.0,
            "nominal_gravity_ms2": 0.0
        }
    }

    # Save JSON metadata & lightweight coefficients
    json_path = os.path.join(_MODELS_DIR, "flex_piml_model.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)

    # Save trained sklearn models
    clf_path = os.path.join(_MODELS_DIR, "flex_regime_classifier.joblib")
    joblib.dump(regime_clf, clf_path)

    ridge_path = os.path.join(_MODELS_DIR, "flex_ridge_regressor.joblib")
    joblib.dump(ridge_reg, ridge_path)

    print(f"\n[+] Successfully saved model artifacts:")
    print(f"    - Config & Metrics: {json_path}")
    print(f"    - Classifier:       {clf_path}")
    print(f"    - Regressor:        {ridge_path}")

    return model_metadata


if __name__ == "__main__":
    train_piml_model()
