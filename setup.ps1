# Van Dinh Land Management - A to Z Environment Setup
# Run this script by right-clicking and selecting "Run with PowerShell"

# 1. Self-Elevate to run as Administrator
if (-Not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] 'Administrator')) {
    Write-Host "Elevating to Administrator privileges..." -ForegroundColor Yellow
    if ($host.UI.RawUI.KeyAvailable) { $null = $host.UI.RawUI.FlushInputBuffer() }
    $CommandLine = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    Start-Process -FilePath PowerShell.exe -ArgumentList $CommandLine -Verb RunAs
    Exit
}

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   Van Dinh Ho So Dia Chinh - A-Z Setup Script         " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot
$backendDir = Join-Path $root "backend"

# 2. Check and Install dependencies via Winget
Write-Host "[1/6] Checking System Dependencies (Python, Node.js, Docker)..." -ForegroundColor Cyan

function Install-WingetPackage {
    param([string]$PackageId, [string]$PackageName, [string]$CheckCommand)
    
    $isInstalled = $false
    try {
        $null = Invoke-Expression "$CheckCommand" 2>&1
        if ($LASTEXITCODE -eq 0 -or $?) { $isInstalled = $true }
    } catch {}

    if (-not $isInstalled) {
        Write-Host "       Installing $PackageName..." -ForegroundColor Yellow
        winget install --id $PackageId --accept-package-agreements --accept-source-agreements --silent
        Write-Host "       $PackageName installed successfully! (You might need to restart your computer for some path changes to take effect)" -ForegroundColor Green
    } else {
        Write-Host "       $PackageName is already installed." -ForegroundColor Green
    }
}

# Python
Install-WingetPackage -PackageId "Python.Python.3.11" -PackageName "Python 3.11" -CheckCommand "python --version"
# Node.js
Install-WingetPackage -PackageId "OpenJS.NodeJS" -PackageName "Node.js" -CheckCommand "node --version"
# Docker Desktop (for database)
Install-WingetPackage -PackageId "Docker.DockerDesktop" -PackageName "Docker Desktop" -CheckCommand "docker --version"

Write-Host ""
Write-Host "[2/6] Refreshing Environment Variables..." -ForegroundColor Cyan
# Refresh env vars for the current process so we can use python/npm if just installed
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 3. Setup Frontend
Write-Host ""
Write-Host "[3/6] Setting up Frontend Dependencies..." -ForegroundColor Cyan
Set-Location $root
if (Test-Path "package.json") {
    Write-Host "       Running npm install..." -ForegroundColor Yellow
    npm install
    Write-Host "       Frontend setup complete." -ForegroundColor Green
} else {
    Write-Host "       ERROR: package.json not found in $root" -ForegroundColor Red
}

# 4. Setup Backend Environment
Write-Host ""
Write-Host "[4/6] Setting up Backend Config (.env)..." -ForegroundColor Cyan
$envFile = Join-Path $backendDir ".env"
$envExample = Join-Path $backendDir ".env.example"
if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "       Created backend/.env from .env.example." -ForegroundColor Green
    } else {
        Write-Host "       WARNING: No backend/.env and no .env.example found." -ForegroundColor Red
    }
} else {
    Write-Host "       backend/.env already exists." -ForegroundColor Green
}

Write-Host ""
Write-Host "[5/6] Setting up Backend Dependencies (Python venv)..." -ForegroundColor Cyan
Set-Location $backendDir
if (-not (Test-Path "venv")) {
    Write-Host "       Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "       Installing python requirements..." -ForegroundColor Yellow
& .\venv\Scripts\pip.exe install -r requirements.txt
if ($LASTEXITCODE -eq 0) {
    Write-Host "       Backend setup complete." -ForegroundColor Green
} else {
    Write-Host "       WARNING: pip install encountered issues." -ForegroundColor Red
}

# 5. Database (Docker PostGIS)
Write-Host ""
Write-Host "[6/6] Setting up Database (PostGIS via Docker)..." -ForegroundColor Cyan
Write-Host "       Pulling postgis/postgis image..." -ForegroundColor Yellow
docker pull postgis/postgis
if ($LASTEXITCODE -ne 0) {
    Write-Host "       WARNING: Could not pull Docker image. Is Docker Desktop running?" -ForegroundColor Red
    Write-Host "       If you just installed Docker, please restart your computer and open Docker Desktop first." -ForegroundColor Yellow
} else {
    Write-Host "       Docker image ready." -ForegroundColor Green
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   Setup Completed!" -ForegroundColor Green
Write-Host "   If you just installed Python, Node, or Docker, you" -ForegroundColor Yellow
Write-Host "   may need to RESTART YOUR COMPUTER for everything" -ForegroundColor Yellow
Write-Host "   to work smoothly." -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
