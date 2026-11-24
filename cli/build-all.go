//go:build ignore

package main

import (
	"bufio"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

const binDir = "../.data/bin"

var builds = [][3]string{
	{"linux", "amd64", "windkeep-linux-amd64"},
	{"windows", "amd64", "windkeep-windows-amd64.exe"},
}

// configValue reads key from the environment, falling back to ../.env.
func configValue(key string) (string, error) {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value, nil
	}

	f, err := os.Open("../.env")
	if err != nil {
		return "", fmt.Errorf("%s not set (export %s or add it to ../.env)", key, key)
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || line[0] == '#' {
			continue
		}
		k, v, ok := strings.Cut(line, "=")
		if ok && strings.TrimSpace(k) == key {
			return strings.Trim(strings.TrimSpace(v), `"'`), nil
		}
	}
	if err := scanner.Err(); err != nil {
		return "", err
	}
	return "", fmt.Errorf("%s not set (export %s or add it to ../.env)", key, key)
}

func main() {
	log.SetFlags(0)
	log.SetPrefix("error: ")

	version, err := configValue("CLI_VERSION")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Building WindKeep CLI – version %s\n", version)

	for _, b := range builds {
		if b[0] != runtime.GOOS || b[1] != runtime.GOARCH {
			continue
		}
		out, err := exec.Command(filepath.Join(binDir, b[2]), "--version").Output()
		if err != nil || strings.TrimSpace(strings.TrimPrefix(string(out), "windkeep version ")) != version {
			break
		}
		fmt.Printf("Version %s already built. Continue? (y/N): ", version)
		var input string
		fmt.Scanln(&input)
		if !strings.EqualFold(strings.TrimSpace(input), "y") {
			fmt.Println("Build cancelled.")
			return
		}
	}

	if err := os.RemoveAll(binDir); err != nil {
		log.Fatalf("failed to remove bin dir: %v", err)
	}
	if err := os.MkdirAll(binDir, 0755); err != nil {
		log.Fatalf("failed to create bin dir: %v", err)
	}

	ldflags := "-s -w -X github.com/matimortari/windkeep/cli/cmd.Version=" + version
	var checksums strings.Builder
	for _, b := range builds {
		goos, arch, name := b[0], b[1], b[2]
		fmt.Printf("\nBuilding %s...\n", name)

		out := filepath.Join(binDir, name)
		cmd := exec.Command("go", "build", "-o", out, "-ldflags="+ldflags, ".")
		cmd.Env = append(os.Environ(), "GOOS="+goos, "GOARCH="+arch, "CGO_ENABLED=0")
		cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr
		if err := cmd.Run(); err != nil {
			fmt.Printf("✗ Failed: %v\n", err)
			continue
		}

		data, err := os.ReadFile(out)
		if err != nil {
			fmt.Printf("✗ Failed to hash: %v\n", err)
			continue
		}
		sum := sha256.Sum256(data)
		fmt.Fprintf(&checksums, "%s  %s\n", hex.EncodeToString(sum[:]), name)
		fmt.Printf("✓ %s (%.2f MB)\n", name, float64(len(data))/1e6)
	}

	if err := os.WriteFile(filepath.Join(binDir, "checksums.txt"), []byte(checksums.String()), 0644); err != nil {
		log.Fatalf("failed to write checksums: %v", err)
	}
}
