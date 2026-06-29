# Van Dinh Land Management - Start All Services
# Run: right-click -> Run with PowerShell (or: pwsh start.ps1)

$root = $PSScriptRoot
$backendDir = Join-Path $root "backend"

# 0. Ensure Docker Desktop is running (if installed)
$dockerExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dockerExe) {
    $dockerProc = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
    if (-not $dockerProc) {
        Write-Host "[0/4] Starting Docker Desktop..." -ForegroundColor Cyan
        Start-Process $dockerExe
        Write-Host "       Waiting for Docker to initialize (up to 60s)..." -ForegroundColor DarkGray
        $timeout = 60
        while ($timeout -gt 0 -and -not (docker info 2>$null)) {
            Start-Sleep -Seconds 3
            $timeout -= 3
        }
    }
}

# 1. Ensure PostgreSQL is running (Docker or local service)
$dockerPg = docker ps -a --filter "ancestor=postgis/postgis" --format "{{.Names}}" 2>$null
if ($dockerPg) {
    # Docker container exists — make sure it's running
    $running = docker ps --filter "name=$dockerPg" --format "{{.Names}}" 2>$null
    if (-not $running) {
        Write-Host "[1/4] Starting PostgreSQL container '$dockerPg'..." -ForegroundColor Cyan
        docker start $dockerPg
        Start-Sleep -Seconds 3
    } else {
        Write-Host "[1/4] PostgreSQL container already running" -ForegroundColor Green
    }
} else {
    # Fall back to local Windows service
    $pgSvc = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Where-Object Status -ne "Running"
    if ($pgSvc) {
        Write-Host "[1/4] Starting PostgreSQL service..." -ForegroundColor Cyan
        Start-Service $pgSvc.Name
        Start-Sleep -Seconds 2
    } else {
        Write-Host "[1/4] PostgreSQL running (service or already up)" -ForegroundColor Green
    }
}

# 2. Ensure Python venv and dependencies
Write-Host "[2/4] Checking Python environment..." -ForegroundColor Cyan
if (-not (Test-Path "$backendDir\venv\Scripts\Activate.ps1")) {
    Write-Host "       Creating Python venv..." -ForegroundColor Yellow
    python -m venv "$backendDir\venv"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "       ERROR: Failed to create venv. Is Python installed?" -ForegroundColor Red
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
}
if (-not (Test-Path "$backendDir\venv\Scripts\uvicorn.exe")) {
    Write-Host "       Installing Python dependencies..." -ForegroundColor Yellow
    & "$backendDir\venv\Scripts\pip.exe" install -r "$backendDir\requirements.txt"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "       ERROR: pip install failed. Check network and retry." -ForegroundColor Red
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
}
Write-Host "       Python environment ready" -ForegroundColor Green

# 3. Start FastAPI backend in new window
Write-Host "[3/4] Starting FastAPI backend on :8000..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", @"
cd '$backendDir'
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
"@

# 4. Start Next.js frontend in new window
Write-Host "[4/4] Starting Next.js frontend on :3000..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", @"
cd '$root'
npm run dev
"@

Write-Host ""
Write-Host "All services starting in separate windows." -ForegroundColor Green
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor Yellow
Write-Host "  Login:     http://localhost:3000/login" -ForegroundColor Yellow
Write-Host ""
Write-Host "Launcher exiting — service windows will persist. Safe to close this window." -ForegroundColor DarkGray
Start-Sleep -Seconds 3
