package cmd

import (
	"fmt"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/matimortari/windkeep/cli/ui"
	"github.com/spf13/cobra"
)

var whoamiCmd = &cobra.Command{
	Use:   "whoami",
	Short: "Display current user and configuration",
	Long:  `Show information about the currently authenticated user and active configuration.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := api.NewClient(config.APIURL, cfg.APIToken)
		user, err := client.GetUser()
		if err != nil {
			return fmt.Errorf("failed to get user information: %w", err)
		}

		ui.PrintInfo("User Information")
		fmt.Printf("Name:  %s\n", ui.Highlight(user.Name))
		fmt.Printf("Email: %s\n", ui.Info(user.Email))
		fmt.Println()

		var activeOrgName, activeOrgID string
		for _, membership := range user.OrgMemberships {
			if membership.IsActive {
				activeOrgName = membership.Org.Name
				activeOrgID = membership.OrgID
				break
			}
		}

		ui.PrintInfo("Active Context")
		if activeOrgID != "" {
			fmt.Printf("Organization: %s\n", ui.Highlight(activeOrgName))
			fmt.Printf("ID:           %s\n", ui.Info(activeOrgID))
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

		configPath, err := config.GetConfigPath(cfgFile)
		if err != nil {
			return fmt.Errorf("failed to get config path: %w", err)
		}

		fmt.Printf("Config: %s\n", configPath)

		return nil
	},
}
