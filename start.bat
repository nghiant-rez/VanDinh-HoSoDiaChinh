@echo off
echo Starting Van Dinh Land Management System...
echo Services will appear in separate windows. You can close this window now.
powershell -ExecutionPolicy Bypass -Command "Start-Process pwsh -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0start.ps1\"' -WindowStyle Normal"
