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
	Use:   "login [API_TOKEN]",
	Short: "Authenticate with WindKeep",
	Long:  `Authenticate with WindKeep using your API token.`,
	Args:  cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		var apiToken string

		if len(args) == 0 {
			// Interactive mode
			ui.PrintInfo("Login to the WindKeep CLI")
			fmt.Println()
			ui.PrintInfo("Get your API token from: %s", ui.Highlight(config.APIURL+"/admin/preferences"))
			fmt.Println()

			// Prompt for token with hidden input
			token, err := speakeasy.Ask("Enter your API token: ")
			if err != nil {
				return fmt.Errorf("failed to read token: %w", err)
			}
			apiToken = strings.TrimSpace(strings.ReplaceAll(strings.ReplaceAll(token, "\n", ""), "\r", ""))

			if apiToken == "" {
				ui.PrintWarning("No token provided. Authentication cancelled.")
				return nil
			}
		} else {
			apiToken = args[0]
		}

		// Validate token by making a test request
		ui.PrintInfo("Validating token...")
		client := api.NewClient(config.APIURL, apiToken)
		user, err := client.GetUser()
		if err != nil {
			ui.PrintError("Authentication failed")
			return fmt.Errorf("%w", err)
		}

		// Save configuration
		cfg := &config.Config{
			APIToken: apiToken,
		}

		if err := cfg.Save(cfgFile); err != nil {
			return fmt.Errorf("failed to save config: %w", err)
		}

		ui.PrintSuccess("Successfully authenticated as %s (%s)", ui.Highlight(user.Name), ui.Info(user.Email))

		return nil
	},
}
