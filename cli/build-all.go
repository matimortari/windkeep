//go:build ignore

package main

import (
	"bufio"
	"fmt"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

var builds = [][3]string{
	{"darwin", "amd64", "windkeep-darwin-amd64"},
	{"darwin", "arm64", "windkeep-darwin-arm64"},
	{"linux", "amd64", "windkeep-linux-amd64"},
	{"windows", "amd64", "windkeep-windows-amd64.exe"},
}

func readVersionFromEnv(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || line[0] == '#' {
			continue
		}
		k, v, ok := strings.Cut(line, "=")
		if ok && strings.TrimSpace(k) == "CLI_VERSION" {
			return strings.Trim(strings.TrimSpace(v), `"'`), nil
		}
	}
	return "", fmt.Errorf("CLI_VERSION not found in .env")
}

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "error: "+format+"\n", args...)
	os.Exit(1)
}

func main() {
	version, err := readVersionFromEnv("../.env")
	if err != nil {
		fatalf("failed to read version: %v", err)
	}

	fmt.Printf("Building WindKeep CLI — version %s\n", version)

	prev, _ := os.ReadFile("../.data/meta/.last-built-version")
	if strings.TrimSpace(string(prev)) == version {
		fmt.Printf("Version %s already built. Continue? (y/N): ", version)
		var input string
		fmt.Scanln(&input)
		if strings.ToLower(strings.TrimSpace(input)) != "y" {
			fmt.Println("Build cancelled.")
			return
		}
	}

	ldflags := fmt.Sprintf("-s -w -X github.com/matimortari/windkeep/cli/cmd.Version=%s", version)

	if err := os.RemoveAll("../.data/bin"); err != nil && !os.IsNotExist(err) {
		fatalf("failed to remove bin dir: %v", err)
	}
	os.MkdirAll("../.data/bin", 0755)
	os.MkdirAll("../.data/meta", 0755)

	for _, b := range builds {
		goos, arch, name := b[0], b[1], b[2]
		fmt.Printf("\nBuilding %s...\n", name)

		out := filepath.Join("../.data/bin", name)
		cmd := exec.Command("go", "build", "-o", out, "-ldflags="+ldflags, ".")
		cmd.Env = append(os.Environ(), "GOOS="+goos, "GOARCH="+arch, "CGO_ENABLED=0")
		cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr

		if err := cmd.Run(); err != nil {
			fmt.Printf("✗ Failed: %v\n", err)
			continue
		}

		if info, err := os.Stat(out); err == nil {
			fmt.Printf("✓ %s (%.2f MB)\n", name, math.Round(float64(info.Size())/1e6*100)/100)
		} else {
			fmt.Printf("✓ %s\n", name)
		}
	}

	os.WriteFile("../.data/meta/.last-built-version", []byte(version), 0644)
}
