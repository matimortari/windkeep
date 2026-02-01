package cmd

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"runtime"

	"github.com/matimortari/windkeep/cli/config"
	"github.com/matimortari/windkeep/cli/ui"
	"github.com/spf13/cobra"
)

var upgradeCmd = &cobra.Command{
	Use:   "upgrade",
	Short: "Upgrade WindKeep CLI to the latest version",
	Long:  `Download and install the latest version of the WindKeep CLI.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		ui.PrintInfo("Checking for updates...")

		// Determine the binary name based on OS and architecture
		binaryName := fmt.Sprintf("windkeep-%s-%s", runtime.GOOS, runtime.GOARCH)
		if runtime.GOOS == "windows" {
			binaryName += ".exe"
		}

		downloadURL := fmt.Sprintf("%s/api/downloads/%s", config.APIURL, binaryName)
		ui.PrintInfo("Downloading latest version from %s", ui.Highlight(downloadURL))

		resp, err := http.Get(downloadURL)
		if err != nil {
			return fmt.Errorf("failed to download: %w", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return fmt.Errorf("download failed with status: %d", resp.StatusCode)
		}

		exePath, err := os.Executable()
		if err != nil {
			return fmt.Errorf("failed to get executable path: %w", err)
		}

		tempPath := exePath + ".tmp"
		tempFile, err := os.Create(tempPath)
		if err != nil {
			return fmt.Errorf("failed to create temp file: %w", err)
		}
		defer tempFile.Close()

		_, err = io.Copy(tempFile, resp.Body)
		if err != nil {
			os.Remove(tempPath)
			return fmt.Errorf("failed to write binary: %w", err)
		}

		tempFile.Close()

		// Make it executable on Unix systems
		if runtime.GOOS != "windows" {
			if err := os.Chmod(tempPath, 0755); err != nil {
				os.Remove(tempPath)
				return fmt.Errorf("failed to make binary executable: %w", err)
			}
		}

		// Replace the current binary with the new one
		if err := os.Rename(tempPath, exePath); err != nil {
			os.Remove(tempPath)
			return fmt.Errorf("failed to replace binary: %w", err)
		}

		ui.PrintSuccess("WindKeep CLI upgraded successfully!")
		ui.PrintInfo("Run %s to verify", ui.Highlight("windkeep --version"))

		return nil
	},
}

func init() {
	rootCmd.AddCommand(upgradeCmd)
}
