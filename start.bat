@echo off
setlocal
echo Starting Van Dinh Land Management System...
echo Services will appear in separate windows. You can close this window now.
powershell -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0start.ps1\"' -WindowStyle Normal"
