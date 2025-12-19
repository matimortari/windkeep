package cmd

import (
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/spf13/cobra"
)

var projectsCmd = &cobra.Command{
	Use:     "projects",
	Aliases: []string{"project", "proj"},
	Short:   "Manage projects",
	Long:    `List, create, and manage projects within organizations.`,
}

var projectsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List your projects",
	Long:  `List all projects you have access to.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := api.NewClient(cfg.APIURL, cfg.APIToken)

		projects, err := client.GetProjects()
		if err != nil {
			return fmt.Errorf("failed to get projects: %w", err)
		}

		if len(projects) == 0 {
			fmt.Println("No projects found. Create one with 'windkeep projects create'")
			return nil
		}

		w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
		fmt.Fprintln(w, "ID\tNAME\tSLUG\tORGANIZATION\tSECRETS")
		for _, proj := range projects {
			orgName := "N/A"
			if proj.Org != nil {
				orgName = proj.Org.Name
			}
			secretsCount := len(proj.Secrets)
			fmt.Fprintf(w, "%s\t%s\t%s\t%s\t%d\n",
				proj.ID,
				proj.Name,
				proj.Slug,
				orgName,
				secretsCount)
		}
		w.Flush()

		return nil
	},
}

var projectsCreateCmd = &cobra.Command{
	Use:   "create [NAME] [SLUG]",
	Short: "Create a new project",
	Long:  `Create a new project in your active organization.`,
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		if cfg.ActiveOrgID == "" {
			return fmt.Errorf("no active organization. Use 'windkeep orgs switch' first")
		}

		name := args[0]
		slug := args[1]
		description, _ := cmd.Flags().GetString("description")

		client := api.NewClient(cfg.APIURL, cfg.APIToken)

		req := api.CreateProjectRequest{
			Name:  name,
			Slug:  slug,
			OrgID: cfg.ActiveOrgID,
		}
		if description != "" {
			req.Description = &description
		}

		project, err := client.CreateProject(req)
		if err != nil {
			return fmt.Errorf("failed to create project: %w", err)
		}

		fmt.Printf("✓ Project '%s' created successfully (ID: %s)\n", project.Name, project.ID)

		// Update config
		cfg.ActiveProjectID = project.ID
		cfg.ActiveProjectName = project.Name
		if err := cfg.Save(cfgFile); err != nil {
			fmt.Printf("Warning: Failed to save active project to config: %v\n", err)
		}

		return nil
	},
}

var projectsSwitchCmd = &cobra.Command{
	Use:   "switch [PROJECT_ID]",
	Short: "Switch to a different project",
	Long:  `Set the active project for future commands.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		projectID := args[0]
		client := api.NewClient(cfg.APIURL, cfg.APIToken)

		projects, err := client.GetProjects()
		if err != nil {
			return fmt.Errorf("failed to get projects: %w", err)
		}

		var selectedProject *api.Project
		for _, proj := range projects {
			if proj.ID == projectID {
				selectedProject = &proj
				break
			}
		}

		if selectedProject == nil {
			return fmt.Errorf("project not found or you don't have access to it")
		}

		cfg.ActiveProjectID = selectedProject.ID
		cfg.ActiveProjectName = selectedProject.Name

		if err := cfg.Save(cfgFile); err != nil {
			return fmt.Errorf("failed to save config: %w", err)
		}

		fmt.Printf("✓ Switched to project '%s'\n", selectedProject.Name)
		return nil
	},
}

func init() {
	projectsCmd.AddCommand(projectsListCmd)
	projectsCmd.AddCommand(projectsCreateCmd)
	projectsCmd.AddCommand(projectsSwitchCmd)

	projectsCreateCmd.Flags().StringP("description", "d", "", "Project description")
}
