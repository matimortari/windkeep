package cmd

import (
	"fmt"
	"strings"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/spf13/cobra"
)

var (
	cfg     *config.Config
	Version = "dev"
)

var rootCmd = &cobra.Command{
	Use:           "windkeep",
	Aliases:       []string{"wk"},
	Short:         "WindKeep CLI — Manage your secrets from the terminal",
	SilenceUsage:  true,
	SilenceErrors: true,
	Long: `WindKeep CLI is a command-line interface for managing secrets,
organizations, and projects in your WindKeep instance.

Securely store, retrieve, and manage sensitive information across
multiple environments with ease.`,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		// Skip auth check for auth/upgrade commands and --version flag
		if cmd.Name() == "login" || cmd.Name() == "logout" || cmd.Name() == "init" || cmd.Name() == "upgrade" {
			return nil
		}
		if v, err := cmd.Flags().GetBool("version"); err == nil && v {
			return nil
		}

		var err error
		cfg, err = config.LoadAuth()
		if err != nil {
			return fmt.Errorf("%w\nRun 'windkeep login' or set WINDKEEP_TOKEN", err)
		}

		if api.IsServiceToken(cfg.APIToken) {
			if err := ensureServiceTokenCommandAllowed(cmd); err != nil {
				return err
			}
		}

		return nil
	},
}

func ensureServiceTokenCommandAllowed(cmd *cobra.Command) error {
	var parts []string
	for c := cmd; c != nil && c.Parent() != nil; c = c.Parent() {
		parts = append([]string{c.Name()}, parts...)
	}
	path := strings.Join(parts, " ")

	allowed := []string{"run", "pull", "whoami", "secrets list", "secrets get"}
	for _, name := range allowed {
		if path == name {
			return nil
		}
	}

	return fmt.Errorf("service tokens are read-only and project-scoped — '%s' requires a personal API token from Preferences", path)
}

func Execute() error {
	return rootCmd.Execute()
}

func init() {
	rootCmd.Version = Version
	rootCmd.PersistentFlags().BoolP("verbose", "v", false, "Enable verbose output")
	rootCmd.AddCommand(loginCmd)
	rootCmd.AddCommand(logoutCmd)
	rootCmd.AddCommand(orgsCmd)
	rootCmd.AddCommand(projectsCmd)
	rootCmd.AddCommand(secretsCmd)
	rootCmd.AddCommand(runCmd)
	rootCmd.AddCommand(pullCmd)
	rootCmd.AddCommand(pushCmd)
	rootCmd.AddCommand(whoamiCmd)
}
