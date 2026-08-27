$ErrorActionPreference = "Continue"

# Kill any leftover processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)").CommandLine
    $cmd -match "tsx.*main\.ts|next.*dev"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

# Start API
$env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/margen"
$env:NODE_ENV = "test"
$env:PORT = "3001"
$apiProc = Start-Process -FilePath "node" -ArgumentList "D:\E-Commerce\.worktrees\margen-ecommerce\apps\api\node_modules\.bin\..\.pnpm\tsx@4.20.3\node_modules\tsx\dist\cli.mjs","src/main.ts" -WorkingDirectory "D:\E-Commerce\.worktrees\margen-ecommerce\apps\api" -PassThru -NoNewWindow
Write-Output "API PID: $($apiProc.Id)"

Start-Sleep -Seconds 8

# Check API
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3001/v1/catalog/products' -UseBasicParsing -TimeoutSec 5
    Write-Output "API Catalog: $($r.StatusCode) $($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))"
} catch {
    Write-Output "API Catalog ERR: $($_.Exception.Message)"
}

# Start Storefront
$sfProc = Start-Process -FilePath "node" -ArgumentList "D:\E-Commerce\.worktrees\margen-ecommerce\apps\storefront\node_modules\.bin\..\.pnpm\next@15.5.2_@playwright+test@1.62.1_react-dom@19.1.1_react@19.1.1__react@19.1.1\node_modules\next\dist\bin\next","dev","-p","3000" -WorkingDirectory "D:\E-Commerce\.worktrees\margen-ecommerce\apps\storefront" -PassThru -NoNewWindow -Environment @{ API_BASE_URL = "http://localhost:3001"; PORT = "3000" }
Write-Output "SF PID: $($sfProc.Id)"

Start-Sleep -Seconds 12

try {
    $r2 = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 10
    Write-Output "Storefront: $($r2.StatusCode)"
} catch {
    Write-Output "Storefront ERR: $($_.Exception.Message)"
}

Write-Output "READY"
