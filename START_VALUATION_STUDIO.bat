@echo off
title Valuation ^& Inspection Studio - Windows Launcher
color 0B

echo ===============================================================================
echo            EVALO - VALUATION ^& SITE INSPECTION STUDIO
echo               DRR Valuation Consultants Pvt. Ltd.
echo ===============================================================================
echo.

:: Check if Docker is installed and running
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [*] Checking Docker daemon status...
    docker info >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Docker Desktop is running!
        echo [*] Starting full-fledged production stack (App + MongoDB + MinIO S3)...
        echo.
        docker compose up -d
        if %ERRORLEVEL% EQU 0 (
            echo.
            echo ===============================================================================
            echo [SUCCESS] Valuation Studio is running successfully in Docker!
            echo ===============================================================================
            echo - Web Application:   http://localhost:3000
            echo - MongoDB Database:  Port 27017
            echo - MinIO S3 Console:  http://localhost:9001 (minioadmin / minioadmin)
            echo ===============================================================================
            echo.
            echo [*] Launching Valuation Studio in your default browser...
            timeout /t 2 >nul
            start http://localhost:3000
            echo.
            echo Press any key to view live streaming container logs (or close this window)...
            pause >nul
            docker compose logs -f app
            goto end
        )
    )
)

:: Fallback to local Node.js if Docker is not active
echo [!] Docker Desktop is not detected or not started.
echo [*] Checking local Node.js runtime...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Neither Docker Desktop nor Node.js was found on your PC.
    echo Please install Docker Desktop (https://www.docker.com) OR Node.js (https://nodejs.org).
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js runtime detected:
node -v
echo.
echo [*] Checking dependencies...
if not exist "node_modules\" (
    echo [*] Installing required packages...
    call npm install
)

echo [*] Starting local Valuation Studio server on http://localhost:3000...
start http://localhost:3000
call npm run dev

:end
