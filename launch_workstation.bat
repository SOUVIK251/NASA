@echo off
title NASA Flame in Freefall Workstation
echo ======================================================================
echo   FLAME IN FREEFALL -- NASA COMBUSTION RESEARCH WORKSTATION
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Rebuild frontend if dist does not exist
if not exist "frontend\dist\index.html" (
    echo [+] Building frontend bundle...
    npm --prefix frontend run build
)

:: 2. Launch production workstation server in persistent window
echo [+] Starting Workstation Server on http://127.0.0.1:8000 ...
start "NASA Flame Workstation (:8000)" cmd /k "cd /d "%~dp0" && py run_workstation.py"

echo.
echo ======================================================================
echo   WORKSTATION STARTED!
echo   Open in browser: http://127.0.0.1:8000
echo.
echo   This window remains running even after Antigravity finishes.
echo   To stop, close the workstation window or run stop_servers.bat.
echo ======================================================================
echo.
pause
