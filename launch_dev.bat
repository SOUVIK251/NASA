@echo off
title Launch NASA Flame in Freefall Dev Servers
echo ======================================================================
echo   FLAME IN FREEFALL -- NASA COMBUSTION WORKSTATION (DETACHED DEV LAUNCH)
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Check database
if not exist "backend\flame_research.db" (
    echo [+] Initializing research database...
    py backend\seed_data.py
)

:: 2. Launch FastAPI backend in dedicated persistent window
echo [+] Starting FastAPI Backend (Port 8000)...
start "NASA Backend (FastAPI :8000)" cmd /k "cd /d "%~dp0backend" && py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

:: 3. Wait briefly for backend to bind port
timeout /t 2 /nobreak >nul

:: 4. Launch Vite frontend in dedicated persistent window
echo [+] Starting Vite Frontend (Port 5173)...
start "NASA Frontend (Vite :5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ======================================================================
echo   DEV SERVERS LAUNCHED IN INDEPENDENT PERSISTENT WINDOWS!
echo.
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://127.0.0.1:8000
echo   - API Docs: http://127.0.0.1:8000/docs
echo.
echo   These server windows remain running even when Antigravity exits.
echo   To stop both servers, close their command windows or run:
echo     stop_servers.bat
echo ======================================================================
echo.
pause
