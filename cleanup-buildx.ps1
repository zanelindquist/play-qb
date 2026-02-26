# cleanup-buildx.ps1
$ErrorActionPreference = "Stop"

Write-Host "🧹 Cleaning up old Buildx caches..."

# Remove all Buildx caches
docker buildx prune --all --force

# Optional: remove dangling images and unused volumes (safe)
docker system prune --volumes --force

Write-Host "✅ Buildx cleanup complete."