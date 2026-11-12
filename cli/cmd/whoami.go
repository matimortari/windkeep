package cmd

import (
	"fmt"

	"github.com/matimortari/windkeep/cli/config"
	"github.com/matimortari/windkeep/cli/ui"
	"github.com/spf13/cobra"
)

var whoamiCmd = &cobra.Command{
	Use:   "whoami",
	Short: "Display current user and configuration",
	Long:  `Show information about the currently authenticated user or service token and active configuration.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newClient()

		if usingServiceToken() {
			info, err := client.GetServiceToken()
			if err != nil {
				return fmt.Errorf("failed to validate service token: %w", err)
			}

			ui.PrintInfo("Service Token")
			fmt.Printf("Name:         %s\n", ui.Highlight(info.Name))
			fmt.Printf("Environments: %s\n", ui.Info(joinEnvironments(info.Environment)))
			if info.ExpiresAt != nil {
				fmt.Printf("Expires:      %s\n", ui.Info(info.ExpiresAt.Format("2006-01-02")))
			} else {
				fmt.Printf("Expires:      %s\n", ui.Info("never"))
			}
			fmt.Println()

			ui.PrintInfo("Scoped Project")
			fmt.Printf("Project:      %s\n", ui.Highlight(info.Project.Name))
			fmt.Printf("Slug:         %s\n", ui.Info(info.Project.Slug))
			fmt.Printf("ID:           %s\n", ui.Info(info.Project.ID))
			fmt.Println()
		} else {
			user, err := client.GetUser()
			if err != nil {
				return fmt.Errorf("failed to get user information: %w", err)
			}

			ui.PrintInfo("User Information")
			fmt.Printf("Name:  %s\n", ui.Highlight(user.Name))
			fmt.Printf("Email: %s\n", ui.Info(user.Email))
			fmt.Println()

			ui.PrintInfo("Active Context")
			if cfg.ActiveOrgID != "" {
				fmt.Printf("Organization: %s\n", ui.Highlight(cfg.ActiveOrgName))
				fmt.Printf("ID:           %s\n", ui.Info(cfg.ActiveOrgID))
			} else {
				ui.PrintWarning("No active organization")
			}

			if cfg.ActiveProjectSlug != "" {
				fmt.Printf("Project:      %s\n", ui.Highlight(cfg.ActiveProjectName))
				fmt.Printf("Slug:         %s\n", ui.Info(cfg.ActiveProjectSlug))
			} else {
				ui.PrintWarning("No active project")
			}
			fmt.Println()
		}

		configPath, err := config.GetConfigPath()
		if err != nil {
			return fmt.Errorf("failed to get config path: %w", err)
		}

		fmt.Printf("Config: %s\n", configPath)

		return nil
	},
}
