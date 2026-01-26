@echo off
cd server
echo Running API diagnostic test...
python test_api_500.py
pause
