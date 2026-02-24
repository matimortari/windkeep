$ErrorActionPreference = "Stop"

$binary = "windkeep-windows-amd64.exe"
$url = "https://windkeep.up.railway.app/api/downloads/$binary"

$installDir = "$HOME\.windkeep\bin"
$target = "$installDir\windkeep.exe"
$temp = "$installDir\windkeep.tmp.exe"

New-Item -ItemType Directory -Force -Path $installDir | Out-Null
if (Test-Path $target) {
  attrib -h -s $target
}

Invoke-RestMethod $url -OutFile $temp
Move-Item -Force $temp $target

Write-Host "WindKeep installed at $target"
Write-Host "Make sure $installDir is in your PATH"
