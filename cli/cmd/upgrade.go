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

		binaryName := fmt.Sprintf("windkeep-%s-%s", runtime.GOOS, runtime.GOARCH)
		if runtime.GOOS == "windows" {
			binaryName += ".exe"
		}

		downloadURL := fmt.Sprintf("%s/api/downloads/%s", config.APIURL, binaryName)
		ui.PrintInfo("Downloading latest version from %s", ui.Highlight(downloadURL))
		downloaded, err := download(downloadURL)
		if err != nil {
			return err
		}

		checksums, err := download(config.APIURL + "/api/downloads/checksums.txt")
		if err != nil {
			return err
		}
		expected := ""
		for line := range strings.Lines(string(checksums)) {
			if fields := strings.Fields(line); len(fields) >= 2 && fields[1] == binaryName {
				expected = fields[0]
				break
			}
		}
		if expected == "" {
			return fmt.Errorf("checksum not found for %s", binaryName)
		}
		if sum := sha256.Sum256(downloaded); hex.EncodeToString(sum[:]) != expected {
			return fmt.Errorf("checksum mismatch for %s", binaryName)
		}

		exePath, err := os.Executable()
		if err != nil {
			return fmt.Errorf("failed to get executable path: %w", err)
		}
		targetPath := exePath + ".tmp"
		if runtime.GOOS == "windows" {
			targetPath = exePath + ".new"
		}
		if err := os.WriteFile(targetPath, downloaded, 0755); err != nil {
			return fmt.Errorf("failed to write binary: %w", err)
		}
		keepTarget := false
		defer func() {
			if !keepTarget {
				os.Remove(targetPath)
			}
		}()

		installedVersion, versionErr := binaryVersion(targetPath)
		if versionErr == nil && installedVersion == Version {
			ui.PrintInfo("Already on version %s.", ui.Highlight(Version))
			return nil
		}

		if runtime.GOOS == "windows" {
			if err := ReplaceExecutable(exePath, targetPath); err != nil {
				// Leave *.new so the next process start can finish the install.
				keepTarget = true
				ui.PrintSuccess("Download complete.")
				ui.PrintInfo("Could not replace the running binary. Run any windkeep command to finish installing.")
				return nil
			}
		} else {
			if err := os.Chmod(targetPath, 0755); err != nil {
				return fmt.Errorf("failed to make binary executable: %w", err)
			}
			if err := os.Rename(targetPath, exePath); err != nil {
				return fmt.Errorf("failed to replace binary: %w", err)
			}
		}

		if versionErr != nil {
			ui.PrintSuccess("WindKeep CLI upgraded successfully!")
		} else {
			ui.PrintSuccess("WindKeep CLI upgraded from %s to %s!", Version, installedVersion)
		}
		return nil
	},
}

func download(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to download %s: %w", url, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("download of %s failed with status: %d", url, resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read %s: %w", url, err)
	}
	return body, nil
}

func binaryVersion(path string) (string, error) {
	out, err := exec.Command(path, "--version").Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(strings.TrimPrefix(string(out), "windkeep version ")), nil
}

// ReplaceExecutable swaps exePath for newPath via renames, since Windows blocks
// overwriting a running executable but allows renaming it.
func ReplaceExecutable(exePath, newPath string) error {
	oldPath := exePath + ".old"
	_ = os.Remove(oldPath)
	if err := os.Rename(exePath, oldPath); err != nil {
		return err
	}
	if err := os.Rename(newPath, exePath); err != nil {
		_ = os.Rename(oldPath, exePath)
		return err
	}
	_ = os.Remove(oldPath)
	return nil
}
