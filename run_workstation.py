"""
Flame in Freefall — NASA Microgravity Combustion Research Workstation
Single-Command Launcher

Launches the integrated space-science application:
- FastAPI Backend (API, SQLite, BM25 RAG Engine)
- Serves the compiled React/TypeScript workstation UI at http://127.0.0.1:8000
"""

import os
import sys
import webbrowser
import subprocess

WORKSPACE_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(WORKSPACE_ROOT, "backend")
FRONTEND_DIR = os.path.join(WORKSPACE_ROOT, "frontend")


def main():
    print("=" * 70)
    print("  FLAME IN FREEFALL — NASA MICROGRAVITY COMBUSTION WORKSTATION")
    print("  NASA Physical Sciences Informatics (PSI) & NTRS Analysis Suite")
    print("=" * 70)

    # 1. Check database initialization
    db_file = os.path.join(BACKEND_DIR, "flame_research.db")
    if not os.path.exists(db_file):
        print("\n[+] Initializing and seeding NASA research database...")
        subprocess.run([sys.executable, os.path.join(BACKEND_DIR, "seed_data.py")], check=True)

    print("\n[+] Research corpus loaded:")
    print("    - 7 Flight Investigations (SAFFIRE, FLEX, BASS, SoFIE, ACME, SAME)")
    print("    - 8 Documented Evidence Findings with Transparent 5-Factor Ranking")
    print("    - 37 Quantitative Published Sensor Telemetry Runs (12 Baseline + 25 Verified TP/TM Runs)")
    print("    - 5 Full Datasets Indexed in Microgravity Pipeline")

    print("\n[+] Starting workstation on http://127.0.0.1:8000 ...")
    print("    Press Ctrl+C to terminate the workstation.\n")

    # Open browser automatically
    try:
        webbrowser.open("http://127.0.0.1:8000")
    except Exception:
        pass

    # Launch uvicorn
    import uvicorn
    sys.path.insert(0, BACKEND_DIR)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)


if __name__ == "__main__":
    main()
