# BhoomiTech Frontend Startup Script

Write-Host "========================================" -ForegroundColor Green
Write-Host "  BhoomiTech Frontend Startup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Navigate to frontend directory
Set-Location -Path "$PSScriptRoot\frontend"

# Check if node_modules exists
if (-Not (Test-Path ".\node_modules")) {
    Write-Host "Node modules not found. Installing..." -ForegroundColor Yellow
    npm install
    Write-Host "Dependencies installed!" -ForegroundColor Green
}

# Check if .env.local exists
if (-Not (Test-Path ".env.local")) {
    Write-Host ""
    Write-Host "WARNING: .env.local file not found!" -ForegroundColor Red
    Write-Host "Creating .env.local with default configuration..." -ForegroundColor Yellow
    "VITE_API_BASE_URL=http://localhost:8000" | Out-File ".env.local" -Encoding UTF8
    Write-Host ".env.local created!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting frontend development server..." -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the dev server
npm run dev
