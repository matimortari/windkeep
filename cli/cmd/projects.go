package cmd

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/manifoldco/promptui"
	"github.com/matimortari/windkeep/cli/api"
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
	Short: "List projects in the active organization",
	Long:  `List all projects in your active organization.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newClient()

		activeOrg, err := getActiveOrg(client)
		if err != nil {
			return err
		}
		if activeOrg == nil {
			return fmt.Errorf("no active organization. Use 'windkeep orgs switch' first")
		}

		projects, err := projectsInOrg(client, activeOrg.OrgID)
		if err != nil {
			return err
		}

		if len(projects) == 0 {
			ui.PrintWarning("No projects found in '%s'.", activeOrg.Org.Name)
			ui.PrintInfo("Create one with: %s", ui.Highlight("windkeep projects create"))
			return nil
		}

		table := ui.CreateTable([]string{"ID", "Name", "Slug", "Secrets"})
		for _, proj := range projects {
			secretCount := 0
			if proj.Count != nil {
				secretCount = proj.Count.Secrets
			}
			table.Append([]string{
				proj.ID,
				proj.Name,
				proj.Slug,
				fmt.Sprintf("%d", secretCount),
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
		client := newClient()

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
		if err := cfg.Save(); err != nil {
			ui.PrintWarning("Failed to save active project to config: %v", err)
		}

		return nil
	},
}

var projectsSwitchCmd = &cobra.Command{
	Use:   "switch [PROJECT_SLUG]",
	Short: "Switch to a different project",
	Long:  `Set the active project for future commands. Only shows projects from the active organization.`,
	Args:  cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newClient()

		// Require an active org — projects are org-scoped
		activeOrg, err := getActiveOrg(client)
		if err != nil {
			return err
		}
		if activeOrg == nil {
			return fmt.Errorf("no active organization. Use 'windkeep orgs switch' first")
		}

		projects, err := projectsInOrg(client, activeOrg.OrgID)
		if err != nil {
			return err
		}

		if len(projects) == 0 {
			ui.PrintWarning("No projects found in '%s'.", activeOrg.Org.Name)
			ui.PrintInfo("Create one with: %s", ui.Highlight("windkeep projects create"))
			return nil
		}

		var selectedProject *api.Project

		if len(args) == 0 {
			templates := &promptui.SelectTemplates{
				Label:    "{{ . }}?",
				Active:   "▸ {{ .Name | cyan }} ({{ .Slug | yellow }})",
				Inactive: "  {{ .Name | white }} ({{ .Slug | faint }})",
				Selected: "{{ .Name | green | bold }}",
			}

			prompt := promptui.Select{
				Label:     fmt.Sprintf("Select Project (%s)", activeOrg.Org.Name),
				Items:     projects,
				Templates: templates,
			}

			idx, _, err := prompt.Run()
			if err != nil {
				return fmt.Errorf("selection cancelled")
			}
			selectedProject = &projects[idx]
		} else {
			slug := args[0]
			for i := range projects {
				if projects[i].Slug == slug {
					selectedProject = &projects[i]
					break
				}
			}
			if selectedProject == nil {
				return fmt.Errorf("project '%s' not found in organization '%s'", slug, activeOrg.Org.Name)
			}
		}

		cfg.ActiveProjectID = selectedProject.ID
		cfg.ActiveProjectSlug = selectedProject.Slug
		cfg.ActiveProjectName = selectedProject.Name

		if err := cfg.Save(); err != nil {
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

		client := newClient()
		existing, err := findProjectBySlug(client, projectSlug)
		if err != nil {
			return err
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

		project, err := client.UpdateProject(existing.ID, req)
		if err != nil {
			return fmt.Errorf("failed to update project: %w", err)
		}

		ui.PrintSuccess("Project '%s' updated", ui.Highlight(project.Name))

		if cfg.ActiveProjectSlug == projectSlug {
			cfg.ActiveProjectID = project.ID
			cfg.ActiveProjectSlug = project.Slug
			cfg.ActiveProjectName = project.Name
			if err := cfg.Save(); err != nil {
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

		client := newClient()
		existing, err := findProjectBySlug(client, projectSlug)
		if err != nil {
			return err
		}

		if err := client.DeleteProject(existing.ID); err != nil {
			return fmt.Errorf("failed to delete project: %w", err)
		}

		ui.PrintSuccess("Project deleted")

		if cfg.ActiveProjectSlug == projectSlug {
			cfg.ActiveProjectID = ""
			cfg.ActiveProjectSlug = ""
			cfg.ActiveProjectName = ""
			if err := cfg.Save(); err != nil {
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
