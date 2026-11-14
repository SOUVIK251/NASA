"""
Automated Test Suite for Spacecraft Fire Behaviour Analysis Module
===================================================================
Tests all 8 new backend endpoints, schema integrity, data classification tags,
and RAG question evaluation.
"""

import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api/fire-behaviour"

def test_endpoint(name, path, method="GET", body=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            assert res.status == 200, f"Expected 200, got {res.status}"
            content = json.loads(res.read().decode("utf-8"))
            print(f"  [PASS] {name} ({method} {path}) -> 200 OK")
            return content
    except Exception as e:
        print(f"  [FAIL] {name} ({method} {path}) -> {e}")
        sys.exit(1)

print("Starting Fire Behaviour Analysis Automated Test Suite...")

# 1. Overview
ov = test_endpoint("Overview Endpoint", "/overview")
assert len(ov["sections"]) == 6, "Expected 6 core sections"
assert "statistics" in ov, "Expected statistics"

# 2. Combustion Behaviour
cb = test_endpoint("Combustion Behaviour Endpoint", "/combustion-behaviour")
assert len(cb["comparisons"]) >= 5, "Expected >=5 physical comparisons"
assert len(cb["experimental_records"]) >= 3, "Expected >=3 flight records"
for rec in cb["experimental_records"]:
    assert rec["data_classification"] in [
        "VERIFIED_MEASURED", "PROCESSED_MEASURED", "PUBLISHED_FINDING",
        "CALCULATED", "MODEL_PREDICTION", "SYNTHETIC_OR_PLACEHOLDER",
        "UNVERIFIED", "UNAVAILABLE"
    ], f"Invalid classification {rec['data_classification']}"

# 3. Flame Propagation
fp = test_endpoint("Flame Propagation Endpoint", "/flame-propagation")
assert len(fp["saffire_time_series"]) > 0, "Expected SAFFIRE time series points"
assert len(fp["bass_time_series"]) > 0, "Expected BASS time series points"
assert len(fp["comparative_spread_rates"]) >= 7, "Expected comparative spread rates"
assert "geometry_warning" in fp, "Expected geometry warning"

# 4. Fuel & Materials
fm = test_endpoint("Fuel & Materials Endpoint", "/fuel-material")
assert len(fm["materials"]) >= 5, "Expected >=5 materials"
for mat in fm["materials"]:
    assert "data_classification" in mat

# 5. Oxygen & Airflow
oa = test_endpoint("Oxygen & Airflow Endpoint", "/oxygen-airflow")
assert len(oa["oxygen_variation_data"]) >= 4, "Expected oxygen variation data"
assert len(oa["airflow_variation_data"]) >= 4, "Expected airflow variation data"
assert len(oa["missing_measurements"]) >= 3, "Expected documented missing measurements"

# 6. Extinction
ex = test_endpoint("Extinction Analysis Endpoint", "/extinction")
assert len(ex["extinction_mechanisms"]) >= 4, "Expected >=4 extinction mechanisms"
assert "suppression_rule_warning" in ex

# 7. Fire Safety Insights
ins = test_endpoint("Fire Safety Insights Endpoint", "/fire-safety-insights")
assert len(ins["insights"]) == 6, f"Expected 6 insights, got {len(ins['insights'])}"
for item in ins["insights"]:
    assert "measured_facts" in item["measured_vs_interpreted"]
    assert "engineering_interpretation" in item["measured_vs_interpreted"]

# 8. Interactive Research Question (Curated Q1)
q1 = test_endpoint("Research Question Q1", "/research-question", method="POST", body={"question_id": "Q1"})
assert len(q1["relevant_experiments"]) > 0, "Expected relevant experiments"
assert len(q1["available_measurements"]) > 0, "Expected numerical measurements"

# 9. Custom Question
q_custom = test_endpoint(
    "Custom Question",
    "/research-question",
    method="POST",
    body={"custom_query": "What happens to soot formation in microgravity?"}
)
assert len(q_custom["evidence_supported_explanation"]) > 20, "Expected substantive answer"

print("\nALL 9 TEST CASES PASSED SUCCESSFULLY!")
