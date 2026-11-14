# Flame in Freefall — NASA Microgravity Combustion Research Workstation

**Flame in Freefall** is a professional space-science research and mission analysis application designed for aerospace engineers, combustion researchers, and life-support analysts studying fire safety in reduced gravity.

The application translates flight experiments from the **Combustion Integrated Rack (CIR)** on the International Space Station, large-scale fires aboard **uncrewed Cygnus cargo spacecraft (SAFFIRE)**, and **Space Shuttle** missions into actionable fire-safety constraints for future human exploration missions (**Artemis Lunar Base Camp**, **Lunar Gateway**, and **Mars Transit Vehicles**).

---

## Key Modules & Capabilities

### 1. Overview (Mission-Control Telemetry & Research Snapshot)
- **Telemetry Snapshot**: Real-time counts of experiments, peer-reviewed publications, documented findings, and quantitative sensor runs.
- **Corpus Coverage**: Master distribution across 8 core research areas (*Flame spread, Flame extinction, Material flammability, Ignition, Oxygen concentration, Airflow dynamics, Temperature effects, Fire suppression, Microgravity physics*).
- **Spacecraft Platform Distribution**: Tracking tests across Cygnus cargo vehicles, CIR MDCA, CIR SoFIE chamber, and Space Shuttle.
- **Spacecraft Fire Safety Factor Matrix**: High-level severity summary of 6 critical space fire hazards.

### 2. Findings & Transparent Ranking System
- **Formula-Driven Scientific Ranking (0 - 100 pts)**:
  $$\text{Score} = \text{Evidence (25)} + \text{Cross-Support (20)} + \text{Safety Impact (30)} + \text{Param Breadth (15)} + \text{Data Maturity (10)}$$
- **Explainable Evidence Inspector**: Inspect the exact rationale for each component score, linked flight telemetry, and primary NASA NTRS citations.
- **Multi-Dimensional Filters**: Filter by investigation, research area, variable, and score threshold.

### 3. Explore & Scientific Data Telemetry
- **Experiments Dossier**: Deep dive into individual investigations (Saffire I-VI, FLEX, BASS, SoFIE-GEL, SoFIE-MIST, ACME-BRE, SAME) with hardware specs, materials, and flight timelines.
- **Interactive Recharts Data Explorer**:
  - *Flame Spread Rate (mm/s) vs Forced Convective Airflow (cm/s)*
  - *Extinction Time (s) vs Atmospheric Oxygen Concentration (%)*
  - *Burn Rate Constants across fuel materials*
- **Authentic Telemetry Table & CSV Export**: Real NASA published sensor runs with zero fabricated data. Missing variables are explicitly labeled.
- **Side-by-Side Mission Comparator**: Compare 2 to 4 spaceflight combustion experiments across 8 technical dimensions.

### 4. AI Research Analyst (Corpus Grounded RAG)
- **Zero-Hallucination Policy**: Grounded strictly in the 39 indexed chunks of NASA flight papers and PSI records.
- **Strict Evidence Segregation**:
  1. `ANSWER`: Synthesized scientific response.
  2. `NASA DOCUMENTED FINDINGS`: Exact quotes and documented findings.
  3. `AI INTERPRETATION`: Explicitly demarcated deductive reasoning.
  4. `POTENTIAL FUTURE MISSION RELEVANCE`: Operational guidelines for Artemis, Gateway, and Mars.
  5. `EVIDENCE & SOURCE DOCUMENTS`: Clickable NTRS and DOI citations.
  6. `RETRIEVAL CONFIDENCE`: Transparent percentage score.
- **Scientific Fallback**: If research evidence is insufficient, returns *"Not enough evidence found in the available NASA research corpus."*

### 5. Fire Safety Insights & Human Mission Guidelines
- **Topic Breakdown**: Comprehensive dossiers across all primary combustion safety topics.
- **Spacecraft Design Requirements**: Actionable requirements for ECLSS ventilation, avionics barriers, and emergency depressurization.
- **Planetary Surface Regimes**: Contrasting microgravity ($0\text{-g}$) with weak natural convection on the Moon ($0.166\text{ g}$) and Mars ($0.38\text{ g}$).

### 6. Sources & NTRS Bibliography
- Traceable links to formal NASA Technical Memorandums (TM), AIAA Journal of Spacecraft & Rockets, Combustion and Flame, and Nature Communications papers.

### 7. Workstation Telemetry & Data Export
- Health telemetry for the CIR and database index.
- One-click full dataset export to JSON bundle.

### 8. Data Provenance & Traceability Framework
- **7-Tier Provenance Taxonomy**: Every parameter, curve, and prediction is explicitly tagged: `MEASURED_TABLE`, `DIGITIZED_FROM_PUBLICATION`, `APPROXIMATED_CURVE`, `CALCULATED`, `MODEL_PREDICTION`, `ILLUSTRATIVE`, `METADATA_ONLY`.
- **Dataset Manifest & Download Guide**: `flame-in-freefall-data/manifest.json` documents every file, table/figure reference, DOI/NTRS link, and known limitation. `DATA_NEEDED.md` lists raw PSI telemetry files needed to replace approximated curves.
- **Visual Honesty**: Visual badges and toggles distinguish direct measurements from model predictions and illustrative rendering elements.

---

## Scientific Design Aesthetics

- **Default Theme**: **Scientific Light Mode** (high-contrast, clean technical workstation).
- **Dark Mode**: Visible toggle in the header for low-light mission-control analysis.
- **Responsive Layout**:
  - **Desktop**: Left navigation sidebar, multi-column scientific panels, telemetry headers.
  - **Tablet**: Collapsible panels, adaptive charts.
  - **Mobile**: Touch-friendly bottom navigation bar ($\ge 44\text{px}$ targets), horizontal scroll tables, and drawer filters.


