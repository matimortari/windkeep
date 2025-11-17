package cmd

import "github.com/spf13/cobra"

var projectsCmd = &cobra.Command{
	Use:   "projects",
	Short: "Manage projects",
	Long:  `List, create, and manage projects within organizations.`,
}
