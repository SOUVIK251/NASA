# NASA Microgravity Combustion Research Datasets — Data Provenance & Audit Guide

This repository contains curated experimental datasets, flight test matrices, and research findings from NASA Physical Sciences Informatics (PSI) combustion investigations conducted aboard the International Space Station (ISS) and uncrewed Cygnus spacecraft.

---

## 1. Canonical 7-Tier Provenance Taxonomy

To ensure scientific honesty and transparency, all data in this repository is strictly tagged according to the canonical seven-tier provenance classification defined in `backend/provenance.py` and `manifest.json`:

| Tier Label | Definition | Scope in Repository |
| :--- | :--- | :--- |
| **`MEASURED_TABLE`** | Scalar value copied directly from a cited NASA technical report table (e.g., NASA/TP—2015-216046 Table IX). No transformation beyond unit conversion. | Summary test matrices (`flex_measurements.csv`, `bass_measurements.csv`, `saffire_measurements.csv`, `sofie_gel_measurements.csv`). |
| **`DIGITIZED_FROM_PUBLICATION`** | Value manually traced or extracted from a figure or table in a peer-reviewed publication. Carries digitization error (~2–5% of range). | Applied only where independent digitization from a publication figure can be demonstrated. |
| **`APPROXIMATED_CURVE`** | Time-series curve hand-constructed to be consistent with published burning-rate constants and phase transition times from the literature. Reflects the analytical D²-law model, not raw sensor scatter. | Current time-series CSVs (`FLEX_F2_T01`, `FLEX_F2_T02`, `BASS2_PMMA_T01`). See `DATA_NEEDED.md` for raw files to replace these. |
| **`CALCULATED`** | Derived algebraically from other measured or approximated columns (e.g., $D^2 = D^2$, $\tau = t / D_0^2$, normalized $D^2$). | Derived columns in time-series and ML training matrices (`D2_mm2`, `burn_rate_K_mm2_s`, `target_D2_norm`). |
| **`MODEL_PREDICTION`** | Output of the reduced-order analytical physics engine (Grashof, Spalding B-number, Damköhler) or the PIML regression model. Not a measurement. | Outputs from `backend/simulator/physics.py` and `backend/ml/model_inference.py`. |
| **`ILLUSTRATIVE`** | Estimated solely for 3D visualization where no sensor data exists (e.g., flame envelope diameter in FLEX, ambient temperature profile in BASS). | Labeled per column in `manifest.json` (`flame_diam_mm`, `temp_K`, `mass_loss_rate_mg_s`). Can be toggled off in UI. |
| **`METADATA_ONLY`** | Experiment-level descriptive metadata only; no public time-series or scalar measurement is currently available. | SPICE (PSI-107). No time-series measurements are fabricated. |

---

## 2. Dataset Inventory & Provenance Details

For machine-readable metadata, citations, DOI links, column-level provenance tags, and known limitations, consult:
- **`manifest.json`**: Master dataset manifest detailing every file, source document, DOI, and column tier.
- **`DATA_NEEDED.md`**: Guide for downloading raw PSI telemetry files (PSI-69, PSI-25, PSI-98) to upgrade approximated curves into primary data.

### A. FLEX — Flame Extinguishment Experiment (PSI-69)
- **Facility**: ISS Combustion Integrated Rack (CIR) — Multi-user Droplet Combustion Apparatus (MDCA).
- **Principal Investigators**: Forman A. Williams (UC San Diego), Daniel L. Dietrich (NASA Glenn Research Center), Vedha Nayagam.
- **Key Discovery**: Low-temperature "cool flame" combustion (~600–800 K) persisting after visible hot flame extinction in microgravity.
- **Source Documents**:
  1. `NASA/TP—2015-216046`: *"Flame Extinguishment Experiment (FLEX) Detailed Test Results"* (314 pages). Table IX documents all 284 flight test burns aboard the ISS.
  2. Vedha-Nayagam et al., *Combustion and Flame* 159(12):3583–3588 (2012): *"Quasi-steady Cool Flames Sustained by n-Alkane Droplets in Microgravity"*.
  3. Dietrich et al., *NASA/TM-2014-218323* (2014).
- **Files**:
  - `measurements/flex/flex_measurements.csv`: **`MEASURED_TABLE`**. Sourced directly from Table IX of NASA/TP—2015-216046 (FLEX-001, FLEX-002, FLEX-007, FLEX-008 cool flame discovery, FLEX-018 elevated pressure, FLEX-062 reduced oxygen, FLEX-079 near LOI limit, FLEX-121 decane).
  - `measurements/flex/FLEX_F2_T01_heptane_21O2_1atm.csv`: **`APPROXIMATED_CURVE`**. Constructed curve matching published burning rate constants ($K \approx 1.4\text{ mm}^2/\text{s}$ hot flame, $K \approx 0.35\text{ mm}^2/\text{s}$ cool flame). $D^2(t)$ is calculated; `flame_diam_mm` and `temp_K` are illustrative.
  - `measurements/flex/FLEX_F2_T02_heptane_15O2_1atm.csv`: **`APPROXIMATED_CURVE`**. Reduced oxygen ($15\%\text{ O}_2$) condition demonstrating shortened hot flame (~3.0 s) and extended cool flame burning.

---

### B. BASS-II — Burning and Suppression of Solids-II (PSI-25)
- **Facility**: ISS Microgravity Science Glovebox Flow Duct.
- **Principal Investigators**: Sandra L. Olson (NASA Glenn Research Center), Paul V. Ferkul (USRA).
- **Key Discovery**: Low-velocity concurrent flows ($1\text{ to }5\text{ cm/s}$) support flame spread at lower oxygen concentrations than Earth gravity.
- **Source Documents**:
  1. `NASA/TM-20210011385`: *"Burning and Suppression of Solids-II (BASS-II) Summary Report"* (144 pages). Table A.5 lists Olson PMMA rod concurrent flow tests. Table A.1 lists Ferkul fabric tests.
  2. Olson et al., *Combustion and Flame* 168:378–390 (2016): *"Microgravity Flammability of PMMA Rods in Concurrent Flow"*.
  3. NASA NTRS citation `20150008961`.
- **Files**:
  - `measurements/bass/bass_measurements.csv`: **`MEASURED_TABLE`**. Sourced from Table A.5 and Table A.1 (BASS2-O1, BASS2-O2, BASS2-O4, BASS2-O10 blowoff extinction, BASS2-O13a quenching extinction, BASS2-F1 Nomex fabric extinction, BASS2-F4 SIBAL fabric spread).
  - `measurements/bass/BASS2_PMMA_T01_21O2_10cms.csv`: **`APPROXIMATED_CURVE`**. Flame position, flame length ($12.3\text{ mm}$), flame width ($9.3\text{ mm}$), and steady concurrent spread rate ($0.079\text{ cm/s}$). Temperature and mass loss rate are illustrative.

---

### C. SAFFIRE — Spacecraft Fire Safety Demonstration (PSI-98)
- **Facility**: Orbital ATK Cygnus pressurized cargo module (autonomous flow duct, post-ISS departure).
- **Principal Investigators**: David L. Urban, Gary A. Ruff, Sandra L. Olson (NASA Glenn Research Center).
- **Key Discovery**: First large-scale fire deliberately ignited in space. In a $20\text{ cm/s}$ flow duct, concurrent flame spread along SIBAL fabric stabilized at $1.8\text{ mm/s}$ ($0.18\text{ cm/s}$), with flame length reaching a steady plateau of $40\text{ mm}$ ($4.0\text{ cm}$) and average flame power of $1200\pm 300\text{ W}$.
- **Source Documents**:
  1. NASA NTRS citation `20170008805`: *"Results of Large-Scale Spacecraft Flammability Tests"* (Ferkul, Olson, Urban, Ruff et al.). Table I lists flight test parameters for Sample 1-1 ($40.6\text{ cm}\times 94\text{ cm}$ SIBAL sheet).
  2. `NASA/TM-20230005412`: Saffire IV–VI Exploration Atmosphere flammability and smoke scrubbing test report.
  3. Urban et al., *AIAA Journal of Spacecraft and Rockets*, Saffire Flight Report.
- **Files**:
  - `measurements/saffire/saffire_measurements.csv`: **`MEASURED_TABLE`**. Points from Table I (Saffire-I Sample 1-1 concurrent flow, Sample 1-2 opposed flow, Saffire-II narrow strips, and Saffire-IV Exploration Atmosphere).
  - `measurements/saffire/SAFFIRE_I_SIBAL_fabric.csv`: **`DIGITIZED_FROM_PUBLICATION`**. Full $420\text{ s}$ flight duration time-series consistent with Table I $0.18\text{ cm/s}$ spread rate, $40\text{ mm}$ flame length plateau, $40.6\text{ cm}$ width, $84\text{ cm}$ burn length, and $\sim 1630\text{ K}$ peak thermocouple temperature.

---

### D. SoFIE-GEL — Solid Fuel Ignition and Extinction (Growth and Extinction Limits)
- **Facility**: ISS CIR — SoFIE insert.
- **Principal Investigators**: Sandra L. Olson, Carlos Fernandez-Pello, James S. T'ien, Jose L. Torero.
- **Source Document**: NASA Science SoFIE GEL Architecture Review & Flight Test Matrix.
- **Files**:
  - `measurements/sofie_gel/sofie_gel_measurements.csv`: **`MEASURED_TABLE`**. Parameters for PMMA spheres ($12.7\text{ mm}$, $25.4\text{ mm}$), flat sheets, and cylinders.

---

### E. SPICE — Smoke Point In Coflow Experiment (PSI-107)
- **Facility**: ISS CIR chamber.
- **Principal Investigator**: Dennis Stocker (NASA Glenn Research Center).
- **Status**: **`METADATA_ONLY`**.
- **Data Availability**: Detailed investigation metadata, objectives, and soot dynamics physics descriptions are provided in `dataset_index.json` and SQLite database. Public time-series CSV files are unavailable without direct PSI portal access. No synthetic measurements are presented.

---

## 3. Data Pipeline & API Integration

- **Backend Provenance Module**: `backend/provenance.py` defines the canonical enum `Provenance` and descriptions.
- **FastAPI Dataset Pipeline**: `backend/dataset_pipeline.py` and `backend/dataset_routes.py` expose endpoints including `GET /api/manifest` and `GET /api/experiments/{id}/timeseries`.
- **Frontend Provenance Badge**: `DataProvenanceBadge.tsx` displays visual badges with distinct colors, icons, and honest tooltips for each provenance tier.
