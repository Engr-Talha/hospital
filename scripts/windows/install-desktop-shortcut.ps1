# Creates a Desktop shortcut that runs start-hospital.bat (one-time setup).
# Run from Explorer: right-click -> Run with PowerShell, or:
#   powershell -ExecutionPolicy Bypass -File scripts\windows\install-desktop-shortcut.ps1
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$bat = Join-Path $here 'start-hospital.bat'
if (-not (Test-Path -LiteralPath $bat)) {
  Write-Error "Not found: $bat"
  exit 1
}
$repoRoot = (Resolve-Path (Join-Path $here '..\..')).Path
$desktop = [Environment]::GetFolderPath('Desktop')
$lnkPath = Join-Path $desktop 'Hospital HIS.lnk'

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($lnkPath)
$shortcut.TargetPath = $bat
$shortcut.WorkingDirectory = $repoRoot
$shortcut.Description = 'Start Docker, Postgres, npm, and open Hospital HIS in the browser'
$shortcut.Save()

Write-Host "Created: $lnkPath"
Write-Host "Double-click 'Hospital HIS' on your Desktop to launch."
