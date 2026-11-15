"""
Main FastAPI Application for Flame in Freefall.
A professional space-science research software backend for NASA microgravity
fire and combustion analysis.
"""

import json
import sqlite3
import os
import sys
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

# Load .env variables (Gmail credentials, JWT secret, etc.) before any imports that use them
try:
    from dotenv import load_dotenv
    _env_path = os.path.join(_BACKEND_DIR, ".env")
    load_dotenv(_env_path)
except ImportError:
    pass  # python-dotenv not installed; env vars must be set manually

# ── Bootstrap database BEFORE importing rag_engine ────────────────────────────
# rag_engine instantiates NasaRAGEngine() at module load time, which immediately
# queries the database. On Render (and any fresh deployment) the .db file is NOT
# in the repository (excluded by .gitignore), so it must be initialised and seeded
# before the module is imported.  Any failure here is fatal and must surface loudly.
try:
    from database import get_db_connection, init_db
    init_db()  # Create schema tables (idempotent — uses CREATE TABLE IF NOT EXISTS)

    # Seed research corpus if experiments table is empty
    _conn = get_db_connection()
    _c = _conn.cursor()
    _c.execute("SELECT COUNT(*) FROM experiments;")
    _exp_count = _c.fetchone()[0]
    _conn.close()

    if _exp_count == 0:
        print("[Startup] experiments table is empty — seeding NASA research corpus...")
        from seed_data import seed_database
        seed_database()

        # Verify seed succeeded
        _conn2 = get_db_connection()
        _c2 = _conn2.cursor()
        _c2.execute("SELECT COUNT(*) FROM experiments;")
        _seeded_count = _c2.fetchone()[0]
        _conn2.close()
        if _seeded_count == 0:
            raise RuntimeError(
                "[FATAL] seed_database() completed but the experiments table is still empty. "
                "Check seed_data.py for errors."
            )
        print(f"[Startup] Database seeded successfully: {_seeded_count} experiments loaded.")
    else:
        print(f"[Startup] Database ready: {_exp_count} experiments already present.")

except Exception as _bootstrap_err:
    # Re-raise so the process exits with a clear error message visible in Render logs.
    raise RuntimeError(
        f"[FATAL] Database bootstrap failed — cannot start server. "
        f"Reason: {_bootstrap_err}"
    ) from _bootstrap_err

# ── Application imports (after DB is ready) ────────────────────────────────────
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag_engine import rag_engine
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from simulator.routes import router as simulator_router
from dataset_routes import dataset_router
from ml.routes import router as ml_router
from fire_behaviour_routes import router as fire_behaviour_router
from auth_routes import router as auth_router
from rate_limiter import AuthRateLimiterMiddleware
from auth_models import init_auth_db

app = FastAPI(
    title="Flame in Freefall - Space Science API",
    description="Scientific research workstation API for NASA microgravity combustion and fire-safety data.",
    version="2.0.0"
)

# Enable CORS for local Vite dev server and production integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware for /api/auth/* routes (must be added after CORS)
app.add_middleware(AuthRateLimiterMiddleware)

app.include_router(simulator_router)
app.include_router(dataset_router)
app.include_router(ml_router)
app.include_router(fire_behaviour_router)
app.include_router(auth_router)


@app.on_event("startup")
def on_startup():
    # NOTE: init_db() and seeding are handled at module load (above) so that
    # the rag_engine singleton is fully populated before FastAPI starts.
    # This startup hook only needs to initialise the auth database.
    init_auth_db()
    print(f"[Startup] RAG engine ready: {len(rag_engine.chunks)} indexed chunks.")


@app.get("/api/status")
def get_system_status():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM experiments;")
    exp_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM findings;")
    fnd_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM measurements;")
    meas_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM papers;")
    paper_count = c.fetchone()[0]
    conn.close()

    from gemini_service import gemini_service, get_masked_key
    ai_status = gemini_service.last_status

    return {
        "status": "OPERATIONAL",
        "workstation_mode": "RESEARCH_GRADE",
        "data_source": "NASA Physical Sciences Informatics (PSI) & NTRS",
        "rag_index_chunks": len(rag_engine.chunks),
        "experiments_indexed": exp_count,
        "findings_indexed": fnd_count,
        "measurements_indexed": meas_count,
        "papers_indexed": paper_count,
        "iss_cir_link": "LOCAL PSI REPOSITORY LOADED",
        "active_facility": "Combustion Integrated Rack (CIR) / Multi-user Droplet & SoFIE",
        "gemini_ai": {
            "status": "ONLINE" if ai_status.get("online") else "OFFLINE",
            "provider": "Google Gemini",
            "active_model": ai_status.get("active_model", "gemini-3.1-flash-lite"),
            "key_masked": get_masked_key(),
            "latency_ms": ai_status.get("latency_ms")
        }
    }


@app.get("/api/overview")
def get_overview():
    conn = get_db_connection()
    c = conn.cursor()

    # Core statistics
    c.execute("SELECT COUNT(*) FROM experiments;")
    exp_count = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM papers;")
    paper_count = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM findings;")
    finding_count = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM measurements;")
    measurement_count = c.fetchone()[0]

    c.execute("SELECT DISTINCT investigation FROM experiments;")
    investigations = [row[0] for row in c.fetchall()]

    # Research Areas breakdown
    c.execute("SELECT research_areas FROM experiments;")
    area_freq: Dict[str, int] = {}
    for row in c.fetchall():
        areas = json.loads(row[0])
        for a in areas:
            area_freq[a] = area_freq.get(a, 0) + 1

    # Top Ranked Findings
    c.execute("""
    SELECT f.id, f.title, f.explanation, f.research_area, f.evidence_source,
           f.fire_safety_relevance, f.ranking_score, f.ranking_breakdown,
           e.name as experiment_name, e.investigation, e.platform
    FROM findings f
    JOIN experiments e ON f.experiment_id = e.id
    ORDER BY f.ranking_score DESC
    LIMIT 4;
    """)
    top_findings = []
    for r in c.fetchall():
        top_findings.append({
            "id": r["id"],
            "title": r["title"],
            "explanation": r["explanation"],
            "research_area": r["research_area"],
            "evidence_source": r["evidence_source"],
            "fire_safety_relevance": r["fire_safety_relevance"],
            "ranking_score": r["ranking_score"],
            "ranking_breakdown": json.loads(r["ranking_breakdown"]) if r["ranking_breakdown"] else {},
            "experiment_name": r["experiment_name"],
            "investigation": r["investigation"],
            "platform": r["platform"]
        })

    # Platform distribution
    c.execute("SELECT platform, COUNT(*) FROM experiments GROUP BY platform;")
    platform_dist = [{"platform": r[0], "count": r[1]} for r in c.fetchall()]

    # Key variables
    c.execute("SELECT variables_studied FROM experiments;")
    variables_set = set()
    for row in c.fetchall():
        vars_list = json.loads(row[0])
        for v in vars_list:
            variables_set.add(v)

    # Fire Safety Factors Summary
    c.execute("SELECT id, title, risk_level, fire_safety_relevance FROM fire_safety_topics;")
    safety_summary = [
        {"id": r["id"], "title": r["title"], "risk_level": r["risk_level"], "relevance": r["fire_safety_relevance"]}
        for r in c.fetchall()
    ]

    conn.close()

    return {
        "stats": {
            "experiments_count": exp_count,
            "papers_count": paper_count,
            "findings_count": finding_count,
            "measurements_count": measurement_count,
            "investigations_count": len(investigations),
            "investigations_list": investigations
        },
        "research_areas": [{"name": k, "experiment_count": v} for k, v in area_freq.items()],
        "top_findings": top_findings,
        "platform_distribution": platform_dist,
        "key_variables": sorted(list(variables_set)),
        "safety_factors": safety_summary
    }


@app.get("/api/findings")
def get_findings(
    search: Optional[str] = None,
    investigation: Optional[str] = None,
    research_area: Optional[str] = None,
    variable: Optional[str] = None,
    min_score: Optional[float] = None,
    sort_by: Optional[str] = Query("ranking_desc", enum=["ranking_desc", "ranking_asc", "title_asc"])
):
    conn = get_db_connection()
    c = conn.cursor()

    query = """
    SELECT f.id, f.experiment_id, f.title, f.explanation, f.research_area,
           f.variables, f.experimental_conditions, f.evidence_source,
           f.nasa_source_id, f.fire_safety_relevance, f.mission_implications,
           f.supporting_experiment_count, f.ranking_score, f.ranking_breakdown,
           e.name as experiment_name, e.investigation, e.platform, e.fuel_or_material
    FROM findings f
    JOIN experiments e ON f.experiment_id = e.id
    WHERE 1=1
    """
    params = []

    if search:
        query += " AND (f.title LIKE ? OR f.explanation LIKE ? OR f.fire_safety_relevance LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s])

    if investigation and investigation != "ALL":
        query += " AND e.investigation = ?"
        params.append(investigation)

    if research_area and research_area != "ALL":
        query += " AND f.research_area = ?"
        params.append(research_area)

    if variable and variable != "ALL":
        query += " AND f.variables LIKE ?"
        params.append(f"%{variable}%")

    if min_score is not None:
        query += " AND f.ranking_score >= ?"
        params.append(min_score)

    if sort_by == "ranking_desc":
        query += " ORDER BY f.ranking_score DESC"
    elif sort_by == "ranking_asc":
        query += " ORDER BY f.ranking_score ASC"
    elif sort_by == "title_asc":
        query += " ORDER BY f.title ASC"

    c.execute(query, params)
    rows = c.fetchall()

    findings = []
    for r in rows:
        findings.append({
            "id": r["id"],
            "experiment_id": r["experiment_id"],
            "title": r["title"],
            "explanation": r["explanation"],
            "research_area": r["research_area"],
            "variables": json.loads(r["variables"]) if r["variables"] else [],
            "experimental_conditions": json.loads(r["experimental_conditions"]) if r["experimental_conditions"] else {},
            "evidence_source": r["evidence_source"],
            "nasa_source_id": r["nasa_source_id"],
            "fire_safety_relevance": r["fire_safety_relevance"],
            "mission_implications": json.loads(r["mission_implications"]) if r["mission_implications"] else [],
            "supporting_experiment_count": r["supporting_experiment_count"],
            "ranking_score": r["ranking_score"],
            "ranking_breakdown": json.loads(r["ranking_breakdown"]) if r["ranking_breakdown"] else {},
            "experiment": {
                "name": r["experiment_name"],
                "investigation": r["investigation"],
                "platform": r["platform"],
                "fuel_or_material": r["fuel_or_material"]
            }
        })

    conn.close()
    return {"count": len(findings), "findings": findings}


@app.get("/api/findings/{finding_id}")
def get_finding_detail(finding_id: str):
    conn = get_db_connection()
    c = conn.cursor()

    c.execute("""
    SELECT f.*, e.name as experiment_name, e.investigation, e.platform, e.fuel_or_material, e.objective
    FROM findings f
    JOIN experiments e ON f.experiment_id = e.id
    WHERE f.id = ?;
    """, (finding_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Finding not found")

    finding = {
        "id": row["id"],
        "experiment_id": row["experiment_id"],
        "title": row["title"],
        "explanation": row["explanation"],
        "research_area": row["research_area"],
        "variables": json.loads(row["variables"]) if row["variables"] else [],
        "experimental_conditions": json.loads(row["experimental_conditions"]) if row["experimental_conditions"] else {},
        "evidence_source": row["evidence_source"],
        "nasa_source_id": row["nasa_source_id"],
        "fire_safety_relevance": row["fire_safety_relevance"],
        "mission_implications": json.loads(row["mission_implications"]) if row["mission_implications"] else [],
        "supporting_experiment_count": row["supporting_experiment_count"],
        "ranking_score": row["ranking_score"],
        "ranking_breakdown": json.loads(row["ranking_breakdown"]) if row["ranking_breakdown"] else {},
        "experiment": {
            "name": row["experiment_name"],
            "investigation": row["investigation"],
            "platform": row["platform"],
            "fuel_or_material": row["fuel_or_material"],
            "objective": row["objective"]
        }
    }

    # Fetch supporting measurements
    c.execute("SELECT * FROM measurements WHERE experiment_id = ?;", (row["experiment_id"],))
    meas_rows = c.fetchall()
    measurements = [dict(m) for m in meas_rows]

    # Fetch supporting paper
    paper = None
    if row["nasa_source_id"]:
        c.execute("SELECT * FROM papers WHERE id = ?;", (row["nasa_source_id"],))
        p_row = c.fetchone()
        if p_row:
            paper = dict(p_row)

    conn.close()
    return {
        "finding": finding,
        "supporting_measurements": measurements,
        "supporting_paper": paper
    }


@app.get("/api/explore/experiments")
def get_experiments():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM experiments;")
    rows = c.fetchall()
    experiments = []
    for r in rows:
        exp = dict(r)
        exp["research_areas"] = json.loads(r["research_areas"])
        exp["variables_studied"] = json.loads(r["variables_studied"])
        experiments.append(exp)
    conn.close()
    return experiments


@app.get("/api/explore/experiments/{exp_id}")
def get_experiment_detail(exp_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM experiments WHERE id = ?;", (exp_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Experiment not found")

    exp = dict(row)
    exp["research_areas"] = json.loads(row["research_areas"])
    exp["variables_studied"] = json.loads(row["variables_studied"])

    # Associated findings
    c.execute("SELECT id, title, explanation, research_area, fire_safety_relevance, ranking_score FROM findings WHERE experiment_id = ?;", (exp_id,))
    exp["findings"] = [dict(f) for f in c.fetchall()]

    # Associated measurements
    c.execute("SELECT * FROM measurements WHERE experiment_id = ?;", (exp_id,))
    exp["measurements"] = [dict(m) for m in c.fetchall()]

    # Associated papers
    c.execute("SELECT * FROM papers WHERE experiment_id = ?;", (exp_id,))
    exp["papers"] = [dict(p) for p in c.fetchall()]

    conn.close()
    return exp


@app.get("/api/explore/measurements")
def get_measurements(
    experiment_id: Optional[str] = None,
    material: Optional[str] = None,
    min_o2: Optional[float] = None,
    max_o2: Optional[float] = None,
    min_velocity: Optional[float] = None,
    max_velocity: Optional[float] = None
):
    conn = get_db_connection()
    c = conn.cursor()

    query = """
    SELECT m.*, e.name as experiment_name, e.investigation, e.platform
    FROM measurements m
    JOIN experiments e ON m.experiment_id = e.id
    WHERE 1=1
    """
    params = []

    if experiment_id and experiment_id != "ALL":
        query += " AND m.experiment_id = ?"
        params.append(experiment_id)

    if material and material != "ALL":
        query += " AND m.fuel_material LIKE ?"
        params.append(f"%{material}%")

    if min_o2 is not None:
        query += " AND m.oxygen_pct >= ?"
        params.append(min_o2)

    if max_o2 is not None:
        query += " AND m.oxygen_pct <= ?"
        params.append(max_o2)

    if min_velocity is not None:
        query += " AND m.flow_velocity_cms >= ?"
        params.append(min_velocity)

    if max_velocity is not None:
        query += " AND m.flow_velocity_cms <= ?"
        params.append(max_velocity)

    c.execute(query, params)
    rows = c.fetchall()
    results = [dict(r) for r in rows]
    conn.close()

    return {"count": len(results), "measurements": results}


@app.get("/api/explore/compare")
def compare_experiments(exp_ids: List[str] = Query(...)):
    if len(exp_ids) < 2:
        raise HTTPException(status_code=400, detail="Must provide at least two experiment IDs to compare.")

    conn = get_db_connection()
    c = conn.cursor()

    experiments = []
    for exp_id in exp_ids:
        c.execute("SELECT * FROM experiments WHERE id = ?;", (exp_id,))
        row = c.fetchone()
        if not row:
            continue
        exp = dict(row)
        exp["research_areas"] = json.loads(row["research_areas"])
        exp["variables_studied"] = json.loads(row["variables_studied"])

        # Associated findings count & titles
        c.execute("SELECT id, title, fire_safety_relevance, ranking_score FROM findings WHERE experiment_id = ?;", (exp_id,))
        exp["findings"] = [dict(f) for f in c.fetchall()]

        # Measurements count
        c.execute("SELECT COUNT(*) FROM measurements WHERE experiment_id = ?;", (exp_id,))
        exp["measurement_count"] = c.fetchone()[0]

        # Associated papers count
        c.execute("SELECT COUNT(*) FROM papers WHERE experiment_id = ?;", (exp_id,))
        exp["paper_count"] = c.fetchone()[0]

        experiments.append(exp)

    conn.close()
    return {"compared_count": len(experiments), "experiments": experiments}


class AIQueryRequest(BaseModel):
    query: Optional[str] = None
    top_k: Optional[int] = 5
    mode: Optional[str] = "online"  # "online" (default) or "local"
    simulator_context: Optional[Dict[str, Any]] = None
    action: Optional[str] = None
    explanation_level: Optional[str] = "beginner"


class SimulatorExplainRequest(BaseModel):
    action: str
    simulator_context: Dict[str, Any]
    query: Optional[str] = None
    explanation_level: Optional[str] = "beginner"
    mode: Optional[str] = "online"


@app.post("/api/ai/query")
def query_ai_analyst(payload: AIQueryRequest):
    if not payload.query or not payload.query.strip():
        if payload.action:
            action_map = {
                "explain_flame": "Explain the flame structure and behavior in the current simulation.",
                "explain_experiment": "Explain the NASA research experiment currently loaded in the simulator.",
                "compare_earth_microgravity": "Compare Earth 1g vs Microgravity 0g combustion for this fuel and flow condition.",
                "explain_physics": "Explain the aerothermal and transport physics governing this flame.",
                "analyse_measurements": "Analyse the current physical measurements and sensor telemetry at this timestamp.",
                "explain_fire_safety": "Explain the spacecraft fire safety implications of these experimental observations.",
                "connect_moon_mars": "Connect these combustion findings to Artemis Moon and Mars transit exploration missions.",
                "moon_mars_missions": "Connect these combustion findings to Artemis Moon and Mars transit exploration missions.",
                "understand_happening": "Explain what is happening in this experiment, what the fuel is doing, how oxygen reaches the flame, and why it matters."
            }
            query_str = action_map.get(payload.action, f"Execute scientific analysis for: {payload.action}")
        else:
            raise HTTPException(status_code=400, detail="Query cannot be empty.")
    else:
        query_str = payload.query.strip()

    prefer_online = (payload.mode or "online").lower() != "local"
    result = rag_engine.synthesize_answer(
        query=query_str,
        prefer_online=prefer_online,
        simulator_context=payload.simulator_context,
        action=payload.action,
        explanation_level=payload.explanation_level
    )
    return result


@app.post("/api/ai/simulator-explain")
def explain_simulator(payload: SimulatorExplainRequest):
    action_map = {
        "explain_flame": "Explain the flame structure, shape, and transport regime currently active in the simulator.",
        "explain_experiment": "Explain the NASA research investigation and test setup loaded in the simulator.",
        "compare_earth_microgravity": "Compare Earth 1g vs Microgravity 0g combustion differences, transport mechanisms, and flame geometry.",
        "explain_physics": "Explain the governing aerothermal physics, Burke-Schumann diffusion, and dimensionless numbers.",
        "analyse_measurements": "Analyse current sensor telemetry and distinguish verified measurements from calculated and illustrative values.",
        "explain_fire_safety": "Explain spacecraft fire safety, low-speed flow hazards, and detection/suppression implications.",
        "connect_moon_mars": "Connect findings to Artemis Moon and Mars missions, noting partial-gravity research gaps.",
        "moon_mars_missions": "Connect findings to Artemis Moon and Mars missions, noting partial-gravity research gaps.",
        "understand_happening": "Provide the 6-point UNDERSTAND WHAT IS HAPPENING breakdown for this experiment."
    }
    query_str = payload.query.strip() if (payload.query and payload.query.strip()) else action_map.get(payload.action, f"Explain {payload.action}")
    prefer_online = (payload.mode or "online").lower() != "local"
    result = rag_engine.synthesize_answer(
        query=query_str,
        prefer_online=prefer_online,
        simulator_context=payload.simulator_context,
        action=payload.action,
        explanation_level=payload.explanation_level
    )
    return result


@app.get("/api/ai/status")
def get_ai_status():
    from gemini_service import gemini_service, get_masked_key
    return {
        "status": "ONLINE" if gemini_service.last_status.get("online") else "OFFLINE",
        "provider": "Google Gemini",
        "active_model": gemini_service.last_status.get("active_model", "gemini-3.1-flash-lite"),
        "key_masked": get_masked_key(),
        "key_configured": bool(gemini_service.last_status.get("key_present")),
        "latency_ms": gemini_service.last_status.get("latency_ms"),
        "last_check": gemini_service.last_status.get("last_check_time")
    }


@app.post("/api/ai/ping")
def ping_ai():
    from gemini_service import gemini_service
    return gemini_service.check_health()


@app.get("/api/fire-safety")
def get_fire_safety_topics():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM fire_safety_topics;")
    rows = c.fetchall()

    topics = []
    for r in rows:
        t = dict(r)
        t["key_experiments"] = json.loads(r["key_experiments"])
        t["spacecraft_design_rules"] = json.loads(r["spacecraft_design_rules"])
        topics.append(t)

    conn.close()
    return topics


@app.get("/api/sources")
@app.get("/api/papers")
def get_sources():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM papers ORDER BY year DESC;")
    rows = c.fetchall()

    papers = []
    for r in rows:
        p = dict(r)
        p["key_topics"] = json.loads(r["key_topics"]) if r["key_topics"] else []
        p["sourceUrl"] = p.get("url")
        papers.append(p)

    conn.close()
    return papers


@app.get("/api/sources/{source_id}")
@app.get("/api/papers/{source_id}")
def get_source_by_id(source_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM papers WHERE id = ? COLLATE NOCASE;", (source_id,))
    row = c.fetchone()

    # Check fallback aliases if not matched directly
    if not row:
        aliases = {
            "FLEX": "P-FLEX-01",
            "SAFFIRE": "P-SAFFIRE-01",
            "BASS": "P-BASS-01",
            "SOFIE": "P-SOFIE-01",
            "SAME": "P-SAME-01",
        }
        target_id = aliases.get(source_id.upper()) or aliases.get(source_id)
        if target_id:
            c.execute("SELECT * FROM papers WHERE id = ? COLLATE NOCASE;", (target_id,))
            row = c.fetchone()

    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Research paper unavailable")

    p = dict(row)
    p["key_topics"] = json.loads(row["key_topics"]) if row["key_topics"] else []
    p["sourceUrl"] = p.get("url")
    return p


# Mount built frontend static files with full Single-Page Application (SPA) routing
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    hero_frames_dir = os.path.join(frontend_dist, "hero-frames")
    if os.path.exists(hero_frames_dir):
        app.mount("/hero-frames", StaticFiles(directory=hero_frames_dir), name="hero-frames")

    @app.get("/{full_path:path}")
    async def serve_spa_or_static(full_path: str):
        # Do not catch /api routes - let FastAPI return standard 404 for unmapped API endpoints
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail="API endpoint not found")

        # If a specific static file exists in dist (e.g. favicon.svg, iss_cupola_bg.jpg), serve it
        target_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target_path):
            return FileResponse(target_path)

        # For any client-side route (/overview, /findings, /simulator, etc.), return index.html
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="Frontend index.html not found. Run 'npm run build' first.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
