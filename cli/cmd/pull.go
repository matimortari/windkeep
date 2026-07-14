package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/ui"
	"github.com/spf13/cobra"
)

var (
	pullEnv string
)

var pullCmd = &cobra.Command{
	Use:   "pull [OUTPUT_FILE]",
	Short: "Pull secrets from WindKeep to a local file",
	Long: `Pull secrets from the active project and save to a .env file.

Examples:
  windkeep pull
  windkeep pull prod.env -e production
  windkeep pull .env.staging -e staging -p my-api`,
	Args: cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		projectSlug, _ := cmd.Flags().GetString("project")

		env, err := api.ParseEnvironment(pullEnv)
		if err != nil {
			return err
		}

		client := newClient()
		project, err := resolveProject(client, projectSlug)
		if err != nil {
			return err
		}

		outputFile := fmt.Sprintf(".env.%s.%s", project.Slug, strings.ToLower(pullEnv))
		if len(args) > 0 {
			outputFile = args[0]
		}

		ui.PrintInfo("Project: %s  •  Env: %s", ui.Highlight(project.Name), ui.Info(pullEnv))

		secrets, err := client.GetSecrets(project.ID)
		if err != nil {
			return fmt.Errorf("failed to get secrets: %w", err)
		}

		var lines []string
		for _, secret := range secrets {
			for _, val := range secret.Values {
				if val.Environment == env {
					lines = append(lines, fmt.Sprintf("%s=%s", secret.Key, val.Value))
					break
				}
			}
		}
		if len(lines) == 0 {
			ui.PrintWarning("No secrets found for %s environment", pullEnv)
			return nil
		}

		if err := os.WriteFile(outputFile, []byte(strings.Join(lines, "\n")+"\n"), 0600); err != nil {
			return fmt.Errorf("failed to write '%s': %w", outputFile, err)
		}

		ui.PrintSuccess("Pulled %d secret(s) → %s", len(lines), ui.Highlight(outputFile))
		return nil
	},
}

func init() {
	pullCmd.Flags().StringVarP(&pullEnv, "env", "e", "development", "Environment to pull (dev/development, staging, prod/production)")
	pullCmd.Flags().StringP("project", "p", "", "Project slug (overrides active project)")
}
