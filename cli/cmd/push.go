package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/ui"
	"github.com/spf13/cobra"
)

var pushEnv string

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
		env, err := api.ParseEnvironment(pushEnv)
		if err != nil {
			return err
		}

		client := newClient()
		project, err := resolveProject(client, "")
		if err != nil {
			return err
		}

		ui.PrintInfo("Project: %s  •  Env: %s", ui.Highlight(project.Name), ui.Info(pushEnv))

		data, err := os.ReadFile(inputFile)
		if err != nil {
			return fmt.Errorf("failed to read '%s': %w", inputFile, err)
		}

		type parsedEntry struct {
			key, value string
		}
		var entries []parsedEntry

		lineNum := 0
		for line := range strings.Lines(string(data)) {
			lineNum++
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}

			key, value, ok := strings.Cut(line, "=")
			if !ok {
				ui.PrintWarning("Skipping line %d: invalid format (expected KEY=VALUE)", lineNum)
				continue
			}

			key, value = strings.TrimSpace(key), strings.TrimSpace(value)
			if len(value) >= 2 && (value[0] == '"' || value[0] == '\'') && value[len(value)-1] == value[0] {
				value = value[1 : len(value)-1]
			}
			if key != "" {
				entries = append(entries, parsedEntry{key, value})
			}
		}
		if len(entries) == 0 {
			ui.PrintWarning("No secrets found in '%s'", inputFile)
			return nil
		}

		existing, err := client.GetSecrets(project.ID)
		if err != nil {
			return fmt.Errorf("failed to fetch existing secrets: %w", err)
		}

		existingMap := make(map[string]*api.Secret, len(existing))
		for i := range existing {
			existingMap[existing[i].Key] = &existing[i]
		}

		created, updated, skipped := 0, 0, 0
		for _, entry := range entries {
			values := []api.SecretValueInput{{Environment: env, Value: entry.value}}
			existingSecret, exists := existingMap[entry.key]
			switch {
			case exists && !overwrite:
				ui.PrintWarning("Skipping '%s' (already exists – use --overwrite to update)", entry.key)
				skipped++
			case exists:
				req := api.UpdateSecretRequest{Values: mergeSecretValues(existingSecret.Values, values)}
				if _, err := client.UpdateSecret(project.ID, existingSecret.ID, req); err != nil {
					ui.PrintWarning("Failed to update '%s': %v", entry.key, err)
					skipped++
				} else {
					updated++
				}
			default:
				req := api.CreateSecretRequest{Key: entry.key, ProjectID: project.ID, Values: values}
				if _, err := client.CreateSecret(project.ID, req); err != nil {
					ui.PrintWarning("Failed to create '%s': %v", entry.key, err)
					skipped++
				} else {
					created++
				}
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
