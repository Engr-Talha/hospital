# Waits until API and Angular dev server respond.
# Exit 0 when both ready, 1 on timeout (~4 minutes).
param(
  [string]$ApiUrl = 'http://127.0.0.1:3000/api/trial/status',
  [string]$WebUrl = 'http://localhost:4200/'
)

$ErrorActionPreference = 'SilentlyContinue'
$maxAttempts = 120
$sleepSec = 2

for ($i = 0; $i -lt $maxAttempts; $i++) {
  $okApi = $false
  $okWeb = $false
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri $ApiUrl -TimeoutSec 2
    if ($r.StatusCode -eq 200) { $okApi = $true }
  } catch {}
  try {
    $r2 = Invoke-WebRequest -UseBasicParsing -Uri $WebUrl -TimeoutSec 2
    if ($null -ne $r2.StatusCode -and $r2.StatusCode -lt 500) { $okWeb = $true }
  } catch {}
  if ($okApi -and $okWeb) {
    Write-Host '[Hospital] API and web dev server are responding.'
    exit 0
  }
  Write-Host ("[Hospital] Waiting... attempt {0}/{1}" -f ($i + 1), $maxAttempts)
  Start-Sleep -Seconds $sleepSec
}

Write-Host '[Hospital] Timeout waiting for servers.'
exit 1
