package cmd

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"

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

		targetPath := exePath + ".new"
		if runtime.GOOS != "windows" {
			targetPath = exePath + ".tmp"
		}

		downloaded, err := io.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("failed to read download: %w", err)
		}

		if err := os.WriteFile(targetPath, downloaded, 0755); err != nil {
			return fmt.Errorf("failed to write binary: %w", err)
		}

		checksumsURL := fmt.Sprintf("%s/api/downloads/checksums.txt", config.APIURL)
		checksumsResp, err := http.Get(checksumsURL)
		if err != nil {
			os.Remove(targetPath)
			return fmt.Errorf("failed to fetch checksums: %w", err)
		}
		defer checksumsResp.Body.Close()

		if checksumsResp.StatusCode != http.StatusOK {
			os.Remove(targetPath)
			return fmt.Errorf("checksums fetch failed with status: %d", checksumsResp.StatusCode)
		}

		checksumsBody, err := io.ReadAll(checksumsResp.Body)
		if err != nil {
			os.Remove(targetPath)
			return fmt.Errorf("failed to read checksums: %w", err)
		}

		expected := ""
		for _, line := range strings.Split(string(checksumsBody), "\n") {
			fields := strings.Fields(line)
			if len(fields) >= 2 && fields[1] == binaryName {
				expected = fields[0]
				break
			}
		}
		if expected == "" {
			os.Remove(targetPath)
			return fmt.Errorf("checksum not found for %s", binaryName)
		}

		sum := sha256.Sum256(downloaded)
		actual := hex.EncodeToString(sum[:])
		if actual != expected {
			os.Remove(targetPath)
			return fmt.Errorf("checksum mismatch for %s", binaryName)
		}

		if runtime.GOOS != "windows" {
			if err := os.Chmod(targetPath, 0755); err != nil {
				os.Remove(targetPath)
				return fmt.Errorf("failed to make binary executable: %w", err)
			}

			if err := os.Rename(targetPath, exePath); err != nil {
				os.Remove(targetPath)
				return fmt.Errorf("failed to replace binary: %w", err)
			}

			out, err := exec.Command(exePath, "--version").Output()
			if err != nil {
				ui.PrintSuccess("WindKeep CLI upgraded successfully!")
				return nil
			}

			installedVersion := strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(string(out)), "windkeep version "))
			if installedVersion == Version {
				ui.PrintInfo("Already on version %s.", ui.Highlight(Version))
			} else {
				ui.PrintSuccess("WindKeep CLI upgraded from %s to %s!", Version, installedVersion)
			}
			return nil
		}

		ui.PrintSuccess("Download complete.")
		ui.PrintInfo("Run %s again to finish installing the upgrade on Windows.", ui.Highlight("windkeep --version"))
		return nil
	},
}

func init() {
	rootCmd.AddCommand(upgradeCmd)
}
