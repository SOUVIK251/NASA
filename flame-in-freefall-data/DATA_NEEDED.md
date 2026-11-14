# Data Needed — Real PSI Files to Download

This file lists the NASA Physical Sciences Informatics (PSI) files
that, once downloaded, would replace or confirm the approximated-curve
CSVs currently in this project. Until they are obtained, all time-series
CSVs must be labelled `APPROXIMATED_CURVE` in the manifest and in the UI.

---

## PSI-69 — FLEX / FLEX-2 (Droplet Combustion)

**PSI Portal:** <https://psi.nasa.gov/physci/repo/data/investigations/PSI-69>  
**Access:** Requires NASA PSI account (free registration). Request access to
"Flame Extinguishment Experiment (FLEX)" data.

### What to look for

| File type | Description |
|---|---|
| Per-burn optical camera data | MDCA (Multi-user Droplet Combustion Apparatus) CCD/CMOS frames — raw D(t) from video |
| Drop-diameter time-series | CSV or MATLAB files named by run number (e.g., `FLEX_run_NNN_D_vs_t.csv`) |
| Thermocouple traces | Per-burn temperature records from CIR thermocouple channels |
| Test matrix | Master spreadsheet listing all 284 burns with O₂%, pressure, D₀, extinction time |

### Run IDs to prioritise

- FLEX-008 (n-Heptane, 21% O₂, D₀ ≈ 2.95 mm, cool flame observed)
- FLEX-062 (n-Heptane, 17.5% O₂, D₀ ≈ 3.48 mm)
- FLEX-079 (n-Heptane, 13.4% O₂, near-extinction)
- Any run matching the conditions in `flex_measurements.csv`

### What the loader should do (file: `backend/dataset_pipeline.py`)

```
load_psi69_raw_run(run_id, filepath)
  → parse variable-timestep D(t) CSV
  → compute D2, tau, phase labels
  → write to measurements/flex/{run_id}.csv
  → tag data_quality = DIGITIZED_FROM_PUBLICATION (if from figures)
       or MEASURED_TABLE (if direct instrument output)
```

---

## PSI-25 — BASS-II (Solid Material Combustion)

**PSI Portal:** <https://psi.nasa.gov/physci/repo/data/investigations/PSI-25>  
**Access:** Requires NASA PSI account.

### What to look for

| File type | Description |
|---|---|
| Flame spread video frames | Per-test CIR camera output; flame front position vs time |
| Thermocouple traces | 8-channel thermocouple array data per test run |
| Test summary table | Table A.5 (PMMA rods) and Table A.1 (fabrics) from NASA/TM-20210011385 — may already be partially in `bass_measurements.csv` |

### Run IDs to prioritise

- BASS2-O1 (Clear PMMA 6.35 mm rod, 21% O₂, 10 cm/s) — matches current CSV
- BASS2-O10 (16.1% O₂ — extinction run)
- BASS2-F4 (SIBAL fabric, 21% O₂)

### Loader signature

```
load_psi25_raw_run(test_id, video_analysis_csv)
  → parse flame_pos(t), flame_length(t) from video frame analysis
  → tag DIGITIZED_FROM_PUBLICATION for video-extracted values
  → tag MEASURED_TABLE for scalar endpoint values from TM table
```

---

## PSI-98 — SAFFIRE (Large-Scale Spacecraft Fire)

**PSI Portal:** <https://psi.nasa.gov/physci/repo/data/investigations/PSI-98>  
**Key NTRS report:** <https://ntrs.nasa.gov/citations/20170008805>  
**Access:** Requires NASA PSI account. SAFFIRE-I data may also be partially
available directly from NTRS as supplementary material.

### What to look for

| File type | Description |
|---|---|
| Thermocouple time-series | 23-thermocouple array aboard Cygnus — raw K vs time, ~1 Hz sample rate |
| Radiometer traces | Total heat flux vs time from on-board sensors |
| Video frames | HDTV and standard cameras — flame front position vs time |
| Test summary | Table I in NTRS 20170008805 (already partially in `saffire_measurements.csv`) |

### Sample IDs to prioritise

- SAFFIRE-I Sample 1-1 (SIBAL 40.6×94 cm, large concurrent) — matches current CSV
- SAFFIRE-I Sample 1-2 (SIBAL 40.6×10 cm, opposed flow)
- SAFFIRE-II Samples 2-5, 2-6 (narrow strips, different flow velocities)
- SAFFIRE-IV-01 (Exploration Atmosphere: 34% O₂, 0.56 atm)

### Loader signature

```
load_psi98_thermocouple(sample_id, tc_csv)
  → parse time_s, TC01..TC23 channels (K)
  → derive peak_temp_K = max(TC channels) per timestep
  → tag DIGITIZED_FROM_PUBLICATION (if from published figure)
       or MEASURED_TABLE (if direct instrument file)
  → write to measurements/saffire/{sample_id}_tc.csv
```

---

## After Downloading

1. Place raw files in `data/raw/{psi_id}/{run_id}/`
2. Run the appropriate loader function in `backend/dataset_pipeline.py`
3. Update `manifest.json` — change `overall_provenance` from
   `APPROXIMATED_CURVE` to `DIGITIZED_FROM_PUBLICATION` or `MEASURED_TABLE`
4. Update `dataset_index.json` to reference the new files
5. Re-run the ML training pipeline (`python -m backend.ml.train_flex_model`)
6. All provenance badges in the UI will update automatically via the API

---

## Current Status

| Dataset | Time-series status | Summary scalars status |
|---|---|---|
| FLEX-F2-T01 | `APPROXIMATED_CURVE` | `MEASURED_TABLE` (flex_measurements.csv) |
| FLEX-F2-T02 | `APPROXIMATED_CURVE` | `MEASURED_TABLE` (flex_measurements.csv) |
| BASS2-PMMA-T01 | `APPROXIMATED_CURVE` | `MEASURED_TABLE` (bass_measurements.csv) |
| SAFFIRE-I | `APPROXIMATED_CURVE` | `MEASURED_TABLE` (saffire_measurements.csv) |
| ML training data | `APPROXIMATED_CURVE` (derived) | — |
| SOFIE-GEL | `METADATA_ONLY` | — |
| SPICE | `METADATA_ONLY` | — |
