@echo off
setlocal enabledelayedexpansion

:: Ensure the script runs in the directory where the file is located (prevents Windows System32 directory bug)
cd /d "%~dp0"

title Valuation & Inspection Studio - Production Docker Engine
color 0B

echo ===============================================================================
echo            EVALO - VALUATION & SITE INSPECTION STUDIO
echo               DRR Valuation Consultants Pvt. Ltd.
echo            [ STRICT PRODUCTION DOCKER ENGINE LAUNCHER ]
echo ===============================================================================
echo Working Directory: %CD%
echo.

:: 1. Verify Docker CLI is installed
echo [*] Checking Docker installation...
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Docker is not installed on this PC!
    echo Valuation Studio strictly requires Docker Engine & Docker Compose for Production.
    echo.
    echo Please install Docker Desktop for Windows:
    echo 👉 https://www.docker.com/products/docker-desktop/
    echo.
    goto end_pause
)

:: 2. Check if Docker Daemon is running; if not, automatically start it
echo [*] Checking if Docker Daemon / Docker Desktop is running...
docker info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Docker daemon is not active. Attempting to start Docker Desktop automatically...
    
    :: Look for standard Docker Desktop paths
    set "DOCKER_PATH="
    if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_PATH=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    ) else if exist "%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_PATH=%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe"
    ) else if exist "%LocalAppData%\Docker\Docker Desktop.exe" (
        set "DOCKER_PATH=%LocalAppData%\Docker\Docker Desktop.exe"
    )

    if defined DOCKER_PATH (
        echo [*] Launching Docker Desktop from: "!DOCKER_PATH!"
        start "" "!DOCKER_PATH!"
    ) else (
        echo [*] Launching Docker Desktop via Windows command...
        start "" "Docker Desktop" 2>nul
    )

    echo [*] Waiting for Docker Engine daemon to become fully ready (this takes 10-25 seconds)...
    set "DOCKER_READY=0"
    for /L %%i in (1,1,30) do (
        docker info >nul 2>nul
        if !ERRORLEVEL! EQU 0 (
            set "DOCKER_READY=1"
            goto docker_started
        )
        <nul set /p=.
        timeout /t 2 >nul
    )

    :docker_started
    echo.
    if !DOCKER_READY! EQU 0 (
        echo.
        echo [ERROR] Docker Desktop took too long to initialize or requires user permission.
        echo Please manually open 'Docker Desktop' from your Start Menu and re-run this script.
        echo.
        goto end_pause
    )
)

echo [OK] Docker Engine is active and healthy!
echo.
echo ===============================================================================
echo [*] Launching Complete Production Stack (App + MongoDB 7.0 + MinIO S3)...
echo ===============================================================================
echo.

docker compose up --build -d
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Docker Compose failed to build or start the containers!
    echo Please check if port 3000, 27017, or 9000 is already in use by another program.
    echo.
    goto end_pause
)

echo.
echo ===============================================================================
echo [SUCCESS] Valuation Studio is LIVE in Production Docker!
echo ===============================================================================
echo - Web & API Portal:  http://localhost:3000
echo - MongoDB Database:  Port 27017 (Persistent Volume: mongo_data)
echo - MinIO S3 Console:  http://localhost:9001 (User: minioadmin / Pass: minioadmin)
echo ===============================================================================
echo.
echo [*] Opening Valuation Studio in your browser in 3 seconds...
timeout /t 3 >nul
start http://localhost:3000
echo.
echo ===============================================================================
echo [ACTIVE] Production containers are running in the background.
echo - To view live container logs: Press any key below.
echo - To stop services safely: Run STOP_VALUATION_STUDIO.bat
echo ===============================================================================
pause
echo.
echo [*] Streaming live container logs (Press Ctrl+C to exit log view):
docker compose logs -f app

:end_pause
echo.
echo ===============================================================================
echo Process halted. Press any key to close this window.
echo ===============================================================================
pause
