@echo off
title Stop Valuation ^& Inspection Studio
color 0C

echo ===============================================================================
echo            STOPPING VALUATION ^& SITE INSPECTION STUDIO
echo ===============================================================================
echo.

where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [*] Gracefully stopping Docker containers (MongoDB, MinIO, App)...
    docker compose stop
    echo.
    echo [OK] All Valuation Studio services stopped safely. Data is fully preserved!
) else (
    echo [!] Docker is not active. Close any running command prompt windows to stop Node.js.
)

echo.
pause
