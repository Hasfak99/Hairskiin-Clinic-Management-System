@echo off
echo ========================================
echo Starting Hairskiin CRM Backend Server
echo ========================================
echo.

cd /d "%~dp0server"

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
echo ========================================

python -m uvicorn main:app --reload --port 8000
