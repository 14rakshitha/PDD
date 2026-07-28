# Starts LawVoice frontend (Vite dev server).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm packages..." -ForegroundColor Yellow
    npm.cmd install --strict-ssl=false
}
Write-Host "Starting frontend on http://localhost:5190 ..." -ForegroundColor Green
npm.cmd run dev
