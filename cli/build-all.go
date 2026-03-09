//go:build ignore

package main

import (
	"fmt"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

const (
	version   = "1.0.0"
	outputDir = "../.data/bin"
)

type buildTarget struct {
	os     string
	arch   string
	output string
}

var builds = []buildTarget{
	{"darwin", "amd64", "windkeep-darwin-amd64"},
	{"darwin", "arm64", "windkeep-darwin-arm64"},
	{"linux", "amd64", "windkeep-linux-amd64"},
	{"windows", "amd64", "windkeep-windows-amd64.exe"},
}

func main() {
	fmt.Println("Building WindKeep CLI for all platforms...")
	fmt.Printf("Version: %s\n", version)

	ldflags := fmt.Sprintf("-s -w -X github.com/matimortari/windkeep/cli/cmd.Version=%s", version)

	if err := os.RemoveAll(outputDir); err != nil && !os.IsNotExist(err) {
		fatalf("failed to remove output dir: %v", err)
	}
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		fatalf("failed to create output dir: %v", err)
	}

	for _, b := range builds {
		fmt.Printf("\nBuilding %s...\n", b.output)

		outputPath := filepath.Join(outputDir, b.output)

		cmd := exec.Command("go", "build", "-o", outputPath, fmt.Sprintf("-ldflags=%s", ldflags), ".")
		cmd.Env = append(os.Environ(),
			"GOOS="+b.os,
			"GOARCH="+b.arch,
			"CGO_ENABLED=0",
		)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr

		if err := cmd.Run(); err != nil {
			fmt.Printf("✗ Failed to build %s: %v\n", b.output, err)
			continue
		}

		info, err := os.Stat(outputPath)
		if err != nil {
			fmt.Printf("✓ Built %s\n", b.output)
			continue
		}

		sizeMB := math.Round(float64(info.Size())/1e6*100) / 100
		fmt.Printf("✓ Built %s (%.2f MB)\n", b.output, sizeMB)
	}
}

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "error: "+format+"\n", args...)
	os.Exit(1)
}

var _ = runtime.GOOS