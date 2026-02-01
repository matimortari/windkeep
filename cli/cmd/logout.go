package cmd

import (
	"fmt"

	"github.com/matimortari/windkeep/cli/config"
	"github.com/matimortari/windkeep/cli/ui"
	"github.com/spf13/cobra"
)

var logoutCmd = &cobra.Command{
	Use:   "logout",
	Short: "Remove authentication credentials",
	Long:  `Remove stored authentication credentials from the configuration file.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		if err := config.Delete(cfgFile); err != nil {
			return fmt.Errorf("failed to logout: %w", err)
		}

		ui.PrintSuccess("Successfully logged out")
		return nil
	},
}
