$ErrorActionPreference = "Stop"

Write-Host "========================================="
Write-Host "Building Production Frontend"
Write-Host "========================================="

Set-Location nginx/web
npm run build
Set-Location ../../

Write-Host "========================================="
Write-Host "Building Multi-Arch App Image"
Write-Host "========================================="

docker buildx build `
  --platform linux/amd64,linux/arm64 `
  -t zanelindquist/play-qb-app:latest `
  -f app/Dockerfile.prod `
  ./app `
  --push

Write-Host "========================================="
Write-Host "Building Multi-Arch Nginx Image"
Write-Host "========================================="

docker buildx build `
  --platform linux/amd64,linux/arm64 `
  -t zanelindquist/play-qb-nginx:latest `
  -f nginx/Dockerfile.prod `
  ./nginx `
  --push

Write-Host "========================================="
Write-Host "Production Images Built & Pushed"
Write-Host "========================================="

.\cleanup-buildx.ps1