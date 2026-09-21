# Build + auto-submit iOS production using the local ASC Admin API key.
# Run this yourself in an interactive terminal (Apple password login is not required
# when EXPO_ASC_* is set). Do not use --non-interactive until the distribution
# certificate has been validated once.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$env:NODE_EXTRA_CA_CERTS = (Resolve-Path ".\certs\avg-web-mail-shield-root.pem").Path
$env:NODE_USE_SYSTEM_CA = "1"

$keyPath = Resolve-Path ".\credentials\asc\AuthKey_SN9C4638Q3.p8"
$env:EXPO_ASC_API_KEY_PATH = $keyPath.Path
$env:EXPO_ASC_KEY_ID = "SN9C4638Q3"
$env:EXPO_ASC_ISSUER_ID = "5edc5185-66dd-4530-888a-a9d3f865929f"
$env:EXPO_APPLE_TEAM_ID = "833CYAZ8XT"
# Individual / Sole proprietor Apple Developer account
$env:EXPO_APPLE_TEAM_TYPE = "INDIVIDUAL"

Write-Host "ASC key: $env:EXPO_ASC_KEY_ID @ $env:EXPO_ASC_API_KEY_PATH"
Write-Host "Starting production iOS build + auto-submit (interactive credential repair allowed)..."
npx eas-cli build --platform ios --profile production --auto-submit
