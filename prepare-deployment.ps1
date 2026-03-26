# Prepare Deployment Script for Hostinger
Write-Host "Preparing deployment for pillarstohome.techaasvik.in..."

$phpZipPath = "deploy-php.zip"
$baseDir = Get-Location

if (Test-Path $phpZipPath) {
    Remove-Item $phpZipPath -Force
    Write-Host "Removed old zip file."
}

Write-Host "Packaging production PHP files..."

# Ensure we use an array of explicit paths rather than wildcards that might miss files or grab wrong files
$itemsToCompress = @(
    "index.php",
    "about.php",
    "contact.php",
    "investment.php",
    "landing.php",
    "listings.php",
    "property.php",
    "audit.php",
    ".htaccess",
    "includes",
    "api",
    "P2Sadmin",
    "assets"
)

# Filter items that actually exist to prevent errors
$existingItems = $itemsToCompress | Where-Object { Test-Path $_ }

if ($existingItems.Count -gt 0) {
    Compress-Archive -Path $existingItems -DestinationPath $phpZipPath -Force
    Write-Host ""
    Write-Host "=========================================================="
    Write-Host "✅ SUCCESS! Deployment package created: $phpZipPath"
    Write-Host "Upload this zip file to your Hostinger File Manager inside"
    Write-Host "the pillarstohome.techaasvik.in root folder."
    Write-Host "=========================================================="
}
else {
    Write-Host "❌ ERROR: No PHP files found to package."
}
