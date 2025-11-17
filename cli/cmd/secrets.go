package cmd

import "github.com/spf13/cobra"

var secretsCmd = &cobra.Command{
	Use:   "secrets",
	Short: "Manage secrets",
	Long:  `Create, list, update, and delete secrets in your projects.`,
}
