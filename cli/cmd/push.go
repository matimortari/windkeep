package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/matimortari/windkeep/cli/ui"
	"github.com/spf13/cobra"
)

var (
	pushEnv string
)

var pushCmd = &cobra.Command{
	Use:   "push [INPUT_FILE]",
	Short: "Push secrets from a local file to WindKeep",
	Long: `Push secrets from a .env file to the active project.

By default, existing secrets are skipped. Use --overwrite to update them.

Examples:
  windkeep push
  windkeep push prod.env -e production
  windkeep push staging.env -e staging --overwrite`,
	Args: cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		inputFile := ".env"
		if len(args) > 0 {
			inputFile = args[0]
		}

		overwrite, _ := cmd.Flags().GetBool("overwrite")
		client := api.NewClient(config.APIURL, cfg.APIToken)
		projectID, err := getActiveProjectID(client)
		if err != nil {
			return err
		}

		ui.PrintInfo("Project: %s  •  Env: %s", ui.Highlight(cfg.ActiveProjectName), ui.Info(pushEnv))

		data, err := os.ReadFile(inputFile)
		if err != nil {
			return fmt.Errorf("failed to read '%s': %w", inputFile, err)
		}

		// Parse .env file
		type parsedEntry struct {
			key   string
			value string
		}
		var entries []parsedEntry

		scanner := bufio.NewScanner(strings.NewReader(string(data)))
		lineNum := 0
		for scanner.Scan() {
			lineNum++
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}

			parts := strings.SplitN(line, "=", 2)
			if len(parts) != 2 {
				ui.PrintWarning("Skipping line %d: invalid format (expected KEY=VALUE)", lineNum)
				continue
			}

			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])
			if key == "" {
				continue
			}

			entries = append(entries, parsedEntry{key, value})
		}

		if err := scanner.Err(); err != nil {
			return fmt.Errorf("failed to read file: %w", err)
		}

		if len(entries) == 0 {
			ui.PrintWarning("No secrets found in '%s'", inputFile)
			return nil
		}

		// Fetch existing secrets to detect conflicts
		existing, err := client.GetSecrets(projectID)
		if err != nil {
			return fmt.Errorf("failed to fetch existing secrets: %w", err)
		}

		existingMap := make(map[string]*api.Secret)
		for i := range existing {
			existingMap[existing[i].Key] = &existing[i]
		}

		env := api.ParseEnvironment(pushEnv)

		created, updated, skipped := 0, 0, 0

		for _, entry := range entries {
			if existingSecret, exists := existingMap[entry.key]; exists {
				if !overwrite {
					ui.PrintWarning("Skipping '%s' (already exists — use --overwrite to update)", entry.key)
					skipped++
					continue
				}

				// Update the existing secret's value for this environment
				req := api.UpdateSecretRequest{
					Values: []api.SecretValueInput{
						{Environment: env, Value: entry.value},
					},
				}
				if _, err := client.UpdateSecret(projectID, existingSecret.ID, req); err != nil {
					ui.PrintWarning("Failed to update '%s': %v", entry.key, err)
					skipped++
					continue
				}
				updated++
			} else {
				req := api.CreateSecretRequest{
					Key:       entry.key,
					ProjectID: projectID,
					Values: []api.SecretValueInput{
						{Environment: env, Value: entry.value},
					},
				}
				if _, err := client.CreateSecret(projectID, req); err != nil {
					ui.PrintWarning("Failed to create '%s': %v", entry.key, err)
					skipped++
					continue
				}
				created++
			}
		}

		fmt.Println()
		if created > 0 {
			ui.PrintSuccess("Created %d new secret(s)", created)
		}
		if updated > 0 {
			ui.PrintSuccess("Updated %d existing secret(s)", updated)
		}
		if skipped > 0 {
			ui.PrintWarning("Skipped %d secret(s)", skipped)
		}

		return nil
	},
}

func init() {
	pushCmd.Flags().StringVarP(&pushEnv, "env", "e", "development", "Environment to push to (dev/development, staging, prod/production)")
	pushCmd.Flags().Bool("overwrite", false, "Update secrets that already exist")
}
