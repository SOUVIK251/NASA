@echo off
title Stop NASA Workstation Servers
echo ======================================================================
echo   STOPPING NASA COMBUSTION SERVERS (PORTS 8000 and 5173)
echo ======================================================================
echo.

powershell -NoProfile -Command ^
  "Get-NetTCPConnection -LocalPort 8000, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host ('[+] Terminated process PID ' + $_.OwningProcess + ' on port ' + $_.LocalPort) }"

echo.
echo [+] Ports 8000 and 5173 are now free.
echo.
pause
