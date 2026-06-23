package main

import (
	"fmt"
	"os"
	"runtime"

	"github.com/matimortari/windkeep/cli/cmd"
)

func main() {
	if applied, err := applyPendingUpgrade(); err != nil {
		fmt.Fprintf(os.Stderr, "Warning: pending upgrade failed: %v\n", err)
	} else if applied {
		fmt.Println("WindKeep CLI upgraded successfully.")
	}

	if err := cmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

// applyPendingUpgrade installs a downloaded binary on Windows, where the running executable cannot be replaced in-place. Returns true when an upgrade was applied.
func applyPendingUpgrade() (bool, error) {
	if runtime.GOOS != "windows" {
		return false, nil
	}

	exePath, err := os.Executable()
	if err != nil {
		return false, fmt.Errorf("failed to get executable path: %w", err)
	}

	pendingPath := exePath + ".new"
	if _, err := os.Stat(pendingPath); os.IsNotExist(err) {
		return false, nil
	}

	oldPath := exePath + ".old"
	_ = os.Remove(oldPath)

	if err := os.Rename(exePath, oldPath); err != nil {
		return false, fmt.Errorf("failed to stage current binary: %w", err)
	}
	if err := os.Rename(pendingPath, exePath); err != nil {
		_ = os.Rename(oldPath, exePath)
		return false, fmt.Errorf("failed to install pending upgrade: %w", err)
	}
	_ = os.Remove(oldPath)

	return true, nil
}
