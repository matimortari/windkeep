Write-Host "Building WindKeep CLI for all platforms..." -ForegroundColor Cyan

# Version information
$Version = "1.0.0"
$LdFlags = "-s -w -X github.com/matimortari/windkeep/cli/cmd.Version=$Version"
Write-Host "Version: $Version" -ForegroundColor Yellow

$OutputDir = "../.data/bin"
if (Test-Path $OutputDir) {
    Remove-Item -Recurse -Force $OutputDir
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

# Define build targets
$builds = @(
    @{ OS = "darwin"; Arch = "amd64"; Output = "windkeep-darwin-amd64" },
    @{ OS = "darwin"; Arch = "arm64"; Output = "windkeep-darwin-arm64" },
    @{ OS = "linux"; Arch = "amd64"; Output = "windkeep-linux-amd64" },
    @{ OS = "windows"; Arch = "amd64"; Output = "windkeep-windows-amd64.exe" }
)

# Build for each target
foreach ($build in $builds) {
    Write-Host "`nBuilding $($build.Output)..." -ForegroundColor Yellow
    $env:GOOS = $build.OS
    $env:GOARCH = $build.Arch
    $env:CGO_ENABLED = "0"
    $outputPath = Join-Path $OutputDir $build.Output
    go build -o $outputPath -ldflags="$LdFlags" .
    if ($LASTEXITCODE -eq 0) {
        $size = (Get-Item $outputPath).Length / 1MB
        Write-Host "✓ Built $($build.Output) ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to build $($build.Output)" -ForegroundColor Red
    }
}

# Clean up environment variables
Remove-Item Env:\GOOS -ErrorAction SilentlyContinue
Remove-Item Env:\GOARCH -ErrorAction SilentlyContinue
Remove-Item Env:\CGO_ENABLED -ErrorAction SilentlyContinue
