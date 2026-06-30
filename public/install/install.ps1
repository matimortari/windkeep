$ErrorActionPreference = "Stop"

$binary = "windkeep-windows-amd64.exe"
$url = "https://windkeep.up.railway.app/api/downloads/$binary"
$checksumsUrl = "https://windkeep.up.railway.app/api/downloads/checksums.txt"

$installDir = "$env:LOCALAPPDATA\Programs\windkeep"
$target = "$installDir\windkeep.exe"
$temp = "$installDir\windkeep.tmp.exe"

New-Item -ItemType Directory -Force -Path $installDir | Out-Null

if (Test-Path $target) {
  attrib -h -s $target
}

Invoke-RestMethod $url -OutFile $temp

$expected = $null
foreach ($line in (Invoke-RestMethod $checksumsUrl) -split "`n") {
  if ($line -match '^\s*(\S+)\s+(\S+)\s*$') {
    if ($matches[2] -eq $binary) {
      $expected = $matches[1].ToLower()
      break
    }
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

Write-Host "WindKeep installed at $target"
Write-Host ""
Write-Host "Add the following directory to your PATH:"
Write-Host "  $installDir"
Write-Host ""
Write-Host "Then restart your terminal and run:"
Write-Host "  windkeep --version"
