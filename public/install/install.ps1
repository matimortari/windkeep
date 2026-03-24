$ErrorActionPreference = "Stop"

$binary = "windkeep-windows-amd64.exe"
$url = "https://windkeep.up.railway.app/api/downloads/$binary"

$installDir = "$env:LOCALAPPDATA\Programs\windkeep"
$target = "$installDir\windkeep.exe"
$temp = "$installDir\windkeep.tmp.exe"

New-Item -ItemType Directory -Force -Path $installDir | Out-Null

if (Test-Path $target) {
  attrib -h -s $target
}

Invoke-RestMethod $url -OutFile $temp
Move-Item -Force $temp $target

Write-Host "WindKeep installed at $target"
Write-Host ""
Write-Host "Add the following directory to your PATH:"
Write-Host "  $installDir"
Write-Host ""
Write-Host "Then restart your terminal and run:"
Write-Host "  windkeep --version"
