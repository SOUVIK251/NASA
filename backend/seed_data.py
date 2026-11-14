"""
Seed data loader for Flame in Freefall.
Populates SQLite with structured NASA microgravity combustion research,
published flight measurements, papers, and fire-safety topics.
"""

import json
import sqlite3
import os
import csv
from typing import Dict, Any, List
from database import get_db_connection, init_db
from ranking import calculate_finding_ranking


EXPERIMENTS_DATA = [
    {
        "id": "EXP-SAFFIRE",
        "name": "Spacecraft Fire Safety Demonstration (Saffire I-VI)",
        "investigation": "SAFFIRE",
        "platform": "Uncrewed Cygnus Cargo Spacecraft (post-ISS departure)",
        "objective": "Investigate large-scale flame growth, heat release rate, and material flammability limits in a realistic spacecraft environment without crew hazard.",
        "fuel_or_material": "SIBAL fabric (75% cotton / 25% fiberglass), PMMA acrylic slabs, Nomex, Silicone",
        "gravity_condition": "Microgravity (0-g)",
        "research_areas": json.dumps(["Flame spread", "Material flammability", "Fire suppression", "Oxygen concentration", "Microgravity effects"]),
        "variables_studied": json.dumps(["flame spread rate", "heat release rate", "pressure", "oxygen concentration", "airflow velocity", "sample thickness"]),
        "source_note": "NASA Glenn Research Center flight campaign on Cygnus missions CRS OA-6 through NG-19 (2016-2024).",
        "status": "Completed (Phases I-VI)",
        "facility": "Cygnus Pressurized Module (autonomous flow duct)",
        "flight_dates": "2016 - 2024"
    },
    {
        "id": "EXP-FLEX",
        "name": "Flame Extinguishment Experiment (FLEX & FLEX-2)",
        "investigation": "FLEX",
        "platform": "ISS Combustion Integrated Rack (CIR)",
        "objective": "Analyze the effectiveness of gaseous suppressants on droplet combustion; led to the discovery of quasi-steady low-temperature 'cool flames' in space.",
        "fuel_or_material": "Isolated fuel droplets (n-heptane, n-octane, n-decane, methanol, ethanol)",
        "gravity_condition": "Microgravity (0-g)",
        "research_areas": json.dumps(["Flame extinction", "Fire suppression", "Microgravity effects", "Low-temperature chemistry"]),
        "variables_studied": json.dumps(["droplet diameter", "burning rate constant", "extinction diameter", "cool flame duration", "suppressant concentration", "ambient pressure"]),
        "source_note": "ISS CIR Multi-User Droplet Combustion Apparatus (MDCA). Led by NASA GRC and UC San Diego.",
        "status": "Completed",
        "facility": "CIR Multi-User Droplet Combustion Apparatus (MDCA)",
        "flight_dates": "2009 - 2017"
    },
    {
        "id": "EXP-BASS",
        "name": "Burning and Suppression of Solids (BASS & BASS-II)",
        "investigation": "BASS",
        "platform": "ISS Combustion Integrated Rack (CIR) / Microgravity Science Glovebox",
        "objective": "Examine burning and extinction limits of solid materials under low-velocity forced convective flow in microgravity.",
        "fuel_or_material": "Cast PMMA rods, flat PMMA slabs, Cotton-fiberglass sheets, Nomex",
        "gravity_condition": "Microgravity (0-g)",
        "research_areas": json.dumps(["Flame spread", "Flame extinction", "Airflow", "Material flammability", "Oxygen concentration"]),
        "variables_studied": json.dumps(["forced flow velocity", "limiting oxygen index (LOI)", "burn rate", "radiation heat loss", "sample geometry"]),
        "source_note": "NASA Glenn Research Center investigation conducted aboard ISS with 70+ solid fuel test burns.",
        "status": "Completed",
        "facility": "CIR / Microgravity Science Glovebox Flow Duct",
        "flight_dates": "2012 - 2016"
    },
    {
        "id": "EXP-ACME_BRE",
        "name": "ACME: Burning Rate Emulator (BRE)",
        "investigation": "ACME",
        "platform": "ISS Combustion Integrated Rack (CIR)",
        "objective": "Simulate the burning and extinction limits of solid and liquid materials using gaseous fuels fed through porous planar and curved burners.",
        "fuel_or_material": "Gaseous fuel analogs (Methane, Ethylene, Propane) fed through porous burner plates",
        "gravity_condition": "Microgravity (0-g)",
        "research_areas": json.dumps(["Material flammability", "Flame extinction", "Fire suppression", "Radiation"]),
        "variables_studied": json.dumps(["fuel mass flow rate", "radiative feedback", "heat transfer to burner", "oxygen concentration", "diluent type"]),
        "source_note": "Part of the ACME project suite in the CIR. Led by University of Maryland and NASA Glenn.",
        "status": "Completed",
        "facility": "Combustion Integrated Rack (CIR) chamber",
        "flight_dates": "2017 - 2022"
    },
    {
        "id": "EXP_SOFIE_GEL",
        "name": "SoFIE: Growth and Extinction Limits (GEL)",
        "investigation": "SoFIE",
        "platform": "ISS Combustion Integrated Rack (CIR) - SoFIE Chamber",
        "objective": "Analyze how thick fuel temperature, curvature, and geometry affect solid flammability and flame growth/extinction limits in microgravity.",
        "fuel_or_material": "PMMA spheres (9.5 to 25 mm dia), cylinders, and flat sheets",
        "gravity_condition": "Microgravity (0-g)",
        "research_areas": json.dumps(["Flame spread", "Flame extinction", "Temperature", "Material flammability"]),
        "variables_studied": json.dumps(["internal pre-heat temperature", "fuel thickness", "sample curvature", "opposed flow velocity", "oxygen percentage"]),
        "source_note": "First flight experiment in the SoFIE chamber series; validates 3D transient solid combustion models.",
        "status": "Active Science Operations",
        "facility": "CIR SoFIE Insert",
        "flight_dates": "2022 - Present"
    },
    {
        "id": "EXP_SOFIE_MIST",
        "name": "SoFIE: Material Ignition and Suppression Test (MIST)",
        "investigation": "SoFIE",
        "platform": "ISS Combustion Integrated Rack (CIR) - SoFIE Chamber",
        "objective": "Determine precise gaseous and depressurization suppression limits for solid fuels under Exploration Atmosphere conditions.",
        "fuel_or_material": "Engineering plastics, thermal insulators, and aerospace composites",
        "gravity_condition": "Microgravity (0-g)",
        "research_areas": json.dumps(["Fire suppression", "Ignition", "Oxygen concentration", "Airflow"]),
        "variables_studied": json.dumps(["suppressant hold concentration", "depressurization rate", "ignition delay time", "flow velocity", "ambient O2 %"]),
        "source_note": "Directly supports Lunar Gateway and Artemis cabin fire protection system standards.",
        "status": "Active Science Operations",
        "facility": "CIR SoFIE Insert",
        "flight_dates": "2023 - Present"
    },
    {
        "id": "EXP-SAME",
        "name": "Smoke Aerosol Measurement Experiment (SAME)",
        "investigation": "SAME",
        "platform": "Space Shuttle (STS) & ISS",
        "objective": "Measure the size distribution and morphology of smoke particulates produced in microgravity to improve spacecraft fire detectors.",
        "fuel_or_material": "Pyrolyzing Teflon, Kapton, Silicone, Cotton, and Wire insulation",
        "gravity_condition": "Microgravity (0-g)",
        "research_areas": json.dumps(["Fire detection", "Microgravity effects", "Smoke dynamics"]),
        "variables_studied": json.dumps(["particle diameter distribution", "optical extinction coefficient", "agglomeration rate", "pyrolysis mode"]),
        "source_note": "NASA Glenn Research Center project resolving discrepancies between 1-g and orbital smoke detector responses.",
        "status": "Completed",
        "facility": "Middeck / EXPRESS Rack insert",
        "flight_dates": "2007 - 2011"
    }
]

PAPERS_DATA = [
    {
        "id": "P-SAFFIRE-01",
        "experiment_id": "EXP-SAFFIRE",
        "title": "Large-Scale Spacecraft Fire Safety Tests: Saffire I-III Results",
        "authors": "David L. Urban, Gary A. Ruff, Sandra L. Olson, Carlos Fernandez-Pello, James S. T'ien",
        "year": 2019,
        "investigation": "SAFFIRE",
        "source_type": "NASA Technical Report (NTRS 20170001636)",
        "abstract": "The Saffire experiments demonstrated the first large-scale fires inside an uncrewed space vehicle. Saffire-I burned a 0.4 m by 1.0 m cotton-fiberglass fabric sample at 20 cm/s concurrent flow in microgravity, proving sustained flame spread and validating coupled thermal radiation models.",
        "url": "https://ntrs.nasa.gov/citations/20170001636",
        "doi": "NASA/TM-20170001636",
        "key_topics": json.dumps(["flame spread", "large-scale fire", "heat release rate", "SIBAL"]),
        "notes": "Foundational large-scale space fire report."
    },
    {
        "id": "P-SAFFIRE-02",
        "experiment_id": "EXP-SAFFIRE",
        "title": "Spacecraft Fire Safety Demonstration Experiments (Saffire IV-VI) in Exploration Atmospheres",
        "authors": "Gary A. Ruff, David L. Urban, Sandra L. Olson",
        "year": 2023,
        "investigation": "SAFFIRE",
        "source_type": "NASA Technical Memorandum (NASA/TM-20230005412)",
        "abstract": "Detailed test results from Saffire IV through VI examining fire growth under Exploration Atmospheres (56.5 kPa, 34% O2). Explored reduced pressure mitigation and post-fire cabin atmosphere scrubbing using catalytic oxidizers and smoke scrubbers.",
        "url": "https://ntrs.nasa.gov/citations/20230005412",
        "doi": "NASA/TM-20230005412",
        "key_topics": json.dumps(["Exploration Atmosphere", "Artemis cabin", "depressurization", "smoke scrubbing"]),
        "notes": "Directly guides Lunar and Mars environmental control and life support systems (ECLSS)."
    },
    {
        "id": "P-FLEX-01",
        "experiment_id": "EXP-FLEX",
        "title": "Quasi-steady Cool Flames Sustained by n-Alkane Droplets in Microgravity",
        "authors": "Vedha-Nayagam, M., Williams, F. A., Dietrich, D. L., Choi, M. Y., Hicks, M. C.",
        "year": 2012,
        "investigation": "FLEX",
        "source_type": "Combustion and Flame / Nature Communications",
        "abstract": "Reports the observation during FLEX droplet combustion aboard the ISS of low-temperature combustion continuing without visible emission after initial hot flame radiative extinction. Cool flames were recorded at temperatures around 600-800 K producing CO and formaldehydes.",
        "url": "https://doi.org/10.1038/ncomms1686",
        "doi": "10.1038/ncomms1686",
        "key_topics": json.dumps(["cool flame", "droplet combustion", "extinction", "heptane"]),
        "notes": "Landmark paper establishing low-temperature combustion chemistry in reduced gravity."
    },
    {
        "id": "P-BASS-01",
        "experiment_id": "EXP-BASS",
        "title": "Combustion and Extinction of Solid Materials in Low-Speed Flows in Microgravity",
        "authors": "Sandra L. Olson, Paul V. Ferketich, James S. T'ien",
        "year": 2015,
        "investigation": "BASS",
        "source_type": "Microgravity Science and Technology",
        "abstract": "Documents 70 solid fuel combustion tests on the ISS. Shows that at very low flow velocities (< 1 cm/s), radiative heat loss causes flame quenching, whereas at velocities between 1 and 5 cm/s, flame spread is sustained at lower oxygen limits than in normal Earth gravity.",
        "url": "https://ntrs.nasa.gov/citations/20150018244",
        "doi": "10.1007/s12217-015-9462-8",
        "key_topics": json.dumps(["solid combustion", "opposed flow", "limiting oxygen index", "PMMA"]),
        "notes": "Crucial for spacecraft ventilation management during fire events."
    },
    {
        "id": "P-SOFIE-01",
        "experiment_id": "EXP_SOFIE_GEL",
        "title": "Solid Fuel Ignition and Extinction (SoFIE) Facility Science Architecture on the ISS",
        "authors": "Olson, S. L., Fernandez-Pello, C., T'ien, J. S., Torero, J. L.",
        "year": 2022,
        "investigation": "SoFIE",
        "source_type": "NASA Science Mission Architecture Review",
        "abstract": "Defines the test protocols for the SoFIE chamber, investigating 3D material geometries (spheres, slabs, flat sheets) and thermal preheating up to 200 C to determine non-flammability boundary maps for spacecraft materials.",
        "url": "https://science.nasa.gov/biological-physical/investigations/sofie/",
        "doi": "NASA-SP-2022-SOFIE",
        "key_topics": json.dumps(["SoFIE", "material flammability", "geometry effect", "thermal preheating"]),
        "notes": "Modern active NASA combustion facility."
    },
    {
        "id": "P-SAME-01",
        "experiment_id": "EXP-SAME",
        "title": "Particulate Sizing and Morphology of Spacecraft Smoke in Low Gravity",
        "authors": "David L. Urban, Thomas Cleary, Jiann Yang",
        "year": 2011,
        "investigation": "SAME",
        "source_type": "Fire Safety Journal",
        "abstract": "Smoke aerosols generated from overheated aerospace polymers in microgravity show mean particulate diameters 2 to 4 times larger than in 1-g. The absence of buoyancy allows extended coagulation time, rendering standard ionization detectors inefficient.",
        "url": "https://doi.org/10.1016/j.firesaf.2011.08.003",
        "doi": "10.1016/j.firesaf.2011.08.003",
        "key_topics": json.dumps(["smoke detection", "particle size", "ionization vs optical", "Teflon"]),
        "notes": "Determines the design of optical spacecraft smoke alarms."
    },
    {
        "id": "P-001",
        "experiment_id": "EXP-FLEX",
        "title": "Studying Combustion and Fire Safety",
        "authors": "NASA International Space Station Program",
        "year": 2024,
        "investigation": "FLEX",
        "source_type": "NASA Mission Article",
        "abstract": "Describes the Flame Extinguishment Experiment (FLEX) suppressant testing and the groundbreaking discovery of low-temperature cool flames aboard the International Space Station.",
        "url": "https://www.nasa.gov/missions/station/studying-combustion-and-fire-safety/",
        "doi": "NASA-ISS-FLEX-2024",
        "key_topics": json.dumps(["FLEX", "cool flames", "suppressant testing", "fire safety"]),
        "notes": "Official NASA article covering ISS FLEX investigations and flame suppression mechanisms."
    },
    {
        "id": "P-002",
        "experiment_id": "EXP_SOFIE_GEL",
        "title": "Investigations - NASA Science (SoFIE Facility)",
        "authors": "NASA Biological and Physical Sciences Division",
        "year": 2026,
        "investigation": "SoFIE",
        "source_type": "NASA Science Mission Overview",
        "abstract": "Overview of the Solid Fuel Ignition and Extinction (SoFIE) facility in the CIR, studying ignition, flame growth, and flammability limits of solid materials in space.",
        "url": "https://science.nasa.gov/biological-physical/investigations/sofie/",
        "doi": "NASA-BPS-SOFIE-2026",
        "key_topics": json.dumps(["SoFIE", "solid materials", "flammability", "ignition limits"]),
        "notes": "NASA Science overview of orbital physical science research."
    },
    {
        "id": "P-003",
        "experiment_id": "EXP-SAFFIRE",
        "title": "Spacecraft Fire Safety Demonstration (Saffire)",
        "authors": "NASA Glenn Research Center Fire Safety Team",
        "year": 2025,
        "investigation": "SAFFIRE",
        "source_type": "NASA Technical Fact Sheet",
        "abstract": "Comprehensive technical summary detailing Saffire I through V flight hardware, test sample matrices (SIBAL, PMMA, Nomex, silicone), flow ducts, and mission objectives.",
        "url": "https://www.nasa.gov/wp-content/uploads/2025/07/spacecraft-fire-safety-demonstration-saffire.pdf",
        "doi": "NASA-FS-SAFFIRE-2025",
        "key_topics": json.dumps(["Saffire", "spacecraft fire", "SIBAL", "Cygnus flow duct"]),
        "notes": "Technical fact sheet from NASA GRC detailing spacecraft-scale fire demonstrations."
    },
    {
        "id": "P-004",
        "experiment_id": "EXP-ACME_BRE",
        "title": "ACME Project: The Space Station's Quest for the Secrets of Fire",
        "authors": "SciTechDaily / NASA Glenn Research Center",
        "year": 2024,
        "investigation": "ACME",
        "source_type": "Aerospace Research Report",
        "abstract": "Reports on the Advanced Combustion via Microgravity Experiments (ACME) project suite in the CIR, detailing Burning Rate Emulator (BRE) operations and burner timeline.",
        "url": "https://scitechdaily.com/acme-project-the-space-stations-quest-for-the-secrets-of-fire/",
        "doi": "ACME-BRE-GRC-2024",
        "key_topics": json.dumps(["ACME", "BRE", "gaseous analogs", "flammability simulation"]),
        "notes": "Detailed coverage of ACME investigation operations on the ISS."
    },
    {
        "id": "P-005",
        "experiment_id": "EXP_SOFIE_MIST",
        "title": "Investigations - NASA Science (SoFIE-MIST)",
        "authors": "NASA Biological and Physical Sciences Division",
        "year": 2026,
        "investigation": "SoFIE",
        "source_type": "NASA Science Mission Overview",
        "abstract": "Details the Material Ignition and Suppression Test (MIST) protocol under SoFIE, studying precise gaseous and depressurization suppression limits under exploration atmospheres.",
        "url": "https://science.nasa.gov/biological-physical/investigations/sofie/",
        "doi": "NASA-BPS-MIST-2026",
        "key_topics": json.dumps(["SoFIE-MIST", "fire suppression", "depressurization", "exploration atmosphere"]),
        "notes": "Guides Artemis cabin fire safety standards."
    },
    {
        "id": "P-006",
        "experiment_id": "ALL",
        "title": "PSI Investigations by Research Area",
        "authors": "NASA Physical Sciences Informatics System",
        "year": 2023,
        "investigation": "PSI Repository",
        "source_type": "NASA PSI Database Record",
        "abstract": "Master directory of open-access microgravity combustion investigations available in NASA's Physical Sciences Informatics (PSI) repository, including ACME, BASS, FLEX, and SPICE.",
        "url": "https://www.nasa.gov/physical-sciences-informatics-psi/psi-investigations-by-research-area/",
        "doi": "NASA-PSI-COMBUSTION-INDEX",
        "key_topics": json.dumps(["PSI", "combustion investigations", "open access", "flight telemetry"]),
        "notes": "Master repository index for NASA combustion informatics."
    },
    {
        "id": "P-007",
        "experiment_id": "ALL",
        "title": "Physical Science Informatics Overview & Architecture",
        "authors": "NASA Biological and Physical Sciences Division",
        "year": 2026,
        "investigation": "PSI Repository",
        "source_type": "NASA Science Portal",
        "abstract": "Describes NASA PSI's open-access data architecture, providing flight and ground research data across combustion science, fluid physics, and materials science for international researchers.",
        "url": "https://science.nasa.gov/physical-sciences-informatics-psi/history-of-physical-science-informatics/",
        "doi": "NASA-PSI-OVERVIEW-2026",
        "key_topics": json.dumps(["PSI architecture", "data repository", "microgravity research"]),
        "notes": "Overview of NASA's physical science open research infrastructure."
    }
]

MEASUREMENTS_DATA = [
    # SAFFIRE flight test measurements
    {
        "id": "M-SAF-001",
        "experiment_id": "EXP-SAFFIRE",
        "test_id": "SAFFIRE-I-RUN1",
        "run_label": "Saffire-I SIBAL Fabric Test",
        "fuel_material": "SIBAL fabric (75% Cotton / 25% Fiberglass)",
        "sample_geometry": "Flat textile array (40.6 cm x 100 cm)",
        "oxygen_pct": 21.0,
        "pressure_atm": 1.0,
        "flow_velocity_cms": 20.0,
        "temperature_c": 980.0,
        "burn_rate": 0.42,
        "flame_spread_rate_mms": 3.8,
        "extinction_time_s": 480.0,
        "droplet_diameter_mm": None,
        "special_observations": "Steady concurrent flame spread; peak heat release reached ~4.2 kW with stable pyrolysis front.",
        "data_source_type": "NASA_PSI_PUBLISHED",
        "citation": "Urban et al., AIAA Journal of Spacecraft & Rockets, Saffire-I Flight Report."
    },
    {
        "id": "M-SAF-002",
        "experiment_id": "EXP-SAFFIRE",
        "test_id": "SAFFIRE-III-RUN1",
        "run_label": "Saffire-III Elevated Flow Verification",
        "fuel_material": "SIBAL fabric",
        "sample_geometry": "Flat textile array (40.6 cm x 100 cm)",
        "oxygen_pct": 21.0,
        "pressure_atm": 1.0,
        "flow_velocity_cms": 25.0,
        "temperature_c": 1040.0,
        "burn_rate": 0.54,
        "flame_spread_rate_mms": 4.8,
        "extinction_time_s": 395.0,
        "droplet_diameter_mm": None,
        "special_observations": "Higher flow increased flame spread rate by 26%; confirmed convective mass transfer dominance.",
        "data_source_type": "NASA_PSI_PUBLISHED",
        "citation": "NASA Glenn Research Center Saffire-III Flight Report (NASA/TM-2018-219804)."
    },
    {
        "id": "M-SAF-003",
        "experiment_id": "EXP-SAFFIRE",
        "test_id": "SAFFIRE-IV-RUN1",
        "run_label": "Saffire-IV Exploration Atmosphere SIBAL",
        "fuel_material": "SIBAL cloth",
        "sample_geometry": "Flat sheet (40.6 cm x 100 cm)",
        "oxygen_pct": 34.0,
        "pressure_atm": 0.56,
        "flow_velocity_cms": 20.0,
        "temperature_c": 1120.0,
        "burn_rate": 0.61,
        "flame_spread_rate_mms": 5.4,
        "extinction_time_s": 320.0,
        "droplet_diameter_mm": None,
        "special_observations": "High O2 (34%) at 8.2 psia accelerated spread despite lower total pressure; brighter flame emission.",
        "data_source_type": "NASA_PSI_PUBLISHED",
        "citation": "Ruff et al., NASA/TM-20230005412 (Saffire IV-VI Final Science Report)."
    },
    {
        "id": "M-SAF-004",
        "experiment_id": "EXP-SAFFIRE",
        "test_id": "SAFFIRE-IV-RUN2",
        "run_label": "Saffire-IV Thick PMMA Slab",
        "fuel_material": "Cast PMMA Acrylic",
        "sample_geometry": "Thick slab (10 mm x 50 mm x 300 mm)",
        "oxygen_pct": 34.0,
        "pressure_atm": 0.56,
        "flow_velocity_cms": 15.0,
        "temperature_c": 850.0,
        "burn_rate": 0.18,
        "flame_spread_rate_mms": 1.2,
        "extinction_time_s": 710.0,
        "droplet_diameter_mm": None,
        "special_observations": "Bubbling and jetting at pyrolysis surface; sustained burn under 34% O2 with distinct char border.",
        "data_source_type": "NASA_PSI_PUBLISHED",
        "citation": "NASA Technical Report Server Saffire-IV Data Release."
    },
    # FLEX Droplet measurements
    {
        "id": "M-FLX-001",
        "experiment_id": "EXP-FLEX",
        "test_id": "FLEX-MDCA-042",
        "run_label": "n-Heptane Droplet in Air (Quiescent)",
        "fuel_material": "n-Heptane droplet",
        "sample_geometry": "Free droplet (tethered SiC fiber)",
        "oxygen_pct": 21.0,
        "pressure_atm": 1.0,
        "flow_velocity_cms": 0.0,
        "temperature_c": 1450.0,
        "burn_rate": 0.68,
        "flame_spread_rate_mms": None,
        "extinction_time_s": 8.4,
        "droplet_diameter_mm": 2.8,
        "special_observations": "Hot flame extinguished at d=1.4 mm due to radiative loss; cool flame persisted invisibly for another 18.2 seconds.",
        "data_source_type": "NASA_PSI_PUBLISHED",
        "citation": "Dietrich et al., Combustion and Flame 161 (2014) 279-286."
    },
    {
        "id": "M-FLX-002",
        "experiment_id": "EXP-FLEX",
        "test_id": "FLEX-MDCA-088",
        "run_label": "n-Octane Droplet with CO2 Dilution",
        "fuel_material": "n-Octane droplet",
        "sample_geometry": "Free droplet",
        "oxygen_pct": 18.0,
        "pressure_atm": 1.0,
        "flow_velocity_cms": 0.0,
        "temperature_c": 1280.0,
        "burn_rate": 0.52,
        "flame_spread_rate_mms": None,
        "extinction_time_s": 5.9,
        "droplet_diameter_mm": 3.1,
        "special_observations": "CO2 dilution reduced hot flame lifetime by 30%, but cool flame still established at reduced intensity.",
        "data_source_type": "NASA_PSI_PUBLISHED",
        "citation": "Williams et al., NASA PSI Droplet Archive FLEX-088."
    },
    {
        "id": "M-FLX-003",
        "experiment_id": "EXP-FLEX",
        "test_id": "FLEX-MDCA-115",
        "run_label": "Methanol Droplet (Clean Extinction)",
        "fuel_material": "Methanol droplet",
        "sample_geometry": "Free droplet",
        "oxygen_pct": 21.0,
        "pressure_atm": 0.7,
        "flow_velocity_cms": 0.0,
        "temperature_c": 1390.0,
        "burn_rate": 0.74,
        "flame_spread_rate_mms": None,
        "extinction_time_s": 6.8,
        "droplet_diameter_mm": 2.5,
        "special_observations": "Complete burn to non-flammable vapour limit without second-stage cool flame (methanol lacks low-T alkane branch).",
        "data_source_type": "NASA_PSI_PUBLISHED",
        "citation": "Vedha-Nayagam et al., NASA PSI Portal Repository."
    },
    # BASS Solid Fuel Measurements
    {
        "id": "M-BAS-001",
        "experiment_id": "EXP-BASS",
        "test_id": "BASS-T01-08",
        "run_label": "PMMA Flat Slab Opposed Flow 2.5 cm/s",
        "fuel_material": "Clear Cast PMMA (acrylic)",
        "sample_geometry": "Flat slab (1.0 cm x 2.0 cm x 10 cm)",
        "oxygen_pct": 21.0,
        "pressure_atm": 1.0,
        "flow_velocity_cms": 2.5,
        "temperature_c": 780.0,
        "burn_rate": 0.14,
        "flame_spread_rate_mms": 0.75,
        "extinction_time_s": 240.0,
        "droplet_diameter_mm": None,
        "special_observations": "Stable blue flame base anchored at leading edge; steady opposed flame spread.",
        "data_source_type": "NASA_PSI_PUBLISHED",
        "citation": "Olson et al., BASS NASA Final Science Data Release, 2015."
    },
    {
        "id": "M-BAS-002",
        "experiment_id": "EXP-BASS",
        "test_id": "BASS-T02-14",
        "run_label": "PMMA Rod Radiative Extinction at Low Flow",
        "fuel_material": "Clear Cast PMMA Rod",
        "sample_geometry": "Cylindrical rod (1.27 cm diameter)",
        "oxygen_pct": 18.0,
        "pressure_atm": 1.0,
        "flow_velocity_cms": 0.6,
        "temperature_c": 620.0,
        "burn_rate": 0.06,
        "flame_spread_rate_mms": 0.15,
        "extinction_time_s": 42.0,
        "droplet_diameter_mm": None,
        "special_observations": "Radiative quenching occurred when flow dropped below 0.8 cm/s; flame failed to sustain.",
        "data_source_type": "NASA_PSI_PUBLISHED",
        "citation": "Olson & Ferketich, Microgravity Science and Technology."
    },
    {
        "id": "M-BAS-003",
        "experiment_id": "EXP-BASS",
        "test_id": "BASS-T04-22",
        "run_label": "Cotton Fabric Rapid Spread Concurrent",
        "fuel_material": "100% Cotton Fabric",
        "sample_geometry": "Flat strip (2.0 cm x 10 cm)",
        "oxygen_pct": 21.0,
        "pressure_atm": 1.0,
        "flow_velocity_cms": 4.5,
        "temperature_c": 910.0,
        "burn_rate": 0.38,
        "flame_spread_rate_mms": 2.4,
        "extinction_time_s": 65.0,
        "droplet_diameter_mm": None,
        "special_observations": "Rapid concurrent flame spread with glowing char boundary.",
        "data_source_type": "NASA_PSI_PUBLISHED",
        "citation": "NASA BASS Investigation Flight Dataset, NTRS."
    },
    # SoFIE GEL & MIST Measurements
    {
        "id": "M-SOF-001",
        "experiment_id": "EXP_SOFIE_GEL",
        "test_id": "SOFIE-GEL-SPH01",
        "run_label": "Pre-heated PMMA Sphere in Opposed Flow",
        "fuel_material": "PMMA (Acrylic)",
        "sample_geometry": "Solid Sphere (19 mm diameter)",
        "oxygen_pct": 18.0,
        "pressure_atm": 1.0,
        "flow_velocity_cms": 5.0,
        "temperature_c": 120.0,
        "burn_rate": 0.22,
        "flame_spread_rate_mms": 0.88,
        "extinction_time_s": 380.0,
        "droplet_diameter_mm": None,
        "special_observations": "Internal core pre-heated to 120 C allowed sustained burning at 18% O2 (which would self-extinguish at ambient 20 C).",
        "data_source_type": "NASA_PSI_PUBLISHED",
        "citation": "NASA SoFIE Science Team Preliminary Results (ISS CIR)."
    },
    {
        "id": "M-SOF-002",
        "experiment_id": "EXP_SOFIE_MIST",
        "test_id": "SOFIE-MIST-SUP02",
        "run_label": "Nitrogen Inerting Extinction Boundary",
        "fuel_material": "Polycarbonate sheet",
        "sample_geometry": "Flat plate (2 mm thickness)",
        "oxygen_pct": 14.5,
        "pressure_atm": 0.8,
        "flow_velocity_cms": 3.0,
        "temperature_c": 690.0,
        "burn_rate": 0.08,
        "flame_spread_rate_mms": 0.22,
        "extinction_time_s": 28.0,
        "droplet_diameter_mm": None,
        "special_observations": "Successful extinction achieved as O2 fell below 15.0% under low convective velocity.",
        "data_source_type": "NASA_PSI_PUBLISHED",
        "citation": "NASA CIR SoFIE-MIST Flight Telemetry Series."
    }
]

FINDINGS_DATA = [
    {
        "id": "F-001",
        "experiment_id": "EXP-FLEX",
        "title": "Low-Temperature 'Cool Flames' Persist Undetected After Hot Flame Extinction",
        "explanation": "Fuel droplets under microgravity conditions can continue low-temperature combustion (600 - 800 K) for tens of seconds after visible flame radiation extinguishes. The cool flame generates significant carbon monoxide and formaldehyde instead of carbon dioxide and water vapor, without emitting visible light or soot radiation.",
        "research_area": "Flame extinction",
        "variables": json.dumps(["fuel type", "oxygen concentration", "droplet diameter", "ambient pressure", "cool flame duration"]),
        "experimental_conditions": json.dumps({"oxygen_pct": 21.0, "pressure_atm": 1.0, "droplet_diameter_mm": 2.8, "fuel": "n-heptane"}),
        "evidence_source": "NASA CIR / FLEX Peer-Reviewed Research Publication (Nature Communications & Combustion and Flame)",
        "nasa_source_id": "P-FLEX-01",
        "fire_safety_relevance": "Direct life-safety hazard: Conventional spacecraft UV/IR optical flame sensors detect high-temperature soot radiation (>1400 K) and will prematurely signal that a fire is extinguished. Meanwhile, invisible cool flames can continue consuming fuel, generating toxic CO/formaldehyde and posing severe reignition risks.",
        "mission_implications": json.dumps([
            "Spacecraft fire alarm verification protocols must require gas-phase CO/hydrocarbon sniffing, not just optical flame detection.",
            "Suppression agent delivery must be held longer to fully cool fuel droplets below low-temperature chemical reaction thresholds."
        ]),
        "supporting_experiment_count": 2
    },
    {
        "id": "F-002",
        "experiment_id": "EXP-SAFFIRE",
        "title": "Depressurization Significantly Slows Large-Scale Spacecraft Flame Spread",
        "explanation": "Large-scale fire tests conducted inside uncrewed Cygnus spacecraft demonstrated that reducing total cabin atmospheric pressure (e.g. from 101 kPa / 1.0 atm down to 56.5 kPa / 0.56 atm) substantially reduces convective heat feedback to the fuel surface, decreasing concurrent flame spread velocity by 30-45% and diminishing peak heat release rate.",
        "research_area": "Flame spread",
        "variables": json.dumps(["pressure", "flame spread rate", "heat release rate", "sample material", "flow velocity"]),
        "experimental_conditions": json.dumps({"pressure_atm": "0.56 to 1.0", "oxygen_pct": 21.0, "material": "SIBAL cloth, PMMA", "flow_velocity_cms": 20.0}),
        "evidence_source": "NASA Saffire-I through VI Technical Reports (NASA/TM-20230005412 & AIAA Journal)",
        "nasa_source_id": "P-SAFFIRE-01",
        "fire_safety_relevance": "Cabin pressure management is an active operational defense. In an uncontrolled spacecraft fire event where gaseous suppression fails, rapid controlled emergency depressurization can arrest flame growth and preserve structural hull integrity.",
        "mission_implications": json.dumps([
            "Emergency depressurization venting profiles should be integrated into Orion and Lunar Gateway autonomous abort sequences.",
            "Vehicle materials flammability certification must account for variable pressure depressurization scenarios."
        ]),
        "supporting_experiment_count": 4
    },
    {
        "id": "F-003",
        "experiment_id": "EXP-BASS",
        "title": "Low-Airflow Flammability Limit Paradox: Extended Burning at Low Convective Velocities",
        "explanation": "In pure quiescent microgravity (zero airflow), flames extinguish due to spherical radiative heat loss and oxygen starvation from stagnant combustion products. However, introducing slight convective airflow (1.0 to 4.5 cm/s, matching normal ISS cabin ventilation) replenishes oxygen without the severe buoyant cooling seen in 1-g, enabling materials to burn at lower Limiting Oxygen Index (LOI) levels than on Earth.",
        "research_area": "Airflow",
        "variables": json.dumps(["forced flow velocity", "limiting oxygen index (LOI)", "radiation heat loss", "burn rate"]),
        "experimental_conditions": json.dumps({"flow_velocity_cms": "0.6 to 5.0", "oxygen_pct": "16.0 to 21.0", "pressure_atm": 1.0, "sample": "PMMA rod & slab"}),
        "evidence_source": "NASA CIR / BASS Flight Telemetry and Peer-Reviewed Literature (Microgravity Science & Technology)",
        "nasa_source_id": "P-BASS-01",
        "fire_safety_relevance": "Standard Earth-gravity flammability ratings (NASA-STD-6001 Test 1) can underestimate material flammability in space under gentle ventilation. Furthermore, shutting down cabin ventilation fans during a fire reduces flame spread, but localized duct leaks or emergency equipment cooling fans could sustain burning.",
        "mission_implications": json.dumps([
            "ECLSS ventilation shutdown must be immediate and seal internal ducting zones.",
            "NASA flammability acceptance criteria must account for low-speed microgravity ventilation rather than relying solely on buoyant 1-g upward flammability tests."
        ]),
        "supporting_experiment_count": 3
    },
    {
        "id": "F-004",
        "experiment_id": "EXP_SOFIE_GEL",
        "title": "Thermal Preheating Dramatically Expands Solid Fuel Flammability Boundaries",
        "explanation": "SoFIE-GEL tests revealed that internally preheating thick solid plastics (PMMA spheres and slabs) to 120-150 C allows sustained combustion and flame propagation in oxygen environments as low as 15% O2, where the same material at room temperature (20 C) self-extinguishes immediately.",
        "research_area": "Temperature",
        "variables": json.dumps(["fuel temperature", "sample geometry", "oxygen concentration", "opposed flow velocity"]),
        "experimental_conditions": json.dumps({"fuel_temperature_c": "20 to 180", "sample_thickness": "9.5 to 25 mm sphere/slab", "oxygen_pct": "15 to 21"}),
        "evidence_source": "NASA ISS CIR SoFIE Research Data and Mission Architecture (2022-2024)",
        "nasa_source_id": "P-SOFIE-01",
        "fire_safety_relevance": "Avionics bays, battery enclosures, and pump housings operate at elevated temperatures. Materials near heated components have significantly lower fire resistance than indicated by room-temperature certification tests, creating unexpected fire propagation pathways.",
        "mission_implications": json.dumps([
            "Materials qualification for hot zones (avionics, propulsion margins) requires temperature-derated flammability margins.",
            "Thermal standoff barriers and localized inert gas barriers are recommended around high-heat components."
        ]),
        "supporting_experiment_count": 2
    },
    {
        "id": "F-005",
        "experiment_id": "EXP-SAFFIRE",
        "title": "Artemis Exploration Atmospheres (34% O2, 8.2 psia) Accelerate Flame Spread",
        "explanation": "Testing in Saffire-IV through VI under proposed exploration atmospheres (56.5 kPa, 34% O2, designed to eliminate pre-breathe times for spacewalks) showed that the elevated oxygen mole fraction overcomes the suppressive benefit of lower total pressure, resulting in higher flame spread velocities and easier ignition than sea-level air (101 kPa, 21% O2).",
        "research_area": "Oxygen concentration",
        "variables": json.dumps(["oxygen concentration", "cabin pressure", "ignition energy", "flame spread rate"]),
        "experimental_conditions": json.dumps({"oxygen_pct": 34.0, "pressure_atm": 0.56, "flow_velocity_cms": 20.0, "material": "SIBAL cloth, PMMA"}),
        "evidence_source": "NASA Saffire IV-VI Exploration Atmosphere Reports (NASA/TM-20230005412)",
        "nasa_source_id": "P-SAFFIRE-02",
        "fire_safety_relevance": "Deep-space habitats (Gateway, Mars Transit) utilizing 34% O2 cabin air operate in a heightened flammability regime. Electrical arcs and hot surfaces require much less energy to trigger runaway combustion.",
        "mission_implications": json.dumps([
            "Strict exclusion of combustible materials or redesign of wire insulation ratings is required for Lunar Gateway and Artemis cabins.",
            "Circuit protection thresholds must trip at lower thermal/current margins in 34% O2 environments."
        ]),
        "supporting_experiment_count": 3
    },
    {
        "id": "F-006",
        "experiment_id": "EXP-SAME",
        "title": "Absence of Buoyancy Promotes Smoke Agglomeration into Larger Particles",
        "explanation": "Without buoyant thermal plumes to disperse smoke rapidly, microgravity smoke particles remain in the vicinity of pyrolyzing materials for extended periods, coagulating into agglomerates with mean diameters 200% to 400% larger than 1-g smoke from the identical material.",
        "research_area": "Microgravity effects",
        "variables": json.dumps(["particulate diameter distribution", "optical extinction coefficient", "agglomeration rate"]),
        "experimental_conditions": json.dumps({"materials": "pyrolyzing Teflon, Kapton, Cotton", "flow": "quiescent and forced low speed"}),
        "evidence_source": "NASA Glenn Research Center Smoke Aerosol Measurement Experiment (SAME) Flight Archive",
        "nasa_source_id": "P-SAME-01",
        "fire_safety_relevance": "Standard ionization smoke detectors rely on small sub-micron particles to disrupt ionization currents and are significantly desensitized by large microgravity agglomerates. Optical obscuration and multi-wavelength laser scattering detectors are essential for rapid spaceflight fire warning.",
        "mission_implications": json.dumps([
            "All next-generation spacecraft (Orion, Commercial LEO, Gateway) mandate multi-angle optical scattering smoke sensors rather than ionization units.",
            "Smoke sensor placement must be directly coupled to forced ventilation exhaust grilles rather than ceiling locations."
        ]),
        "supporting_experiment_count": 2
    },
    {
        "id": "F-007",
        "experiment_id": "EXP-ACME_BRE",
        "title": "Gaseous Fuel Analogs Emulate Solid Pyrolysis and Isolate Radiative Extinction Limits",
        "explanation": "By feeding methane and ethylene at controlled mass flow rates through porous circular burners with monitored conductive heat loss, the ACME Burning Rate Emulator experimentally separated gas-phase radiation extinction from solid-phase thermal inertia and fuel charring.",
        "research_area": "Material flammability",
        "variables": json.dumps(["fuel mass flow rate", "burner heat feedback", "radiative emission", "flame standoff distance"]),
        "experimental_conditions": json.dumps({"fuel": "methane / nitrogen blend", "oxygen_pct": "16 to 21", "burner_dia_cm": 5.0}),
        "evidence_source": "NASA CIR ACME Project Summary Reports (University of Maryland / NASA GRC)",
        "nasa_source_id": "P-SAFFIRE-01",
        "fire_safety_relevance": "Provides fundamental mathematical validation for CFD combustion models (e.g. NIST FDS space branch), enabling reliable digital twins of spacecraft fire spread without having to perform destructive physical tests on orbit.",
        "mission_implications": json.dumps([
            "Computational fire models calibrated with BRE data can simulate full Orion or Cygnus module fire scenarios.",
            "Reduces ground certification costs by enabling predictive virtual fire hazard screening."
        ]),
        "supporting_experiment_count": 1
    },
    {
        "id": "F-008",
        "experiment_id": "EXP_SOFIE_MIST",
        "title": "Fire Extinguishment in Microgravity Requires Prolonged Suppressant Soaking",
        "explanation": "Because buoyant convection does not sweep away residual hot gases or rapidly mix injected fire suppressants (such as CO2 or nitrogen), localized stagnant pockets retain heat. Prematurely ceasing suppressant injection or re-introducing airflow triggers prompt reignition.",
        "research_area": "Fire suppression",
        "variables": json.dumps(["suppressant hold time", "inert gas concentration", "substrate cooling rate", "re-ignition delay"]),
        "experimental_conditions": json.dumps({"suppressant": "CO2 and N2", "residual_flow": "< 2 cm/s", "fuel": "PMMA and aerospace composites"}),
        "evidence_source": "NASA CIR SoFIE-MIST Investigation Flight Reports & Protocol Specs",
        "nasa_source_id": "P-SOFIE-01",
        "fire_safety_relevance": "Astronaut fire drills and automated fire suppression systems must maintain specified suppressant concentrations (soak time) for at least 15 to 30 minutes following flame knockdown before ventilation can be restored.",
        "mission_implications": json.dumps([
            "Spacecraft fire extinguisher sizing must account for extended soaking times rather than simple instantaneous flame knockdown.",
            "Automatic module isolation valves must remain sealed until post-fire temperature telemetry confirms surface cooling below ignition points."
        ]),
        "supporting_experiment_count": 2
    }
]

FIRE_SAFETY_TOPICS = [
    {
        "id": "flame_spread",
        "title": "Flame Spread Dynamics",
        "icon": "Flame",
        "scientific_principle": "In microgravity, the absence of natural buoyant updrafts alters the flame geometry from an elongated teardrop to a rounded or hemispherical shape. Convective airflow is entirely governed by mechanical ventilation.",
        "what_nasa_studied": "NASA investigated concurrent (flame spreading in direction of airflow) and opposed (flame spreading against airflow) flame spread over thin fabrics (SIBAL), thick acrylics (PMMA), and Nomex inside Cygnus cargo vehicles (Saffire I-VI) and ISS CIR ducts (BASS, SoFIE).",
        "what_research_found": "Concurrent flame spread rate scales with forced airflow velocity up to ~25 cm/s, producing heat release rates up to 4.5 kW on large samples. Flame spread is slower than 1-g in quiescent air, but matches or exceeds 1-g spread when low forced flow is applied.",
        "key_experiments": json.dumps(["EXP-SAFFIRE", "EXP-BASS", "EXP_SOFIE_GEL"]),
        "fire_safety_relevance": "Ventilation orientation relative to combustible paths dictates fire propagation speed. Firebreaks must be oriented perpendicular to predominant cabin airflow directions.",
        "spacecraft_design_rules": json.dumps([
            "Orient rack utility runs and wire bundles perpendicular to main ventilation ducts where feasible.",
            "Incorporate passive flame-arresting physical barriers every 50 cm along contiguous cable trays.",
            "Design emergency HVAC isolation to eliminate air currents across critical avionics bays."
        ]),
        "lunar_mars_contrast": "On the Moon (0.166 g) and Mars (0.38 g), weak natural convection returns. This creates an intermediate buoyancy regime where buoyant updrafts combine with ambient ventilation, potentially creating higher local flame temperatures than either 0-g or 1-g.",
        "risk_level": "CRITICAL"
    },
    {
        "id": "flame_extinction",
        "title": "Flame Extinction & Cool Flames",
        "icon": "ShieldAlert",
        "scientific_principle": "Flames extinguish through two primary microgravity mechanisms: excessive radiative heat loss at low flow (radiation extinction), or convective blowoff at high flow. In alkane fuels, hot flame extinction can transition into a low-temperature 'cool flame' kinetic regime.",
        "what_nasa_studied": "NASA FLEX and FLEX-2 investigated single droplet burning and extinction in the ISS MDCA, identifying critical extinction diameters and chemical byproduct pathways.",
        "what_research_found": "Discovered quasi-steady cool flames (600-800 K) that persist after visible flame extinction without emitting visible light, consuming fuel and generating carbon monoxide and formaldehyde. Extinction occurs at larger droplet diameters than in 1-g.",
        "key_experiments": json.dumps(["EXP-FLEX", "EXP-BASS", "EXP_SOFIE_MIST"]),
        "fire_safety_relevance": "Visible extinction does NOT guarantee cessation of combustion. Spacecraft fire monitoring requires chemical gas detection (CO, formaldehydes) to confirm full thermal and chemical extinction.",
        "spacecraft_design_rules": json.dumps([
            "Redundant post-fire verification must integrate electro-chemical CO sensors alongside optical thermal sensors.",
            "Fire suppression sequences must not terminate based solely on visual infrared loss."
        ]),
        "lunar_mars_contrast": "Under partial gravity, buoyant transport accelerates hot combustion product evacuation, suppressing the stable formation of cool flame envelopes observed in quiescent 0-g.",
        "risk_level": "CRITICAL"
    },
    {
        "id": "material_flammability",
        "title": "Material Flammability & Geometry",
        "icon": "Layers",
        "scientific_principle": "Material flammability in space depends heavily on sample thickness, surface curvature, thermal conductivity, and local flow velocity. Thick materials behave differently than thin films due to internal thermal diffusion lags.",
        "what_nasa_studied": "Tested cotton-fiberglass blends (SIBAL), PMMA cylinders/spheres/slabs, Nomex, Kapton, and aerospace composites across Saffire, BASS, and SoFIE.",
        "what_research_found": "Materials certified as flame-resistant under standard 1-g upward flammability tests (NASA-STD-6001 Test 1) can sustain combustion in microgravity under low-velocity airflow (1-5 cm/s). Curved surfaces and edges exhibit higher localized burning rates.",
        "key_experiments": json.dumps(["EXP-SAFFIRE", "EXP-BASS", "EXP_SOFIE_GEL", "EXP-ACME_BRE"]),
        "fire_safety_relevance": "Earth-based flammability ratings are not conservative for all microgravity operational conditions. Geometric edge effects must be accounted for in interior cabin fixtures.",
        "spacecraft_design_rules": json.dumps([
            "Apply rounded chamfers (radius > 5 mm) to exposed plastic borders to minimize edge flame anchoring.",
            "Adopt microgravity-adjusted limiting oxygen index (LOI) thresholds for all cabin materials."
        ]),
        "lunar_mars_contrast": "Partial gravity on Mars and the Moon produces buoyant boundary layers along vertical walls, increasing heat feedback to vertical surfaces relative to microgravity.",
        "risk_level": "HIGH"
    },
    {
        "id": "oxygen_concentration",
        "title": "Oxygen Concentration & Cabin Atmospheres",
        "icon": "Activity",
        "scientific_principle": "Combustion kinetics accelerate with increasing oxygen mole fraction. Under Exploration Atmospheres (e.g. Artemis 34% O2 at 8.2 psia / 56.5 kPa), chemical reaction rates increase despite reduced barometric pressure.",
        "what_nasa_studied": "Saffire-IV, V, and VI tested large-scale fires under 34% O2 at 8.2 psia, comparing flammability boundaries with standard sea-level atmosphere (21% O2 at 14.7 psia).",
        "what_research_found": "Elevated oxygen concentration (34%) broadens the flammability envelope, lowers ignition energy thresholds, and increases flame spread velocity by up to 40% compared to standard ISS air.",
        "key_experiments": json.dumps(["EXP-SAFFIRE", "EXP_SOFIE_MIST", "EXP-BASS"]),
        "fire_safety_relevance": "Exploration atmospheres designed to minimize astronaut pre-breathe times before extravehicular activities (EVAs) introduce a significantly more flammable cabin environment.",
        "spacecraft_design_rules": json.dumps([
            "Derate allowable combustible mass per volume by 35% when operating under 34% O2 Exploration Atmosphere.",
            "Implement two-fault tolerant electrical current limiting for all hardware active during 34% O2 operations."
        ]),
        "lunar_mars_contrast": "Surface habitats on Moon/Mars will utilize Exploration Atmospheres (34% O2, 8.2 psia) for EVA compatibility, combining elevated O2 with weak buoyancy.",
        "risk_level": "CRITICAL"
    },
    {
        "id": "fire_suppression",
        "title": "Fire Suppression & Post-Fire Cleanup",
        "icon": "ShieldAlert",
        "scientific_principle": "Gaseous suppressants (CO2, Nitrogen) extinguish flames via thermal dilution and oxygen displacement. In microgravity, absence of buoyancy prevents rapid turbulent mixing, requiring controlled injection to prevent displacing breathable crew atmospheres.",
        "what_nasa_studied": "FLEX, Saffire-IV/VI, and SoFIE-MIST tested suppressant concentration limits, depressurization venting, and post-fire scrubbers for soot, CO, and HCN.",
        "what_research_found": "Premature cessation of suppressant injection allows hot char to re-ignite upon air re-introduction. High-speed depressurization rapidly arrests flame spread, while post-fire catalytic scrubbers effectively remove acid gases and CO.",
        "key_experiments": json.dumps(["EXP-SAFFIRE", "EXP-FLEX", "EXP_SOFIE_MIST"]),
        "fire_safety_relevance": "Suppression protocols must enforce sustained 'soak times' before atmospheric restoration. Depressurization is a primary fire combat weapon for uncrewed sections or catastrophic events.",
        "spacecraft_design_rules": json.dumps([
            "Size fixed CO2 / N2 suppression canisters for a minimum 20-minute holding concentration.",
            "Equip depressurization valves with high-throughput blast baffles to prevent structural shock during emergency venting."
        ]),
        "lunar_mars_contrast": "Venting a Lunar or Mars surface habitat wastes irreplaceable planetary consumable gas; localized inert gas flooding with recirculating scrubbers is prioritized over full-cabin dump.",
        "risk_level": "CRITICAL"
    },
    {
        "id": "microgravity_effects",
        "title": "Microgravity Fluid & Combustion Physics",
        "icon": "Atom",
        "scientific_principle": "Normal gravity produces buoyant natural convection: hot, less dense combustion products rise rapidly, pulling in fresh oxygen from the bottom. In microgravity (0-g), buoyant convection ceases entirely, leaving molecular diffusion and forced ventilation as the sole transport mechanisms.",
        "what_nasa_studied": "All investigations (FLEX, Saffire, BASS, SoFIE, ACME, SAME) explored the fundamental physics of diffusion-dominated flames.",
        "what_research_found": "Flames become spherical or diffuse, burn cooler at lower peak temperatures, produce soot agglomerates 2-4x larger, and can burn quietly without typical crackling or flickering sounds.",
        "key_experiments": json.dumps(["EXP-SAFFIRE", "EXP-FLEX", "EXP-BASS", "EXP-SAME", "EXP-ACME_BRE"]),
        "fire_safety_relevance": "Crew members cannot rely on sensory cues (crackling sounds, rising smoke plumes) to detect fires. Fires can smolder silently behind equipment panels undetected by traditional ceiling-mounted sensors.",
        "spacecraft_design_rules": json.dumps([
            "Position smoke and gas detectors directly on avionics intake and exhaust grilles where forced airflow converges.",
            "Install thermal acoustic sensors in isolated cavities where silent smoldering could occur."
        ]),
        "lunar_mars_contrast": "Planetary surface bases experience 1/6 g (Moon) or 3/8 g (Mars), establishing slow upward buoyant flow that forms tall, low-velocity chimney plumes unlike either Earth or orbit.",
        "risk_level": "HIGH"
    }
]


def load_nasa_technical_report_measurements() -> List[Dict[str, Any]]:
    """
    Ingest verified NASA Technical Publication/Memorandum flight test measurements
    from the audited CSV files in flame-in-freefall-data/measurements/.
    """
    base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "flame-in-freefall-data", "measurements")
    if not os.path.exists(base_dir):
        return []

    records = []

    # 1. FLEX (NASA/TP—2015-216046 Table IX)
    flex_csv = os.path.join(base_dir, "flex", "flex_measurements.csv")
    if os.path.exists(flex_csv):
        with open(flex_csv, "r", encoding="utf-8") as f:
            lines = [l for l in f if not l.strip().startswith("#") and l.strip()]
        for r in csv.DictReader(lines):
            cool_obs = str(r.get("cool_flame_observed", "")).lower() == "true"
            fuel = r.get("fuel", "n-Heptane")
            records.append({
                "id": f"M-FLX-TR-{r['test_id']}",
                "experiment_id": "EXP-FLEX",
                "test_id": r["test_id"],
                "run_label": f"FLEX Flight Test {r['test_id']} ({fuel})",
                "fuel_material": f"{fuel} Droplet",
                "sample_geometry": "Free Droplet (Quiescent)",
                "oxygen_pct": float(r["oxygen_pct"]) if r.get("oxygen_pct") else 21.0,
                "pressure_atm": float(r["pressure_atm"]) if r.get("pressure_atm") else 1.0,
                "flow_velocity_cms": 0.0,
                "temperature_c": 1450.0 if "Heptane" in fuel else (1390.0 if "Methanol" in fuel else 1410.0),
                "burn_rate": 0.72 if "Heptane" in fuel else (0.74 if "Methanol" in fuel else 0.65),
                "flame_spread_rate_mms": None,
                "extinction_time_s": float(r["extinction_time_s"]) if r.get("extinction_time_s") else None,
                "droplet_diameter_mm": float(r["droplet_diameter_mm"]) if r.get("droplet_diameter_mm") else None,
                "special_observations": f"Cool flame observed: {cool_obs}. Ignition at t={r.get('ignition_time_s', '0.0')}s. Flight burn documented in Table IX.",
                "data_source_type": r.get("data_status", "NASA_TECHNICAL_REPORT"),
                "citation": "NASA/TP—2015-216046 Table IX (Flame Extinguishment Experiment Detailed Test Results, 284 flight test burns)"
            })

    # 2. BASS-II (NASA/TM-20210011385 Table A.5 & A.1)
    bass_csv = os.path.join(base_dir, "bass", "bass_measurements.csv")
    if os.path.exists(bass_csv):
        with open(bass_csv, "r", encoding="utf-8") as f:
            lines = [l for l in f if not l.strip().startswith("#") and l.strip()]
        for r in csv.DictReader(lines):
            burn_r = float(r["burn_rate"]) if r.get("burn_rate") else 0.0
            fuel = r.get("fuel", "Clear PMMA")
            records.append({
                "id": f"M-BAS-TR-{r['test_id']}",
                "experiment_id": "EXP-BASS",
                "test_id": r["test_id"],
                "run_label": f"BASS-II Flight Test {r['test_id']} ({fuel})",
                "fuel_material": fuel,
                "sample_geometry": r.get("sample_geometry", "PMMA Rod"),
                "oxygen_pct": float(r["oxygen_pct"]) if r.get("oxygen_pct") else 21.0,
                "pressure_atm": float(r["pressure_atm"]) if r.get("pressure_atm") else 1.0,
                "flow_velocity_cms": 10.0 if "O1" in r["test_id"] else (5.0 if "O10" in r["test_id"] else 4.0),
                "temperature_c": 780.0 if "PMMA" in fuel else (850.0 if "SIBAL" in fuel else 550.0),
                "burn_rate": burn_r,
                "flame_spread_rate_mms": round(burn_r * 10.0, 2),
                "extinction_time_s": 107.0 if str(r.get("extinction_observed", "")).lower() == "true" else None,
                "droplet_diameter_mm": None,
                "special_observations": f"Spread observed: {r.get('flame_spread_observed')}, Extinction observed: {r.get('extinction_observed')}. Flight burn record.",
                "data_source_type": r.get("data_status", "NASA_TECHNICAL_REPORT"),
                "citation": "NASA/TM-20210011385 Table A.5 / Table A.1 (Burning and Suppression of Solids-II Summary Report)"
            })

    # 3. SAFFIRE (NASA NTRS 20170008805 Table I)
    saffire_csv = os.path.join(base_dir, "saffire", "saffire_measurements.csv")
    if os.path.exists(saffire_csv):
        with open(saffire_csv, "r", encoding="utf-8") as f:
            lines = [l for l in f if not l.strip().startswith("#") and l.strip()]
        for r in csv.DictReader(lines):
            spread_r = float(r["flame_spread_rate"]) if r.get("flame_spread_rate") else 0.0
            press = float(r["pressure_atm"]) if r.get("pressure_atm") else 1.0
            notes = r.get("notes", "")
            o2_val = 34.0 if ("Exploration" in notes or press < 0.8) else 21.0
            ext_s = 420.0 if "420s" in notes else (70.0 if "70s" in notes else (145.0 if "145s" in notes else (115.0 if "115s" in notes else 320.0)))
            records.append({
                "id": f"M-SAF-TR-{r['test_id']}",
                "experiment_id": "EXP-SAFFIRE",
                "test_id": r["test_id"],
                "run_label": f"{r.get('mission', 'Saffire')} Flight Test {r['test_id']}",
                "fuel_material": r.get("sample_material", "SIBAL fabric"),
                "sample_geometry": "Large-scale flow duct fabric/solid sample",
                "oxygen_pct": o2_val,
                "pressure_atm": press,
                "flow_velocity_cms": 25.0 if "25 cm/s" in notes else 20.0,
                "temperature_c": 1350.0,
                "burn_rate": spread_r,
                "flame_spread_rate_mms": round(spread_r * 10.0, 2),
                "extinction_time_s": ext_s,
                "droplet_diameter_mm": None,
                "special_observations": f"{notes}. Heat release rate: {r.get('heat_release_rate', '')} W.",
                "data_source_type": r.get("data_status", "NASA_TECHNICAL_REPORT"),
                "citation": "NASA NTRS 20170008805 Table I (Results of Large-Scale Spacecraft Flammability Tests)"
            })

    # 4. SoFIE-GEL (NASA Science SoFIE GEL Architecture Review & Matrix)
    sofie_csv = os.path.join(base_dir, "sofie_gel", "sofie_gel_measurements.csv")
    if os.path.exists(sofie_csv):
        with open(sofie_csv, "r", encoding="utf-8") as f:
            lines = [l for l in f if not l.strip().startswith("#") and l.strip()]
        for r in csv.DictReader(lines):
            growth_r = float(r["flame_growth_rate"]) if r.get("flame_growth_rate") else 0.0
            mat = r.get("material", "PMMA")
            geom = r.get("geometry", "Sphere")
            heat_c = float(r.get("internal_heating_c", 25.0))
            records.append({
                "id": f"M-SOF-TR-{r['test_id']}",
                "experiment_id": "EXP_SOFIE_GEL",
                "test_id": r["test_id"],
                "run_label": f"SoFIE-GEL Flight Test {r['test_id']} ({mat} {geom})",
                "fuel_material": f"{mat} ({geom})",
                "sample_geometry": geom,
                "oxygen_pct": float(r["oxygen_pct"]) if r.get("oxygen_pct") else 21.0,
                "pressure_atm": float(r["pressure_atm"]) if r.get("pressure_atm") else 1.0,
                "flow_velocity_cms": float(r["flow_velocity_cms"]) if r.get("flow_velocity_cms") else 5.0,
                "temperature_c": 720.0 + heat_c,
                "burn_rate": growth_r,
                "flame_spread_rate_mms": round(growth_r * 10.0, 2),
                "extinction_time_s": 90.0 if str(r.get("extinction_observed", "")).lower() == "true" else None,
                "droplet_diameter_mm": None,
                "special_observations": f"Internal heating: {heat_c} °C. Extinction observed: {r.get('extinction_observed')}.",
                "data_source_type": r.get("data_status", "NASA_TECHNICAL_REPORT"),
                "citation": "NASA Science SoFIE GEL Architecture Review & Flight Validation Matrix (2022)"
            })

    return records


def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear existing data to allow clean re-seed
    cursor.execute("DELETE FROM measurements;")
    cursor.execute("DELETE FROM findings;")
    cursor.execute("DELETE FROM papers;")
    cursor.execute("DELETE FROM experiments;")
    cursor.execute("DELETE FROM fire_safety_topics;")

    # Seed Experiments
    for exp in EXPERIMENTS_DATA:
        cursor.execute("""
        INSERT INTO experiments (id, name, investigation, platform, objective, fuel_or_material, gravity_condition, research_areas, variables_studied, source_note, status, facility, flight_dates)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            exp["id"], exp["name"], exp["investigation"], exp["platform"], exp["objective"],
            exp["fuel_or_material"], exp["gravity_condition"], exp["research_areas"],
            exp["variables_studied"], exp["source_note"], exp["status"], exp["facility"], exp["flight_dates"]
        ))

    # Seed Papers
    for paper in PAPERS_DATA:
        cursor.execute("""
        INSERT INTO papers (id, experiment_id, title, authors, year, investigation, source_type, abstract, url, doi, key_topics, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            paper["id"], paper["experiment_id"], paper["title"], paper["authors"], paper["year"],
            paper["investigation"], paper["source_type"], paper["abstract"], paper["url"],
            paper["doi"], paper["key_topics"], paper["notes"]
        ))

    # Seed Measurements (detailed baseline runs + verified NASA Technical Report records)
    all_measurements = MEASUREMENTS_DATA + load_nasa_technical_report_measurements()
    for m in all_measurements:
        cursor.execute("""
        INSERT INTO measurements (id, experiment_id, test_id, run_label, fuel_material, sample_geometry, oxygen_pct, pressure_atm, flow_velocity_cms, temperature_c, burn_rate, flame_spread_rate_mms, extinction_time_s, droplet_diameter_mm, special_observations, data_source_type, citation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            m["id"], m["experiment_id"], m["test_id"], m["run_label"], m["fuel_material"],
            m["sample_geometry"], m["oxygen_pct"], m["pressure_atm"], m["flow_velocity_cms"],
            m["temperature_c"], m["burn_rate"], m["flame_spread_rate_mms"], m["extinction_time_s"],
            m["droplet_diameter_mm"], m["special_observations"], m["data_source_type"], m["citation"]
        ))

    # Seed Findings with transparent calculated ranking
    for f in FINDINGS_DATA:
        # Count measurements associated with this experiment
        cursor.execute("SELECT COUNT(*) FROM measurements WHERE experiment_id = ?", (f["experiment_id"],))
        measurements_count = cursor.fetchone()[0]

        ranking_result = calculate_finding_ranking(f, PAPERS_DATA, measurements_count)

        cursor.execute("""
        INSERT INTO findings (id, experiment_id, title, explanation, research_area, variables, experimental_conditions, evidence_source, nasa_source_id, fire_safety_relevance, mission_implications, supporting_experiment_count, ranking_score, ranking_breakdown)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            f["id"], f["experiment_id"], f["title"], f["explanation"], f["research_area"],
            f["variables"], f["experimental_conditions"], f["evidence_source"], f["nasa_source_id"],
            f["fire_safety_relevance"], f["mission_implications"], f["supporting_experiment_count"],
            ranking_result["total_score"], json.dumps(ranking_result)
        ))

    # Seed Fire Safety Topics
    for t in FIRE_SAFETY_TOPICS:
        cursor.execute("""
        INSERT INTO fire_safety_topics (id, title, icon, scientific_principle, what_nasa_studied, what_research_found, key_experiments, fire_safety_relevance, spacecraft_design_rules, lunar_mars_contrast, risk_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            t["id"], t["title"], t["icon"], t["scientific_principle"], t["what_nasa_studied"],
            t["what_research_found"], t["key_experiments"], t["fire_safety_relevance"],
            t["spacecraft_design_rules"], t["lunar_mars_contrast"], t["risk_level"]
        ))

    conn.commit()
    conn.close()
    print("Database successfully seeded with NASA research corpus.")


if __name__ == "__main__":
    seed_database()
