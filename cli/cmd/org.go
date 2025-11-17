package cmd

import "github.com/spf13/cobra"

var orgsCmd = &cobra.Command{
	Use:     "orgs",
	Aliases: []string{"organizations"},
	Short:   "Manage organizations",
	Long:    `List, create, and switch between organizations.`,
}
