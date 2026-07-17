#Requires -Version 5.1

# Van Dinh Land Management - Start All Services
# Run: double-click start.bat or execute: powershell -File .\start.ps1

$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$backendDir = Join-Path $root "backend"
$envFile = Join-Path $backendDir ".env"
$envExample = Join-Path $backendDir ".env.example"

function Stop-Launcher {
    param([Parameter(Mandatory = $true)][string]$Message)
    Write-Host "       ERROR: $Message" -ForegroundColor Red
    exit 1
}

function Get-DotEnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Name
    )

    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    $pattern = "^\s*$([Regex]::Escape($Name))\s*="
    $line = Get-Content -LiteralPath $Path |
        Where-Object { $_ -match $pattern } |
        Select-Object -First 1
    if (-not $line) { return $null }

    $value = $line.Substring($line.IndexOf("=") + 1).Trim()
    if ($value.Length -ge 2) {
        $first = $value.Substring(0, 1)
        $last = $value.Substring($value.Length - 1, 1)
        if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
            $value = $value.Substring(1, $value.Length - 2)
        }
    }
    return $value
}

function Test-TcpEndpoint {
    param(
        [Parameter(Mandatory = $true)][string]$HostName,
        [Parameter(Mandatory = $true)][int]$Port,
        [int]$TimeoutMs = 1000
    )

    $client = New-Object System.Net.Sockets.TcpClient
    $asyncResult = $null
    try {
        $asyncResult = $client.BeginConnect($HostName, $Port, $null, $null)
        if (-not $asyncResult.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) { return $false }
        $client.EndConnect($asyncResult)
        return $true
    } catch {
        return $false
    } finally {
        if ($asyncResult) { $asyncResult.AsyncWaitHandle.Close() }
        $client.Close()
    }
}

function Get-PowerShellExecutable {
    $executable = Join-Path $PSHOME "powershell.exe"
    if ($PSVersionTable.PSEdition -eq "Core") {
        $executable = Join-Path $PSHOME "pwsh.exe"
    }
    if (-not (Test-Path -LiteralPath $executable)) {
        Stop-Launcher "Cannot locate current PowerShell executable."
    }
    return $executable
}

function ConvertTo-EncodedCommand {
    param([Parameter(Mandatory = $true)][string]$Command)
    return [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command))
}

function ConvertTo-PowerShellLiteral {
    param([Parameter(Mandatory = $true)][string]$Value)
    return "'" + $Value.Replace("'", "''") + "'"
}

function Find-GdalBin {
    param([string]$ConfiguredPath)

    $candidates = New-Object "System.Collections.Generic.List[string]"
    if (-not [string]::IsNullOrWhiteSpace($ConfiguredPath)) {
        [void]$candidates.Add($ConfiguredPath)
    }
    if (-not [string]::IsNullOrWhiteSpace($env:OSGEO4W_ROOT)) {
        [void]$candidates.Add((Join-Path $env:OSGEO4W_ROOT "bin"))
    }

    # Enumerate only drives that are ready (avoids DriveNotFoundException on missing/optical drives).
    $fsDrives = [IO.DriveInfo]::GetDrives() |
        Where-Object { $_.DriveType -eq [IO.DriveType]::Fixed -and $_.IsReady }
    foreach ($drive in $fsDrives) {
        [void]$candidates.Add([IO.Path]::Combine($drive.Name, "OSGeo4W", "bin"))
    }

    $programRoots = @($env:ProgramFiles, ${env:ProgramFiles(x86)}) |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) -and [IO.Directory]::Exists($_) }
    foreach ($programRoot in $programRoots) {
        $qgisDirs = Get-ChildItem -LiteralPath $programRoot -Directory -Filter "QGIS*" -ErrorAction SilentlyContinue |
            Sort-Object Name -Descending
        foreach ($qgisDir in $qgisDirs) {
            [void]$candidates.Add([IO.Path]::Combine($qgisDir.FullName, "bin"))
        }
    }

    foreach ($candidate in ($candidates | Select-Object -Unique)) {
        # Use IO.File.Exists to avoid Join-Path/Test-Path exceptions on inaccessible paths.
        if ([IO.File]::Exists([IO.Path]::Combine($candidate, "ogr2ogr.exe")) -and
            [IO.File]::Exists([IO.Path]::Combine($candidate, "gdaltransform.exe"))) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }
    return $null
}

# 1. Create per-machine backend configuration when missing.
Write-Host "[1/6] Checking backend configuration..." -ForegroundColor Cyan
if (-not (Test-Path -LiteralPath $envFile)) {
    if (-not (Test-Path -LiteralPath $envExample)) {
        Stop-Launcher "Missing backend/.env.example. Restore it from Git and retry."
    }
    Copy-Item -LiteralPath $envExample -Destination $envFile
    Write-Host "       Created backend/.env from tracked template." -ForegroundColor Green
    Write-Host "       Edit DATABASE_URL if your PostgreSQL credentials differ." -ForegroundColor Yellow
} else {
    Write-Host "       backend/.env already exists" -ForegroundColor Green
}

$configuredGdal = $env:GDAL_BIN_PATH
if ([string]::IsNullOrWhiteSpace($configuredGdal)) {
    $configuredGdal = Get-DotEnvValue -Path $envFile -Name "GDAL_BIN_PATH"
}
$detectedGdal = Find-GdalBin -ConfiguredPath $configuredGdal
if ($detectedGdal) {
    $env:GDAL_BIN_PATH = $detectedGdal
    Write-Host "       GDAL: $detectedGdal" -ForegroundColor Green
} else {
    Write-Host "       WARNING: GDAL tools not found. TXT import can run, but DGN polygons will fail." -ForegroundColor Yellow
    Write-Host "       Set GDAL_BIN_PATH in backend/.env." -ForegroundColor Yellow
}

# 2. Start local PostgreSQL only when configured endpoint is not already ready.
Write-Host "[2/6] Checking PostgreSQL..." -ForegroundColor Cyan
$dbUrl = $env:DATABASE_URL
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
    $dbUrl = Get-DotEnvValue -Path $envFile -Name "DATABASE_URL"
}
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
    $dbUrl = "postgresql://localhost:5432/vandinh"
}
if ($dbUrl -match "CHANGE_ME") {
    Stop-Launcher "Set your PostgreSQL password in backend/.env, then run the launcher again."
}

try {
    $dbUri = [Uri]$dbUrl
} catch {
    Stop-Launcher "DATABASE_URL in backend/.env is not a valid URL."
}
if ($dbUri.Scheme -notin @("postgres", "postgresql")) {
    Stop-Launcher "DATABASE_URL must use postgres:// or postgresql://."
}

$dbHost = $dbUri.Host
$dbPort = if ($dbUri.Port -gt 0) { $dbUri.Port } else { 5432 }
if ([string]::IsNullOrWhiteSpace($dbHost)) {
    Stop-Launcher "DATABASE_URL does not contain a database host."
}

$dbReady = Test-TcpEndpoint -HostName $dbHost -Port $dbPort
$isLocalDb = $dbHost -in @("localhost", "127.0.0.1", "::1")
if (-not $dbReady -and $isLocalDb) {
    $databaseManagerFound = $false
    $dockerCommand = Get-Command docker.exe -ErrorAction SilentlyContinue
    if ($dockerCommand) {
        & $dockerCommand.Source info 2>$null | Out-Null
        $dockerReady = $LASTEXITCODE -eq 0
        $dockerDesktop = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        if (-not $dockerReady -and (Test-Path -LiteralPath $dockerDesktop)) {
            Write-Host "       Starting Docker Desktop..." -ForegroundColor Cyan
            Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
            for ($i = 0; $i -lt 20; $i++) {
                Start-Sleep -Seconds 3
                & $dockerCommand.Source info 2>$null | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    $dockerReady = $true
                    break
                }
            }
        }

        if ($dockerReady) {
            $containers = @(
                & $dockerCommand.Source ps -a --filter "ancestor=postgis/postgis" --format "{{.Names}}" 2>$null |
                    Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
            )
            if ($containers.Count -gt 0) {
                $databaseManagerFound = $true
                $container = $containers[0]
                if ($containers.Count -gt 1) {
                    Write-Host "       WARNING: Multiple PostGIS containers found; using '$container'." -ForegroundColor Yellow
                }
                $running = & $dockerCommand.Source inspect --format "{{.State.Running}}" $container 2>$null
                if ($running -ne "true") {
                    Write-Host "       Starting PostgreSQL container '$container'..." -ForegroundColor Cyan
                    & $dockerCommand.Source start $container | Out-Null
                } else {
                    Write-Host "       PostgreSQL container already running" -ForegroundColor Green
                }
            }
        }
    }

    if (-not $databaseManagerFound) {
        $pgServices = @(Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue)
        $runningService = $pgServices | Where-Object Status -eq "Running" | Select-Object -First 1
        if ($runningService) {
            $databaseManagerFound = $true
            Write-Host "       PostgreSQL service already running" -ForegroundColor Green
        } elseif ($pgServices.Count -gt 0) {
            $databaseManagerFound = $true
            $service = $pgServices[0]
            Write-Host "       Starting PostgreSQL service '$($service.Name)'..." -ForegroundColor Cyan
            try {
                Start-Service -Name $service.Name
            } catch {
                Write-Host "       WARNING: Could not start PostgreSQL service. Try running as Administrator." -ForegroundColor Yellow
            }
        }
    }

    if (-not $databaseManagerFound) {
        Write-Host "       WARNING: No PostGIS container or local PostgreSQL service found." -ForegroundColor Yellow
    }
} elseif (-not $isLocalDb) {
    Write-Host "       Using configured remote database $dbHost`:$dbPort" -ForegroundColor DarkGray
}

if (-not $dbReady) {
    Write-Host "       Waiting for PostgreSQL at $dbHost`:$dbPort (up to 30s)..." -ForegroundColor DarkGray
    for ($i = 0; $i -lt 30; $i++) {
        if (Test-TcpEndpoint -HostName $dbHost -Port $dbPort) {
            $dbReady = $true
            break
        }
        Start-Sleep -Seconds 1
    }
}
if (-not $dbReady) {
    Stop-Launcher "PostgreSQL is not accepting TCP connections at $dbHost`:$dbPort."
}
Write-Host "       PostgreSQL ready at $dbHost`:$dbPort" -ForegroundColor Green

# 3. Create Python venv and install dependencies when requirements change.
Write-Host "[3/6] Checking Python environment..." -ForegroundColor Cyan
$pythonCommand = Get-Command python.exe -ErrorAction SilentlyContinue
if (-not $pythonCommand) {
    Stop-Launcher "Python 3.12+ not found in PATH."
}
$pythonVersionText = & $pythonCommand.Source -c "import platform; print(platform.python_version())"
if ($LASTEXITCODE -ne 0) {
    Stop-Launcher "Could not read Python version."
}
$pythonVersion = [Version]$pythonVersionText
if ($pythonVersion -lt [Version]"3.12") {
    Stop-Launcher "Python 3.12+ required; found $pythonVersionText."
}

$venvPython = Join-Path $backendDir "venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $venvPython)) {
    Write-Host "       Creating Python venv with Python $pythonVersionText..." -ForegroundColor Yellow
    & $pythonCommand.Source -m venv (Join-Path $backendDir "venv")
    if ($LASTEXITCODE -ne 0) {
        Stop-Launcher "Failed to create Python venv."
    }
}
$venvVersionText = & $venvPython -c "import platform; print(platform.python_version())"
if ($LASTEXITCODE -ne 0 -or [Version]$venvVersionText -lt [Version]"3.12") {
    Stop-Launcher "Existing backend/venv does not use Python 3.12+. Delete it and run the launcher again."
}

$requirementsFile = Join-Path $backendDir "requirements.txt"
if (-not (Test-Path -LiteralPath $requirementsFile)) {
    Stop-Launcher "backend/requirements.txt not found. Restore it from Git and retry."
}
$requirementsStamp = Join-Path $backendDir "venv\.requirements.sha256"
$requirementsHash = (Get-FileHash -LiteralPath $requirementsFile -Algorithm SHA256).Hash
$installedHash = if (Test-Path -LiteralPath $requirementsStamp) {
    (Get-Content -LiteralPath $requirementsStamp -Raw).Trim()
} else {
    ""
}
$uvicornExe = Join-Path $backendDir "venv\Scripts\uvicorn.exe"
if (-not (Test-Path -LiteralPath $uvicornExe) -or $requirementsHash -ne $installedHash) {
    Write-Host "       Installing Python dependencies..." -ForegroundColor Yellow
    & $venvPython -m pip install -r $requirementsFile
    if ($LASTEXITCODE -ne 0) {
        Stop-Launcher "pip install failed. Check network and backend/requirements.txt."
    }
    [IO.File]::WriteAllText($requirementsStamp, $requirementsHash)
}
Write-Host "       Python environment ready" -ForegroundColor Green

# 4. Install frontend dependencies on a clean clone.
Write-Host "[4/6] Checking frontend environment..." -ForegroundColor Cyan
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $nodeCommand -or -not $npmCommand) {
    Stop-Launcher "Node.js and npm not found in PATH."
}
$nodeVersionText = & $nodeCommand.Source -p "process.versions.node"
if ($LASTEXITCODE -ne 0 -or [Version]$nodeVersionText -lt [Version]"20.9.0") {
    Stop-Launcher "Node.js 20.9.0+ required by Next.js 16; found $nodeVersionText."
}
$nextCommand = Join-Path $root "node_modules\.bin\next.cmd"
if (-not (Test-Path -LiteralPath $nextCommand)) {
    Write-Host "       Installing frontend dependencies..." -ForegroundColor Yellow
    $npmExitCode = 1
    Push-Location $root
    try {
        if (Test-Path -LiteralPath (Join-Path $root "package-lock.json")) {
            & $npmCommand.Source ci
        } else {
            & $npmCommand.Source install
        }
        $npmExitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
    if ($npmExitCode -ne 0) {
        Stop-Launcher "npm dependency installation failed. Check network and package-lock.json."
    }
}
Write-Host "       Frontend environment ready" -ForegroundColor Green

# 5. Start FastAPI backend in a separate window using current PowerShell edition.
$powerShellExecutable = Get-PowerShellExecutable
$backendPythonLiteral = ConvertTo-PowerShellLiteral -Value $venvPython
$backendCommand = "& $backendPythonLiteral -m uvicorn app.main:app --reload --port 8000"
$backendEncodedCommand = ConvertTo-EncodedCommand -Command $backendCommand
Write-Host "[5/6] Starting FastAPI backend on :8000..." -ForegroundColor Cyan
Start-Process -FilePath $powerShellExecutable -WorkingDirectory $backendDir -ArgumentList @(
    "-NoExit",
    "-EncodedCommand",
    $backendEncodedCommand
)

# 6. Start Next.js frontend in a separate window.
$npmLiteral = ConvertTo-PowerShellLiteral -Value $npmCommand.Source
$frontendCommand = "& $npmLiteral run dev"
$frontendEncodedCommand = ConvertTo-EncodedCommand -Command $frontendCommand
Write-Host "[6/6] Starting Next.js frontend on :3000..." -ForegroundColor Cyan
Start-Process -FilePath $powerShellExecutable -WorkingDirectory $root -ArgumentList @(
    "-NoExit",
    "-EncodedCommand",
    $frontendEncodedCommand
)

Write-Host ""
Write-Host "All services started in separate windows." -ForegroundColor Green
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor Yellow
Write-Host "  Login:     http://localhost:3000/login" -ForegroundColor Yellow
Write-Host ""
Write-Host "Launcher exiting; service windows remain open." -ForegroundColor DarkGray
Start-Sleep -Seconds 3
