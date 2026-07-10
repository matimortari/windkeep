$ErrorActionPreference = "Stop"

$binary = "windkeep-windows-amd64.exe"
$installDir = "$env:LOCALAPPDATA\Programs\windkeep"
$target = "$installDir\windkeep.exe"
$wkTarget = "$installDir\wk.exe"
$temp = "$installDir\windkeep.tmp.exe"

New-Item -ItemType Directory -Force -Path $installDir | Out-Null

Invoke-RestMethod "https://windkeep.up.railway.app/api/downloads/$binary" -OutFile $temp

$expected = $null
foreach ($line in (Invoke-RestMethod "https://windkeep.up.railway.app/api/downloads/checksums.txt") -split "`n") {
  if ($line -match '^\s*(\S+)\s+(\S+)\s*$' -and $matches[2] -eq $binary) {
    $expected = $matches[1].ToLower()
    break
  }
}

if (-not $expected) {
  Remove-Item -Force $temp
  throw "checksum not found for $binary"
}

$actual = (Get-FileHash $temp -Algorithm SHA256).Hash.ToLower()
if ($expected -ne $actual) {
  Remove-Item -Force $temp
  throw "checksum mismatch for $binary"
}

Move-Item -Force $temp $target

if (Test-Path $wkTarget) {
  Remove-Item -Force $wkTarget
}
New-Item -ItemType HardLink -Path $wkTarget -Target $target -Force | Out-Null

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$pathUpdated = $false
if ($userPath -notlike "*$installDir*") {
  $newPath = if ($userPath) { "$userPath;$installDir" } else { $installDir }
  [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
  $pathUpdated = $true
}
if ($env:Path -notlike "*$installDir*") {
  $env:Path = "$env:Path;$installDir"
}

Write-Host "WindKeep installed."
if ($pathUpdated) {
  Write-Host "Restart your terminal for PATH changes to take effect."
}
Write-Host "Run windkeep --version to verify."
