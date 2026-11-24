package cmd

import (
	"fmt"
	"slices"
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
	Short:         "WindKeep CLI – Manage your secrets from the terminal",
	SilenceUsage:  true,
	SilenceErrors: true,
	Long: `WindKeep CLI is a command-line interface for managing secrets,
organizations, and projects in your WindKeep instance.

Securely store, retrieve, and manage sensitive information across
multiple environments with ease.`,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		path := strings.TrimPrefix(cmd.CommandPath(), cmd.Root().Name()+" ")
		topLevel, _, _ := strings.Cut(path, " ")
		if slices.Contains(noAuthCommands, topLevel) {
			return nil
		}

		var err error
		if cfg, err = config.LoadAuth(); err != nil {
			return fmt.Errorf("%w\nRun 'windkeep login' or set WINDKEEP_TOKEN", err)
		}
		if api.IsServiceToken(cfg.APIToken) && !slices.Contains(serviceTokenCommands, path) {
			return fmt.Errorf("service tokens are read-only and project-scoped – '%s' requires a personal API token from Preferences", path)
		}
		return nil
	},
}

var (
	noAuthCommands       = []string{"login", "logout", "upgrade", "help", "completion", cobra.ShellCompRequestCmd, cobra.ShellCompNoDescRequestCmd}
	serviceTokenCommands = []string{"run", "pull", "whoami", "secrets list", "secrets get"}
)

func Execute() error {
	return rootCmd.Execute()
}

func init() {
	rootCmd.Version = Version
	rootCmd.AddCommand(loginCmd, logoutCmd, orgsCmd, projectsCmd, secretsCmd, runCmd, pullCmd, pushCmd, whoamiCmd, upgradeCmd)
}
