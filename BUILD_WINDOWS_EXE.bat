@echo off
setlocal enabledelayedexpansion

:: Ensure the script runs in the directory where the file is located
cd /d "%~dp0"

title Build Standalone Windows EXE
color 0E

echo ===============================================================================
echo       BUILD STANDALONE WINDOWS EXECUTABLE (.EXE) FOR VALUATION STUDIO
echo ===============================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is required to compile the standalone .exe.
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [*] Building production web and server bundles...
call npm run build

echo [*] Compiling standalone Windows ValuationStudio.exe using pkg...
call npx @vercel/pkg dist/server.cjs --target node18-win-x64 --output dist/ValuationStudio.exe

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo [SUCCESS] Standalone Executable created!
    echo Location: dist\ValuationStudio.exe
    echo ===============================================================================
    echo You can now run 'dist\ValuationStudio.exe' directly on any Windows 64-bit PC.
) else (
    echo [!] Build encountered an error. You can also use START_VALUATION_STUDIO.bat for 1-click execution.
)

echo.
echo ===============================================================================
echo Build process finished. Press any key to close this window.
echo ===============================================================================
pause

