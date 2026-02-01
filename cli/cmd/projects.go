package cmd

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/manifoldco/promptui"
	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/matimortari/windkeep/cli/ui"
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
		client := api.NewClient(config.APIURL, cfg.APIToken)

		activeOrg, err := getActiveOrg(client)
		if err != nil {
			return err
		}
		if activeOrg == nil {
			return fmt.Errorf("no active organization. Use 'windkeep orgs switch' first")
		}

		projects, err := client.GetProjects()
		if err != nil {
			return fmt.Errorf("failed to get projects: %w", err)
		}

		// Filter projects by active organization
		var orgProjects []api.Project
		for _, proj := range projects {
			if proj.Org != nil && proj.Org.ID == activeOrg.OrgID {
				orgProjects = append(orgProjects, proj)
			}
		}

		if len(orgProjects) == 0 {
			ui.PrintWarning("No projects found in '%s'.", activeOrg.Org.Name)
			ui.PrintInfo("Create one with: %s", ui.Highlight("windkeep projects create"))
			return nil
		}

		table := ui.CreateTable([]string{"ID", "Name", "Slug", "Organization", "Secrets"})

		for _, proj := range orgProjects {
			orgName := "N/A"
			if proj.Org != nil {
				orgName = proj.Org.Name
			}
			secretsCount := fmt.Sprintf("%d", len(proj.Secrets))
			table.Append([]string{
				proj.ID,
				proj.Name,
				proj.Slug,
				orgName,
				secretsCount,
			})
		}
		table.Render()

		return nil
	},
}

var projectsCreateCmd = &cobra.Command{
	Use:   "create [NAME]",
	Short: "Create a new project",
	Long:  `Create a new project in your active organization. The slug will be auto-generated from the name.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client := api.NewClient(config.APIURL, cfg.APIToken)

		activeOrg, err := getActiveOrg(client)
		if err != nil {
			return err
		}
		if activeOrg == nil {
			return fmt.Errorf("no active organization. Use 'windkeep orgs switch' first")
		}

		name := args[0]
		description, _ := cmd.Flags().GetString("description")
		slug := generateSlug(name)

		req := api.CreateProjectRequest{
			Name:  name,
			Slug:  slug,
			OrgID: activeOrg.OrgID,
		}
		if description != "" {
			req.Description = &description
		}

		project, err := client.CreateProject(req)
		if err != nil {
			return fmt.Errorf("failed to create project: %w", err)
		}

		ui.PrintSuccess("Project '%s' created (slug: %s)", ui.Highlight(project.Name), ui.Info(project.Slug))

		cfg.ActiveProjectID = project.ID
		cfg.ActiveProjectSlug = project.Slug
		cfg.ActiveProjectName = project.Name
		if err := cfg.Save(cfgFile); err != nil {
			ui.PrintWarning("Failed to save active project to config: %v", err)
		}

		return nil
	},
}

var projectsSwitchCmd = &cobra.Command{
	Use:   "switch [PROJECT_SLUG]",
	Short: "Switch to a different project",
	Long:  `Set the active project for future commands. If no slug is provided, shows an interactive selector.`,
	Args:  cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client := api.NewClient(config.APIURL, cfg.APIToken)

		projects, err := client.GetProjects()
		if err != nil {
			return fmt.Errorf("failed to get projects: %w", err)
		}

		if len(projects) == 0 {
			ui.PrintWarning("No projects found.")
			ui.PrintInfo("Create one with: %s", ui.Highlight("windkeep projects create"))
			return nil
		}

		var selectedProject *api.Project

		// Interactive mode if no arg provided
		if len(args) == 0 {
			templates := &promptui.SelectTemplates{
				Label:    "{{ . }}?",
				Active:   "▸ {{ .Name | cyan }} ({{ .Slug | yellow }})",
				Inactive: "  {{ .Name | white }} ({{ .Slug | faint }})",
				Selected: "{{ .Name | green | bold }}",
			}

			prompt := promptui.Select{
				Label:     "Select Project",
				Items:     projects,
				Templates: templates,
			}

			idx, _, err := prompt.Run()
			if err != nil {
				return fmt.Errorf("selection cancelled")
			}
			selectedProject = &projects[idx]
		} else {
			projectSlug := args[0]
			for _, proj := range projects {
				if proj.Slug == projectSlug {
					selectedProject = &proj
					break
				}
			}

			if selectedProject == nil {
				return fmt.Errorf("project not found or you don't have access to it")
			}
		}

		cfg.ActiveProjectID = selectedProject.ID
		cfg.ActiveProjectSlug = selectedProject.Slug
		cfg.ActiveProjectName = selectedProject.Name

		if err := cfg.Save(cfgFile); err != nil {
			return fmt.Errorf("failed to save config: %w", err)
		}

		ui.PrintSuccess("Switched to project '%s' (slug: %s)", ui.Highlight(selectedProject.Name), ui.Info(selectedProject.Slug))
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

		ui.PrintSuccess("Project '%s' updated", ui.Highlight(project.Name))

		// Update config if it's the active project
		if cfg.ActiveProjectSlug == projectSlug {
			cfg.ActiveProjectID = project.ID
			cfg.ActiveProjectSlug = project.Slug
			cfg.ActiveProjectName = project.Name
			if err := cfg.Save(cfgFile); err != nil {
				ui.PrintWarning("Failed to update config: %v", err)
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
			prompt := promptui.Prompt{
				Label:     fmt.Sprintf("Delete project '%s' and all its secrets", projectSlug),
				IsConfirm: true,
			}
			_, err := prompt.Run()
			if err != nil {
				ui.PrintInfo("Deletion cancelled")
				return nil
			}
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

		ui.PrintSuccess("Project deleted")

		// Clear from config if it was active
		if cfg.ActiveProjectSlug == projectSlug {
			cfg.ActiveProjectID = ""
			cfg.ActiveProjectSlug = ""
			cfg.ActiveProjectName = ""
			if err := cfg.Save(cfgFile); err != nil {
				ui.PrintWarning("Failed to update config: %v", err)
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
