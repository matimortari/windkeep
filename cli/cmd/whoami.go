package cmd

import (
	"fmt"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
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

		fmt.Printf("Name:  %s\n", user.Name)
		fmt.Printf("Email: %s\n", user.Email)

		var activeOrgName, activeOrgID string
		for _, membership := range user.OrgMemberships {
			if membership.IsActive {
				activeOrgName = membership.Org.Name
				activeOrgID = membership.OrgID
				break
			}
		}

		if activeOrgID != "" {
			fmt.Printf("Active Organization: %s (ID: %s)\n", activeOrgName, activeOrgID)
		} else {
			fmt.Println("Active Organization: None")
		}

		if cfg.ActiveProjectSlug != "" {
			fmt.Printf("Active Project: %s (id: %s, slug: %s)\n", cfg.ActiveProjectName, cfg.ActiveProjectID, cfg.ActiveProjectSlug)
		} else {
			fmt.Println("Active Project: None")
		}

		configPath, err := config.GetConfigPath(cfgFile)
		if err != nil {
			return fmt.Errorf("failed to get config path: %w", err)
		}

		fmt.Printf("\nConfiguration file is located at %s\n", configPath)

		return nil
	},
}
