package cmd

import (
	"fmt"

	"github.com/matimortari/windkeep/cli/config"
	"github.com/spf13/cobra"
)

var (
	cfgFile string
	cfg     *config.Config
)

var rootCmd = &cobra.Command{
	Use:   "windkeep",
	Short: "WindKeep CLI - Manage your secrets from the terminal",
	Long: `WindKeep CLI is a command-line interface for managing secrets,
organizations, and projects in your WindKeep instance.

Securely store, retrieve, and manage sensitive information across
multiple environments with ease.`,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		// Skip config loading for login and init commands
		if cmd.Name() == "login" || cmd.Name() == "init" {
			return nil
		}

		var err error
		cfg, err = config.Load(cfgFile)
		if err != nil {
			return fmt.Errorf("failed to load config: %w\nRun 'windkeep login' to authenticate", err)
		}

		if cfg.APIToken == "" {
			return fmt.Errorf("not authenticated. Run 'windkeep login' first")
		}

		return nil
	},
}

func Execute() error {
	return rootCmd.Execute()
}

func init() {
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.windkeep/config.yaml)")
	rootCmd.PersistentFlags().StringP("api-url", "u", "https://windkeep.vercel.app", "API base URL")
	rootCmd.PersistentFlags().BoolP("verbose", "v", false, "verbose output")

	// Add subcommands
	rootCmd.AddCommand(loginCmd)
	rootCmd.AddCommand(logoutCmd)
	rootCmd.AddCommand(configCmd)
	rootCmd.AddCommand(secretsCmd)
	rootCmd.AddCommand(orgsCmd)
	rootCmd.AddCommand(projectsCmd)
}
