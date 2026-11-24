package cmd

import (
	"fmt"
	"strings"

	"github.com/bgentry/speakeasy"
	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/matimortari/windkeep/cli/ui"
	"github.com/spf13/cobra"
)

var loginCmd = &cobra.Command{
	Use:   "login [TOKEN]",
	Short: "Authenticate with WindKeep",
	Long: `Authenticate with WindKeep using a personal API token or a project-scoped service token.

Personal tokens (from Preferences) unlock the full CLI for interactive use.
Service tokens (st_… from a project's Access Control) are scoped to one project
and are the right choice for CI/CD – they can only read secrets.`,
	Args: cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		var apiToken string

		if len(args) == 0 {
			ui.PrintInfo("Login to the WindKeep CLI")
			fmt.Println()
			ui.PrintInfo("Personal token: %s", ui.Highlight(config.APIURL+"/admin/preferences"))
			ui.PrintInfo("Service token:  project → Access Control (recommended for CI)")
			fmt.Println()

			token, err := speakeasy.Ask("Enter your token: ")
			if err != nil {
				return fmt.Errorf("failed to read token: %w", err)
			}
			apiToken = strings.TrimSpace(token)
			if apiToken == "" {
				ui.PrintWarning("No token provided. Authentication cancelled.")
				return nil
			}
		} else {
			apiToken = args[0]
		}

		ui.PrintInfo("Validating token...")
		client := api.NewClient(config.APIURL, apiToken)

		saved, err := config.Load()
		if err != nil {
			saved = &config.Config{}
		}
		saved.APIToken = apiToken
		saved.ServiceTokenName = ""

		if api.IsServiceToken(apiToken) {
			info, err := client.GetServiceToken()
			if err != nil {
				ui.PrintError("Authentication failed")
				return err
			}

			saved.ActiveOrgID = info.Project.OrgID
			saved.ActiveOrgName = ""
			saved.ActiveProjectID = info.Project.ID
			saved.ActiveProjectSlug = info.Project.Slug
			saved.ActiveProjectName = info.Project.Name
			saved.ServiceTokenName = info.Name

			if err := saved.Save(); err != nil {
				return fmt.Errorf("failed to save config: %w", err)
			}

			ui.PrintSuccess("Authenticated with service token %s", ui.Highlight(info.Name))
			ui.PrintInfo("Scoped to project %s (%s)", ui.Highlight(info.Project.Name), ui.Info(info.Project.Slug))
			ui.PrintInfo("Allowed environments: %s", ui.Info(joinEnvironments(info.Environment)))
			return nil
		}

		user, err := client.GetUser()
		if err != nil {
			ui.PrintError("Authentication failed")
			return err
		}

		if err := saved.Save(); err != nil {
			return fmt.Errorf("failed to save config: %w", err)
		}

		ui.PrintSuccess("Successfully authenticated as %s (%s)", ui.Highlight(user.Name), ui.Info(user.Email))
		return nil
	},
}

func joinEnvironments(envs []api.Environment) string {
	parts := make([]string, len(envs))
	for i, env := range envs {
		parts[i] = string(env)
	}
	return strings.Join(parts, ", ")
}
