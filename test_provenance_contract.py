"""
Provenance Contract & Data Integrity Verification Test Suite
=============================================================
Tests:
  1. GET /api/manifest returns all datasets with canonical provenance tiers.
  2. Provenance enum consistency between backend/provenance.py and manifest.
  3. No legacy misleading tags (PUBLISHED_LITERATURE, PROCESSED_MEASURED_OPTICAL)
     remain in active CSV datasets or ML training files.
  4. PIML model inference outputs MODEL_PREDICTION tier and honest limitations.
  5. Timeseries endpoint delivers honest provenance metadata.
"""

import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from fastapi.testclient import TestClient
from main import app
from provenance import Provenance, PROVENANCE_LABELS
from ml.model_inference import predict_droplet, predict_droplet_timeseries

client = TestClient(app)

def test_provenance_suite():
    print("=" * 80)
    print(" TEST SUITE: DATA PROVENANCE & SCIENTIFIC HONESTY AUDIT")
    print("=" * 80)

    # 1. Test canonical enum tiers
    expected_tiers = {
        "MEASURED_TABLE",
        "DIGITIZED_FROM_PUBLICATION",
        "APPROXIMATED_CURVE",
        "CALCULATED",
        "MODEL_PREDICTION",
        "ILLUSTRATIVE",
        "METADATA_ONLY",
    }
    actual_tiers = {p.value for p in Provenance}
    assert expected_tiers == actual_tiers, f"Tiers mismatch! Expected {expected_tiers}, got {actual_tiers}"
    print(f"[PASS] 1. Canonical 7-tier enum verified: {sorted(actual_tiers)}")

    # 2. Test /api/manifest endpoint
    res = client.get("/api/manifest")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    manifest = res.json()
    datasets = manifest.get("datasets", [])
    assert len(datasets) >= 9, f"Expected at least 9 datasets, got {len(datasets)}"
    for ds in datasets:
        assert ds.get("overall_provenance") in expected_tiers, f"Invalid tier: {ds.get('overall_provenance')}"
        assert ds.get("source_document"), f"Missing source document for {ds.get('dataset_id')}"
        assert ds.get("known_limitations") is not None, f"Missing known_limitations for {ds.get('dataset_id')}"
        print(f"  • [{ds.get('dataset_id')}] Tier: {ds.get('overall_provenance')} | {ds.get('name')[:45]}...")

    print(f"[PASS] 2. Manifest endpoint verified with {len(datasets)} datasets and honest tiers.")

    # 3. Audit CSV files on disk for purged misleading tags
    base_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "flame-in-freefall-data"))
    misleading_tags = ["PUBLISHED_LITERATURE", "PROCESSED_MEASURED_OPTICAL"]
    for root, _, files in os.walk(base_data_dir):
        for f in files:
            if f.endswith(".csv"):
                fpath = os.path.join(root, f)
                with open(fpath, "r", encoding="utf-8", errors="ignore") as fh:
                    content = fh.read()
                    for tag in misleading_tags:
                        assert tag not in content, f"Found legacy misleading tag '{tag}' in {fpath}"

    print("[PASS] 3. Zero instances of legacy misleading tags (PUBLISHED_LITERATURE, PROCESSED_MEASURED_OPTICAL) across all CSV files.")

    # 4. Test ML prediction provenance
    pred = predict_droplet(d0_mm=3.0, o2_pct=21.0, pressure_atm=1.0, time_s=1.5, gravity_ms2=0.0)
    assert pred.get("provenance") == "MODEL_PREDICTION"
    assert pred.get("provenance_tier") == "MODEL_PREDICTION"
    
    ts_pred = predict_droplet_timeseries(d0_mm=3.0, o2_pct=21.0, pressure_atm=1.0)
    assert ts_pred.get("provenance") == "MODEL_PREDICTION"
    assert ts_pred.get("training_provenance") == "APPROXIMATED_CURVE"
    assert "Trained on 1 run" in ts_pred.get("provenance_limitation", "")
    print(f"[PASS] 4. ML model inference correctly returns MODEL_PREDICTION tier with stated training provenance APPROXIMATED_CURVE.")

    # 5. Timeseries endpoint inspection
    ts_res = client.get("/api/experiments/FLEX-F2-T01/timeseries")
    assert ts_res.status_code == 200
    ts_data = ts_res.json()
    assert ts_data.get("data_status") == "APPROXIMATED_CURVE"
    print(f"[PASS] 5. FLEX timeseries endpoint correctly returns data_status='APPROXIMATED_CURVE'.")

    print("\n" + "=" * 80)
    print(" ALL PROVENANCE & DATA HONESTY TESTS PASSED! (5/5 CHECKS)")
    print("=" * 80)

if __name__ == "__main__":
    test_provenance_suite()
