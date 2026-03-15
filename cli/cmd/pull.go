package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
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
		outputFile := ".env"
		if len(args) > 0 {
			outputFile = args[0]
		}

		projectSlug, _ := cmd.Flags().GetString("project")
		client := api.NewClient(config.APIURL, cfg.APIToken)

		var projectID string
		var projectName string
		if projectSlug != "" {
			projects, err := client.GetProjects()
			if err != nil {
				return fmt.Errorf("failed to get projects: %w", err)
			}
			found := false
			for _, proj := range projects {
				if proj.Slug == projectSlug {
					projectID = proj.ID
					projectName = proj.Name
					found = true
					break
				}
			}
			if !found {
				return fmt.Errorf("project '%s' not found", projectSlug)
			}
		} else {
			var err error
			projectID, err = getActiveProjectID(client)
			if err != nil {
				return err
			}
			projectName = cfg.ActiveProjectName
			if projectName == "" {
				projectName = cfg.ActiveProjectSlug
			}
		}

		ui.PrintInfo("Project: %s  •  Env: %s", ui.Highlight(projectName), ui.Info(pullEnv))

		secrets, err := client.GetSecrets(projectID)
		if err != nil {
			return fmt.Errorf("failed to get secrets: %w", err)
		}

		env := api.ParseEnvironment(pullEnv)
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

		content := strings.Join(lines, "\n") + "\n"
		if err := os.WriteFile(outputFile, []byte(content), 0600); err != nil {
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
