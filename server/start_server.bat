@echo off
echo Starting Hairskiin CRM Backend Server...
echo Current Directory: %CD%
echo Script Directory: %~dp0
if exist "venv\Scripts\python.exe" (
    echo Python found in venv.
) else (
    echo Python NOT found in venv.
    pause
    exit /b 1
)
echo.

cd /d "%~dp0"
REM call venv\Scripts\activate.bat
venv\Scripts\python -m uvicorn main:app --reload --port 8000

pause
