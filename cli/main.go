package main

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"

	"github.com/matimortari/windkeep/cli/cmd"
	"github.com/matimortari/windkeep/cli/ui"
)

func main() {
	if applied, err := applyPendingUpgrade(); err != nil {
		fmt.Fprintf(os.Stderr, "Warning: pending upgrade failed: %v\n", err)
	} else if applied {
		fmt.Println("WindKeep CLI upgraded successfully.")
		// Finish leftover two-step upgrades from older CLI builds.
		reexec()
		return
	}

	if err := cmd.Execute(); err != nil {
		ui.PrintError("%v", err)
		os.Exit(1)
	}
}

// applyPendingUpgrade installs a leftover windkeep.exe.new from older upgrade flows.
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

	if err := cmd.ReplaceExecutable(exePath, pendingPath); err != nil {
		return false, fmt.Errorf("failed to install pending upgrade: %w", err)
	}
	return true, nil
}

// reexec runs the freshly installed binary with the original arguments and exits with its status.
func reexec() {
	exePath, err := os.Executable()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Warning: could not restart upgraded binary: %v\n", err)
		if err := cmd.Execute(); err != nil {
			ui.PrintError("%v", err)
			os.Exit(1)
		}
		return
	}

	c := exec.Command(exePath, os.Args[1:]...)
	c.Stdin = os.Stdin
	c.Stdout = os.Stdout
	c.Stderr = os.Stderr
	if err := c.Run(); err != nil {
		if ee, ok := err.(*exec.ExitError); ok {
			os.Exit(ee.ExitCode())
		}
		fmt.Fprintf(os.Stderr, "Warning: upgraded binary failed: %v\n", err)
		os.Exit(1)
	}
	os.Exit(0)
}
