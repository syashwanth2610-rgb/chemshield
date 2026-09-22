$ErrorActionPreference = "Stop"

$appRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $appRoot
$python = Join-Path $projectRoot ".venv\Scripts\python.exe"
$backend = Join-Path $appRoot "backend"
$frontend = Join-Path $appRoot "frontend"
$publicLog = Join-Path $appRoot "public-tunnel.log"
$publicErrorLog = Join-Path $appRoot "public-tunnel-error.log"

if (-not (Test-Path $python)) {
    throw "Python virtual environment not found at $python"
}

Start-Process -FilePath $python `
    -ArgumentList "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000" `
    -WorkingDirectory $backend `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $appRoot "backend-start.log") `
    -RedirectStandardError (Join-Path $appRoot "backend-start-error.log")

$savedHost = $env:HOST
$savedPort = $env:PORT
$savedBrowser = $env:BROWSER
$env:HOST = "0.0.0.0"
$env:PORT = "3000"
$env:BROWSER = "none"

Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm.cmd start > `"$(Join-Path $appRoot 'frontend-start.log')`" 2>&1" `
    -WorkingDirectory $frontend `
    -WindowStyle Hidden

$cloudflared = Get-Command cloudflared.exe -ErrorAction SilentlyContinue
if ($cloudflared) {
    Remove-Item $publicLog -Force -ErrorAction SilentlyContinue
    Start-Process -FilePath $cloudflared.Source `
        -ArgumentList "tunnel", "--url", "http://localhost:3000", "--no-autoupdate" `
        -WindowStyle Hidden `
        -RedirectStandardOutput $publicLog `
        -RedirectStandardError $publicErrorLog
}

if ($null -eq $savedHost) { Remove-Item Env:HOST -ErrorAction SilentlyContinue } else { $env:HOST = $savedHost }
if ($null -eq $savedPort) { Remove-Item Env:PORT -ErrorAction SilentlyContinue } else { $env:PORT = $savedPort }
if ($null -eq $savedBrowser) { Remove-Item Env:BROWSER -ErrorAction SilentlyContinue } else { $env:BROWSER = $savedBrowser }

$lanAddresses = @(Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp |
    Where-Object { $_.IPAddress -notlike "169.254.*" -and $_.IPAddress -ne "127.0.0.1" } |
    Sort-Object @{ Expression = { if ($_.InterfaceAlias -match "Wi-Fi|Wireless") { 0 } else { 1 } } }, InterfaceIndex |
    Select-Object -ExpandProperty IPAddress)

Write-Host "ChemShield started in separate processes."
Write-Host "PC:    http://localhost:3000"
if ($cloudflared) {
    Write-Host "Public HTTPS URL: check $publicErrorLog after startup."
}
if ($lanAddresses.Count -gt 0) {
    Write-Host "Phone: http://$($lanAddresses[0]):3000 (same Wi-Fi)"
    if ($lanAddresses.Count -gt 1) {
        Write-Host "Other LAN addresses: $($lanAddresses[1..($lanAddresses.Count - 1)] -join ', ')"
    }
}
Write-Host "Close this PowerShell window; the app processes will keep running."