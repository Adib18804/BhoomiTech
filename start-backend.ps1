# BhoomiTech Backend Startup Script

Write-Host "========================================" -ForegroundColor Green
Write-Host "  BhoomiTech Backend Startup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Navigate to backend directory
Set-Location -Path "$PSScriptRoot\backend"

# Check if virtual environment exists
if (-Not (Test-Path ".\venv\Scripts\Activate.ps1")) {
    Write-Host "Virtual environment not found. Creating..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "Virtual environment created!" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& ".\venv\Scripts\Activate.ps1"

# Check if dependencies are installed
Write-Host "Checking dependencies..." -ForegroundColor Cyan
$requirementsHash = (Get-FileHash "requirements.txt").Hash
$installedHash = ""
if (Test-Path ".venv_hash") {
    $installedHash = Get-Content ".venv_hash"
}

if ($requirementsHash -ne $installedHash) {
    Write-Host "Installing/updating dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
    $requirementsHash | Out-File ".venv_hash"
    Write-Host "Dependencies installed!" -ForegroundColor Green
} else {
    Write-Host "Dependencies up to date!" -ForegroundColor Green
}

# Check if .env exists
if (-Not (Test-Path "$PSScriptRoot\.env")) {
    Write-Host ""
    Write-Host "WARNING: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file from .env.example" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if database is seeded
Write-Host ""
Write-Host "Starting backend server..." -ForegroundColor Cyan
Write-Host "Backend will be available at: http://localhost:8000" -ForegroundColor Green
Write-Host "API Documentation at: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
python main.py
