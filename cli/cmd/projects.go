package cmd

import (
	"fmt"
	"os"
	"regexp"
	"strings"
	"text/tabwriter"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/spf13/cobra"
)

func generateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "_", "-")
	reg := regexp.MustCompile("[^a-z0-9-]+")
	slug = reg.ReplaceAllString(slug, "")
	reg = regexp.MustCompile("-+")
	slug = reg.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")

	return slug
}

var projectsCmd = &cobra.Command{
	Use:     "projects",
	Aliases: []string{"project", "proj"},
	Short:   "Manage projects",
	Long:    `List, create, and manage projects within organizations.`,
}

var projectsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List your projects",
	Long:  `List all projects in your active organization.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		if cfg.ActiveOrgID == "" {
			return fmt.Errorf("no active organization. Use 'windkeep orgs switch' first")
		}

		client := api.NewClient(config.APIURL, cfg.APIToken)

		projects, err := client.GetProjects()
		if err != nil {
			return fmt.Errorf("failed to get projects: %w", err)
		}

		// Filter projects by active organization
		var orgProjects []api.Project
		for _, proj := range projects {
			if proj.Org != nil && proj.Org.ID == cfg.ActiveOrgID {
				orgProjects = append(orgProjects, proj)
			}
		}

		if len(orgProjects) == 0 {
			fmt.Printf("No projects found in '%s'. Create one with 'windkeep projects create'\n", cfg.ActiveOrgName)
			return nil
		}

		w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
		fmt.Fprintln(w, "ID\tNAME\tSLUG\tORGANIZATION\tSECRETS")
		for _, proj := range orgProjects {
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
	Use:   "create [NAME]",
	Short: "Create a new project",
	Long:  `Create a new project in your active organization. The slug will be auto-generated from the name.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		if cfg.ActiveOrgID == "" {
			return fmt.Errorf("no active organization. Use 'windkeep orgs switch' first")
		}

		name := args[0]
		description, _ := cmd.Flags().GetString("description")
		slug := generateSlug(name)

		client := api.NewClient(config.APIURL, cfg.APIToken)

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

		fmt.Printf("✓ Project '%s' created successfully (slug: %s)\n", project.Name, project.Slug)

		cfg.ActiveProjectSlug = project.Slug
		cfg.ActiveProjectName = project.Name
		if err := cfg.Save(cfgFile); err != nil {
			fmt.Printf("Warning: Failed to save active project to config: %v\n", err)
		}

		return nil
	},
}

var projectsSwitchCmd = &cobra.Command{
	Use:   "switch [PROJECT_SLUG]",
	Short: "Switch to a different project",
	Long:  `Set the active project for future commands.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		projectSlug := args[0]
		client := api.NewClient(config.APIURL, cfg.APIToken)

		projects, err := client.GetProjects()
		if err != nil {
			return fmt.Errorf("failed to get projects: %w", err)
		}

		var selectedProject *api.Project
		for _, proj := range projects {
			if proj.Slug == projectSlug {
				selectedProject = &proj
				break
			}
		}

		if selectedProject == nil {
			return fmt.Errorf("project not found or you don't have access to it")
		}

		cfg.ActiveProjectSlug = selectedProject.Slug
		cfg.ActiveProjectName = selectedProject.Name

		if err := cfg.Save(cfgFile); err != nil {
			return fmt.Errorf("failed to save config: %w", err)
		}

		fmt.Printf("✓ Switched to project '%s' (slug: %s)\n", selectedProject.Name, selectedProject.Slug)
		return nil
	},
}

var projectsUpdateCmd = &cobra.Command{
	Use:   "update [PROJECT_SLUG]",
	Short: "Update a project",
	Long:  `Update a project's name, slug, or description.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		projectSlug := args[0]
		name, _ := cmd.Flags().GetString("name")
		slug, _ := cmd.Flags().GetString("slug")
		description, _ := cmd.Flags().GetString("description")

		if name == "" && slug == "" && description == "" {
			return fmt.Errorf("at least one field must be provided (--name, --slug, or --description)")
		}

		client := api.NewClient(config.APIURL, cfg.APIToken)

		// Get project by slug first
		projects, err := client.GetProjects()
		if err != nil {
			return fmt.Errorf("failed to get projects: %w", err)
		}

		var projectID string
		for _, proj := range projects {
			if proj.Slug == projectSlug {
				projectID = proj.ID
				break
			}
		}

		if projectID == "" {
			return fmt.Errorf("project not found or you don't have access to it")
		}

		req := api.UpdateProjectRequest{}
		if name != "" {
			req.Name = &name
		}
		if slug != "" {
			req.Slug = &slug
		}
		if description != "" {
			req.Description = &description
		}

		project, err := client.UpdateProject(projectID, req)
		if err != nil {
			return fmt.Errorf("failed to update project: %w", err)
		}

		fmt.Printf("✓ Project '%s' updated successfully\n", project.Name)

		// Update config if it's the active project
		if cfg.ActiveProjectSlug == projectSlug {
			cfg.ActiveProjectSlug = project.Slug
			cfg.ActiveProjectName = project.Name
			if err := cfg.Save(cfgFile); err != nil {
				fmt.Printf("Warning: Failed to update config: %v\n", err)
			}
		}

		return nil
	},
}

var projectsDeleteCmd = &cobra.Command{
	Use:   "delete [PROJECT_SLUG]",
	Short: "Delete a project",
	Long:  `Delete a project and all its secrets. This action cannot be undone.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		projectSlug := args[0]
		confirm, _ := cmd.Flags().GetBool("confirm")

		if !confirm {
			return fmt.Errorf("this action is destructive. Use --confirm flag to proceed")
		}

		client := api.NewClient(config.APIURL, cfg.APIToken)

		// Get project by slug first
		projects, err := client.GetProjects()
		if err != nil {
			return fmt.Errorf("failed to get projects: %w", err)
		}

		var projectID string
		for _, proj := range projects {
			if proj.Slug == projectSlug {
				projectID = proj.ID
				break
			}
		}

		if projectID == "" {
			return fmt.Errorf("project not found or you don't have access to it")
		}

		if err := client.DeleteProject(projectID); err != nil {
			return fmt.Errorf("failed to delete project: %w", err)
		}

		fmt.Println("✓ Project deleted successfully")

		// Clear from config if it was active
		if cfg.ActiveProjectSlug == projectSlug {
			cfg.ActiveProjectSlug = ""
			cfg.ActiveProjectName = ""
			if err := cfg.Save(cfgFile); err != nil {
				fmt.Printf("Warning: Failed to update config: %v\n", err)
			}
		}

		return nil
	},
}

func init() {
	projectsCmd.AddCommand(projectsListCmd)
	projectsCmd.AddCommand(projectsCreateCmd)
	projectsCmd.AddCommand(projectsSwitchCmd)
	projectsCmd.AddCommand(projectsUpdateCmd)
	projectsCmd.AddCommand(projectsDeleteCmd)

	projectsCreateCmd.Flags().StringP("description", "d", "", "Project description")
	projectsUpdateCmd.Flags().StringP("name", "n", "", "New project name")
	projectsUpdateCmd.Flags().StringP("slug", "s", "", "New project slug")
	projectsUpdateCmd.Flags().StringP("description", "d", "", "New project description")
	projectsDeleteCmd.Flags().Bool("confirm", false, "Confirm destructive action")
}
