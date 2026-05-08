# Returns the preferred local IPv4 address for LAN access.
# Tries default-route interface first, then falls back to first non-loopback IPv4.

$ErrorActionPreference = 'SilentlyContinue'

$defaultRoute = Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' |
  Sort-Object RouteMetric, InterfaceMetric |
  Select-Object -First 1

if ($defaultRoute) {
  $ip = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $defaultRoute.InterfaceIndex |
    Where-Object {
      $_.IPAddress -and
      $_.IPAddress -notlike '127.*' -and
      $_.IPAddress -notlike '169.254.*'
    } |
    Sort-Object SkipAsSource |
    Select-Object -First 1 -ExpandProperty IPAddress
  if ($ip) {
    Write-Output $ip
    exit 0
  }
}

$fallback = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -and
    $_.IPAddress -notlike '127.*' -and
    $_.IPAddress -notlike '169.254.*'
  } |
  Sort-Object SkipAsSource |
  Select-Object -First 1 -ExpandProperty IPAddress

if ($fallback) {
  Write-Output $fallback
}
