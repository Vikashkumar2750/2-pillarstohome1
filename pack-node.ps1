# Prepare Node.js Deployment
Write-Host "Creating Node.js Deployment Package..."

$zipPath = "deploy-node.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Write-Host "Building React and Node Server (Bypassing Windows Ampersand Bug)..."
# Explicitly using node instead of npm scripts to avoid cmd.exe '&' path splitting bug!
node "node_modules/vite/bin/vite.js" build
$viteResult = $LASTEXITCODE

node "node_modules/esbuild/bin/esbuild" server.ts --platform=node --target=node18 --bundle --packages=external --outfile=dist-server/server.js --format=esm
$esbuildResult = $LASTEXITCODE

if ($viteResult -ne 0 -or $esbuildResult -ne 0) {
    Write-Host "❌ Build failed!"
} else {
    Write-Host "Build complete! Packaging dist files..."
    
    $items = @(
        "dist",
        "dist-server",
        "package.json",
        ".htaccess",
        ".env"
    )
    
    $existing = $items | Where-Object { Test-Path $_ }
    
    Compress-Archive -Path $existing -DestinationPath $zipPath -Force
    
    Write-Host ""
    Write-Host "=========================================================="
    Write-Host "✅ SUCCESS! Node Deployment package: $zipPath"
    Write-Host "Upload this to Hostinger and go to Advanced -> Node.js!"
    Write-Host "=========================================================="
}
