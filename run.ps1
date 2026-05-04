Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "      MOMO DIARY SERVICE RUNNER" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Path Setup
$appPath = Join-Path $PSScriptRoot "momo-app"

if (-not (Test-Path $appPath)) {
    Write-Host "[ERROR] 'momo-app' directory not found at $appPath" -ForegroundColor Red
    Pause
    exit
}

Set-Location $appPath

# 2. Node.js Check
try {
    $nodeVersion = node -v
    Write-Host "[INFO] Using Node.js $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Node.js is not installed. Please install it from https://nodejs.org/" -ForegroundColor Red
    Pause
    exit
}

# 3. Dependencies Check
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing dependencies (npm install)..." -ForegroundColor Yellow
    npm install
}

# 4. Start Server
Write-Host "[INFO] Starting development server at http://localhost:3000" -ForegroundColor Green
Write-Host "[INFO] Press Ctrl+C to stop the service." -ForegroundColor Gray
Write-Host ""

npm run dev
