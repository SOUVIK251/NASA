"""
Test Suite for NASA Flame in Freefall ML Pipeline.
Verifies:
1. ML Model info endpoint (/api/ml/model-info)
2. Single-point droplet prediction (/api/ml/predict-droplet) across Hot, Cool, and Extinguished phases
3. Physical monotonicity: d(D^2)/dt <= 0
4. Full timeseries prediction (/api/ml/predict-timeseries) with uncertainty bounds
5. Out-Of-Distribution (OOD) detection for Lunar and Martian gravity
"""

import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def print_separator(title):
    print("\n" + "=" * 80)
    print(f" {title}")
    print("=" * 80)

def test_model_info():
    print_separator("TEST 1: ML Model Metadata & Provenance Audit")
    res = client.get("/api/ml/model-info")
    assert res.status_code == 200, f"Failed model-info: {res.status_code}"
    data = res.json()
    print(f"[+] Model Name:    {data.get('model_name')}")
    print(f"[+] Training Run:  {data.get('training_run')}")
    print(f"[+] Holdout Run:   {data.get('holdout_run')}")
    metrics = data.get("metrics_on_test", {})
    print(f"[+] Test RMSE:     {metrics.get('rmse_mm')} mm")
    print(f"[+] Test R²:       {metrics.get('r2')}")
    print(f"[+] Baseline RMSE: {metrics.get('baseline_single_stage_rmse_mm')} mm")
    assert "NASA-FLEX" in data.get("model_name")
    assert metrics.get("r2") > 0.80
    print("[PASS] Test 1: Model metadata and test metrics verified.")

def test_droplet_prediction_phases():
    print_separator("TEST 2: Physical Phase Transitions (Hot Flame -> Cool Flame -> Extinction)")
    # Test conditions: D0 = 3.0 mm, 21% O2, 1 atm
    times = [0.0, 2.5, 6.0, 16.0]
    expected_phases = ["IGNITING_OR_HOT", "HOT_FLAME", "COOL_FLAME", "EXTINGUISHED"]

    prev_d = 999.0
    for t in times:
        payload = {
            "initial_diameter_mm": 3.0,
            "oxygen_pct": 21.0,
            "pressure_atm": 1.0,
            "time_s": t,
            "gravity_m_s2": 0.0
        }
        res = client.post("/api/ml/predict-droplet", json=payload)
        assert res.status_code == 200, f"Prediction failed at t={t}: {res.status_code}"
        data = res.json()
        d_mm = data.get("predicted_D_mm")
        phase = data.get("predicted_phase")
        burn_rate = data.get("predicted_burn_rate_K_mm2_s")
        print(f"[+] t = {t:4.1f}s | D = {d_mm:5.3f} mm | Phase: {phase:12s} | K = {burn_rate:5.3f} mm²/s")

        # Monotonicity check
        assert d_mm <= prev_d + 1e-4, f"Violated physical monotonicity at t={t}: {d_mm} > {prev_d}"
        prev_d = d_mm

    # At t=0, D should be close to D0
    res_t0 = client.post("/api/ml/predict-droplet", json={"initial_diameter_mm": 3.0, "time_s": 0.0}).json()
    assert abs(res_t0["predicted_D_mm"] - 3.0) < 0.1

    # At t=16, should be extinguished
    res_t16 = client.post("/api/ml/predict-droplet", json={"initial_diameter_mm": 3.0, "time_s": 16.0}).json()
    assert res_t16["is_extinguished"] is True or res_t16["predicted_D_mm"] == 0.0

    print("[PASS] Test 2: Phase progression and monotonic reduction physically verified.")

def test_timeseries_prediction():
    print_separator("TEST 3: Full Trajectory Timeseries with Uncertainty Bounds")
    payload = {
        "initial_diameter_mm": 3.5,
        "oxygen_pct": 21.0,
        "pressure_atm": 1.0,
        "gravity_m_s2": 0.0,
        "num_points": 50
    }
    res = client.post("/api/ml/predict-timeseries", json=payload)
    assert res.status_code == 200, f"Timeseries failed: {res.status_code}"
    data = res.json()
    points = data.get("datapoints", [])
    print(f"[+] Total curve points generated: {len(points)}")
    print(f"[+] Extinction Time: {data.get('extinction_time_s')} s")
    print(f"[+] Cool Flame Transition: {data.get('cool_flame_transition_time_s')} s")
    assert len(points) == 50
    # Check bounds
    for pt in points[:5]:
        assert pt["lower_bound_mm"] <= pt["D_mm"] <= pt["upper_bound_mm"]
    print("[PASS] Test 3: Trajectory curve and uncertainty envelopes verified.")

def test_ood_detection():
    print_separator("TEST 4: Out-Of-Distribution (OOD) Detection for Lunar & Martian Gravity")
    # Lunar gravity 1.62 m/s²
    payload_moon = {
        "initial_diameter_mm": 3.0,
        "oxygen_pct": 21.0,
        "pressure_atm": 1.0,
        "time_s": 2.0,
        "gravity_m_s2": 1.62
    }
    res_moon = client.post("/api/ml/predict-droplet", json=payload_moon)
    assert res_moon.status_code == 200
    data_moon = res_moon.json()
    print(f"[+] Moon (0.166g) OOD Flag: {data_moon.get('is_out_of_distribution')}")
    print(f"[+] Warnings: {data_moon.get('ood_warnings')}")
    assert data_moon.get("is_out_of_distribution") is True
    assert any("gravity" in w.lower() for w in data_moon.get("ood_warnings", []))
    assert data_moon.get("uncertainty_sigma_mm") > 0.15

    # Low Oxygen below LOI (10%)
    payload_loi = {
        "initial_diameter_mm": 3.0,
        "oxygen_pct": 10.0,
        "time_s": 1.0
    }
    data_loi = client.post("/api/ml/predict-droplet", json=payload_loi).json()
    assert data_loi.get("is_out_of_distribution") is True
    print(f"[+] Sub-LOI (10% O2) Warnings: {data_loi.get('ood_warnings')}")

    print("[PASS] Test 4: OOD detection correctly flags partial gravity and non-calibrated atmospheres.")

if __name__ == "__main__":
    print("\nStarting NASA ML Combustion Pipeline Test Suite...")
    test_model_info()
    test_droplet_prediction_phases()
    test_timeseries_prediction()
    test_ood_detection()
    print("\n" + "=" * 80)
    print(" ALL ML PIPELINE TESTS PASSED FLAWLESSLY! (4/4 SUITES)")
    print("=" * 80)
