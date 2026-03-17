@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

set PYTHON_EXE=C:\Users\Lenovo\AppData\Local\Programs\Python\Python313\python.exe
set VENV_DIR=venv

echo Using Python: %PYTHON_EXE%
echo Venv dir: %VENV_DIR%

if not exist "%VENV_DIR%" (
    echo Creating virtual environment...
    %PYTHON_EXE% -m venv %VENV_DIR%
    if errorlevel 1 (
        echo Failed to create venv. Check Python installation.
        pause
        exit /b 1
    )
)

echo Installing requirements to venv...
%VENV_DIR%\Scripts\python.exe -m pip install --upgrade pip
%VENV_DIR%\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 (
    echo Failed to install requirements.
    pause
    exit /b 1
)

echo Starting Flask app...
%VENV_DIR%\Scripts\python.exe app.py
pause

