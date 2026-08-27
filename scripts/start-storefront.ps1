$env:API_BASE_URL="http://localhost:3001"
$env:PORT="3000"
Set-Location "D:\E-Commerce\.worktrees\margen-ecommerce\apps\storefront"
& "node_modules\.bin\next" "dev" "-p" "3000"
