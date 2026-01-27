@echo off
echo ========================================
echo Hairskiin CRM - Quick Start
echo ========================================
echo.

set PYTHON_PATH=C:\Users\hmhas\AppData\Local\Programs\Python\Python312
set PATH=%PYTHON_PATH%;%PYTHON_PATH%\Scripts;%PATH%

echo [1/3] Starting Backend Server...
start "Hairskiin Backend" cmd /k "cd server && start_server.bat"

echo [2/3] Waiting for Backend to initialize...
timeout /t 5 >nul

echo [3/3] Starting Frontend...
cd client
echo Starting frontend in a new window...
start "Hairskiin Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo Project Started!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo ========================================
echo.
pause
