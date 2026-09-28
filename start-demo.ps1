$ErrorActionPreference = 'Stop'
$demoRoot = $PSScriptRoot
$logDirectory = Join-Path $demoRoot '.demo-logs'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

function Test-DemoService([string]$Url) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Start-DemoService {
    param([string]$Name, [string]$Url, [string]$Executable, [string[]]$Arguments, [string]$Directory)
    if (Test-DemoService $Url) {
        Write-Host "$Name is already running."
        return
    }
    $service = Start-Process -FilePath $Executable -ArgumentList $Arguments -WorkingDirectory $Directory `
        -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $logDirectory "$Name.out.log") `
        -RedirectStandardError (Join-Path $logDirectory "$Name.err.log")
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        if ($service.HasExited) { break }
        if (Test-DemoService $Url) {
            Write-Host "$Name started (PID $($service.Id))."
            return
        }
        Start-Sleep -Milliseconds 250
    }
    if (-not $service.HasExited) { Stop-Process -Id $service.Id }
    throw "$Name did not start. Check $logDirectory/$Name.err.log and the dependency instructions in README.md."
}

Start-DemoService -Name 'backend' -Url 'http://127.0.0.1:8000/api/bounty/recorded/finding' `
    -Executable 'py' -Arguments @('-3.12', '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000') `
    -Directory (Join-Path $demoRoot 'backend')
Start-DemoService -Name 'frontend' -Url 'http://127.0.0.1:5173/' `
    -Executable 'node' -Arguments @('node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort') `
    -Directory (Join-Path $demoRoot 'frontend')
Write-Host 'Open http://127.0.0.1:5173/. Both services continue running in the background.'
