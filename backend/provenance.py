"""
Data Provenance Enumeration — Flame in Freefall
================================================
Single source of truth for provenance tiers used across backend, API
responses, and indirectly by the frontend ProvenanceType union.

TIERS (ordered from highest to lowest certainty):
  MEASURED_TABLE         – Scalar value copied directly from a cited NASA
                           technical report table (e.g., NASA/TP—2015-216046
                           Table IX). No transformation beyond unit conversion.

  DIGITIZED_FROM_PUBLICATION
                         – Value manually traced or extracted from a figure
                           or table in a peer-reviewed publication. Carries
                           digitization error (typically ±2–5% of range).
                           NOTE: use only when independent digitization from
                           a scanned figure has actually been performed and
                           can be demonstrated by point scatter.

  APPROXIMATED_CURVE     – Time-series curve hand-constructed to be consistent
                           with published burning-rate constants and phase
                           transition times from the literature.  The curve
                           shape and smoothness reflect the analytical D²-law
                           model, not raw sensor scatter.  This is the correct
                           label for the FLEX and BASS time-series CSVs in
                           this project until PSI raw-data files are downloaded.

  CALCULATED             – Derived algebraically from other measured or
                           approximated columns (e.g., D²_mm2 = D_mm²,
                           tau = t / D0², normalized D2_norm).

  MODEL_PREDICTION       – Output of the reduced-order analytical physics
                           engine (Grashof, Spalding B-number, Damköhler) or
                           the PIML regression model.  Not a measurement.

  ILLUSTRATIVE           – Estimated solely for 3-D visualization where no
                           sensor data exists (e.g., flame_diam_mm in FLEX
                           time-series, temp_K profile in BASS CSV).

  METADATA_ONLY          – Experiment-level descriptive metadata only; no
                           time-series or scalar measurement is available.
"""

from enum import Enum


class Provenance(str, Enum):
    MEASURED_TABLE = "MEASURED_TABLE"
    DIGITIZED_FROM_PUBLICATION = "DIGITIZED_FROM_PUBLICATION"
    APPROXIMATED_CURVE = "APPROXIMATED_CURVE"
    CALCULATED = "CALCULATED"
    MODEL_PREDICTION = "MODEL_PREDICTION"
    ILLUSTRATIVE = "ILLUSTRATIVE"
    METADATA_ONLY = "METADATA_ONLY"


# Human-readable labels for API responses and UI rendering
PROVENANCE_LABELS: dict[str, str] = {
    Provenance.MEASURED_TABLE: "Measured (Report Table)",
    Provenance.DIGITIZED_FROM_PUBLICATION: "Digitized from Publication",
    Provenance.APPROXIMATED_CURVE: "Approximated Curve",
    Provenance.CALCULATED: "Calculated",
    Provenance.MODEL_PREDICTION: "Model Prediction",
    Provenance.ILLUSTRATIVE: "Illustrative",
    Provenance.METADATA_ONLY: "Metadata Only",
}

# Short descriptions for tooltip display
PROVENANCE_DESCRIPTIONS: dict[str, str] = {
    Provenance.MEASURED_TABLE:
        "Scalar value taken directly from a cited NASA technical report table. "
        "No transformation beyond unit conversion.",
    Provenance.DIGITIZED_FROM_PUBLICATION:
        "Value extracted from a figure or table in a peer-reviewed publication. "
        "Subject to digitization error (~2–5% of range).",
    Provenance.APPROXIMATED_CURVE:
        "Time-series curve hand-constructed to match published burning-rate "
        "constants and phase transitions. Reflects the D²-law analytical model, "
        "not raw sensor scatter. Not raw flight telemetry.",
    Provenance.CALCULATED:
        "Algebraically derived from other columns (e.g., D²=D², τ=t/D₀²).",
    Provenance.MODEL_PREDICTION:
        "Output of the reduced-order physics engine or PIML regression model. "
        "Not a measurement. Carries ≥30% uncertainty.",
    Provenance.ILLUSTRATIVE:
        "Estimated for 3D visualization only. Not a recorded sensor value. "
        "Toggle 'Hide Illustrative' to see only data-backed elements.",
    Provenance.METADATA_ONLY:
        "Experiment-level metadata only. No time-series or scalar measurement "
        "is currently available for this investigation.",
}

# Confidence ordering (higher index = lower confidence)
PROVENANCE_RANK: dict[str, int] = {
    Provenance.MEASURED_TABLE: 0,
    Provenance.DIGITIZED_FROM_PUBLICATION: 1,
    Provenance.APPROXIMATED_CURVE: 2,
    Provenance.CALCULATED: 3,
    Provenance.MODEL_PREDICTION: 4,
    Provenance.ILLUSTRATIVE: 5,
    Provenance.METADATA_ONLY: 6,
}
