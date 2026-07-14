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
			ui.PrintInfo("Login to the WindKeep CLI")
			fmt.Println()
			ui.PrintInfo("Get your API token from: %s", ui.Highlight(config.APIURL+"/admin/preferences"))
			fmt.Println()

			token, err := speakeasy.Ask("Enter your API token: ")
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
		user, err := api.NewClient(config.APIURL, apiToken).GetUser()
		if err != nil {
			ui.PrintError("Authentication failed")
			return err
		}

		saved, err := config.Load()
		if err != nil {
			saved = &config.Config{}
		}
		saved.APIToken = apiToken
		if err := saved.Save(); err != nil {
			return fmt.Errorf("failed to save config: %w", err)
		}

		ui.PrintSuccess("Successfully authenticated as %s (%s)", ui.Highlight(user.Name), ui.Info(user.Email))
		return nil
	},
}
