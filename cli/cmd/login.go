package cmd

import (
	"fmt"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/spf13/cobra"
)

var loginCmd = &cobra.Command{
	Use:   "login [API_TOKEN]",
	Short: "Authenticate with WindKeep",
	Long:  `Authenticate with WindKeep using your API token.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		apiToken := args[0]
		apiURL, _ := cmd.Flags().GetString("api-url")

		// Validate token by making a test request
		client := api.NewClient(apiURL, apiToken)
		var user api.User
		if err := client.Get("/api/user", &user); err != nil {
			return fmt.Errorf("authentication failed: %w", err)
		}

		// Save configuration
		cfg := &config.Config{
			APIToken:      apiToken,
			APIURL:        apiURL,
			ActiveOrgID:   "",
			ActiveOrgName: "",
		}

		if err := cfg.Save(cfgFile); err != nil {
			return fmt.Errorf("failed to save config: %w", err)
		}

		fmt.Printf("✓ Successfully authenticated as %s (%s)\n", user.Name, user.Email)
		configPath, _ := config.GetConfigPath(cfgFile)
		fmt.Printf("Configuration saved to: %s\n", configPath)

		return nil
	},
}
