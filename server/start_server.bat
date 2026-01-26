@echo off
echo Starting Hairskiin CRM Backend Server...
echo.

cd /d "%~dp0"
call venv\Scripts\activate.bat
python -m uvicorn main:app --reload --port 8000

pause
