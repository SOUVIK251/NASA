"""
Database module for Flame in Freefall.
Uses SQLite to store structured NASA microgravity combustion research data.
"""

import sqlite3
import json
import os
from typing import Dict, Any, List, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "flame_research.db")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Experiments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS experiments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        investigation TEXT NOT NULL,
        platform TEXT NOT NULL,
        objective TEXT NOT NULL,
        fuel_or_material TEXT NOT NULL,
        gravity_condition TEXT NOT NULL,
        research_areas TEXT NOT NULL,       -- JSON array
        variables_studied TEXT NOT NULL,    -- JSON array
        source_note TEXT,
        status TEXT DEFAULT 'Completed',
        facility TEXT,
        flight_dates TEXT
    );
    """)

    # Findings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS findings (
        id TEXT PRIMARY KEY,
        experiment_id TEXT NOT NULL,
        title TEXT NOT NULL,
        explanation TEXT NOT NULL,
        research_area TEXT NOT NULL,
        variables TEXT NOT NULL,            -- JSON array
        experimental_conditions TEXT,       -- JSON object
        evidence_source TEXT NOT NULL,
        nasa_source_id TEXT,
        fire_safety_relevance TEXT NOT NULL,
        mission_implications TEXT,          -- JSON array
        supporting_experiment_count INTEGER DEFAULT 1,
        ranking_score REAL DEFAULT 0.0,
        ranking_breakdown TEXT,             -- JSON object
        FOREIGN KEY (experiment_id) REFERENCES experiments (id)
    );
    """)

    # Measurements table (Actual published scientific values & experimental parameters)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS measurements (
        id TEXT PRIMARY KEY,
        experiment_id TEXT NOT NULL,
        test_id TEXT NOT NULL,
        run_label TEXT NOT NULL,
        fuel_material TEXT NOT NULL,
        sample_geometry TEXT,
        oxygen_pct REAL,
        pressure_atm REAL,
        flow_velocity_cms REAL,
        temperature_c REAL,
        burn_rate REAL,
        flame_spread_rate_mms REAL,
        extinction_time_s REAL,
        droplet_diameter_mm REAL,
        special_observations TEXT,
        data_source_type TEXT NOT NULL,     -- 'NASA_PSI_PUBLISHED', 'NASA_TECHNICAL_PAPER'
        citation TEXT NOT NULL,
        FOREIGN KEY (experiment_id) REFERENCES experiments (id)
    );
    """)

    # Papers / Sources table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS papers (
        id TEXT PRIMARY KEY,
        experiment_id TEXT,
        title TEXT NOT NULL,
        authors TEXT NOT NULL,
        year INTEGER NOT NULL,
        investigation TEXT NOT NULL,
        source_type TEXT NOT NULL,
        abstract TEXT NOT NULL,
        url TEXT NOT NULL,
        doi TEXT,
        key_topics TEXT,                    -- JSON array
        notes TEXT
    );
    """)

    # Fire Safety Topics table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fire_safety_topics (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        icon TEXT NOT NULL,
        scientific_principle TEXT NOT NULL,
        what_nasa_studied TEXT NOT NULL,
        what_research_found TEXT NOT NULL,
        key_experiments TEXT NOT NULL,      -- JSON array
        fire_safety_relevance TEXT NOT NULL,
        spacecraft_design_rules TEXT NOT NULL, -- JSON array
        lunar_mars_contrast TEXT NOT NULL,
        risk_level TEXT NOT NULL            -- 'CRITICAL', 'HIGH', 'ELEVATED'
    );
    """)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print("Database schema initialized.")
