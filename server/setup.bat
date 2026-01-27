@echo off
echo ========================================
echo Hairskiin CRM - Backend Setup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Creating virtual environment...
"C:\Users\hmhas\AppData\Local\Programs\Python\Python312\python.exe" -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/4] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [4/4] Creating default users...
venv\Scripts\python seed.py

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Login Credentials:
echo   Admin:        username: admin       password: admin123
echo   Manager:      username: manager     password: manager123
echo   Receptionist: username: reception   password: reception123
echo.
echo To start the server, run: start_server.bat
echo.
pause
