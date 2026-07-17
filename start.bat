@echo off
setlocal
echo Starting Van Dinh Land Management System...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
if errorlevel 1 (
    echo.
    echo Launcher failed. Review the error above.
    pause
    exit /b 1
)
endlocal
