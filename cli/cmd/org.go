package cmd

import (
	"fmt"

	"github.com/manifoldco/promptui"
	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/matimortari/windkeep/cli/ui"
	"github.com/spf13/cobra"
)

func getActiveOrg(client *api.Client) (*api.OrgMembership, error) {
	user, err := client.GetUser()
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	for _, membership := range user.OrgMemberships {
		if membership.IsActive {
			return &membership, nil
		}
	}

	return nil, nil
}

var orgsCmd = &cobra.Command{
	Use:     "orgs",
	Aliases: []string{"organizations", "org"},
	Short:   "Manage organizations",
	Long:    `List, create, and switch between organizations.`,
}

var orgsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List your organizations",
	Long:  `List all organizations you are a member of.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := api.NewClient(config.APIURL, cfg.APIToken)

		user, err := client.GetUser()
		if err != nil {
			return fmt.Errorf("failed to get user: %w", err)
		}

		if len(user.OrgMemberships) == 0 {
			ui.PrintWarning("No organizations found.")
			ui.PrintInfo("Create one with: %s", ui.Highlight("windkeep orgs create"))
			return nil
		}

		table := ui.CreateTable([]string{"ID", "Name", "Role", "Active"})
		for _, membership := range user.OrgMemberships {
			active := ""
			if membership.IsActive {
				active = ui.Success("✓")
			}
			table.Append([]string{
				membership.OrgID,
				membership.Org.Name,
				string(membership.Role),
				active,
			})
		}
		table.Render()

		return nil
	},
}

var orgsCreateCmd = &cobra.Command{
	Use:   "create [NAME]",
	Short: "Create a new organization",
	Long:  `Create a new organization. You will be set as the owner.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		name := args[0]
		client := api.NewClient(config.APIURL, cfg.APIToken)

		org, err := client.CreateOrganization(api.CreateOrgRequest{
			Name: name,
		})
		if err != nil {
			return fmt.Errorf("failed to create organization: %w", err)
		}

		ui.PrintSuccess("Organization '%s' created (ID: %s)", ui.Highlight(org.Name), ui.Info(org.ID))
		ui.PrintSuccess("Set '%s' as active organization", org.Name)

		return nil
	},
}

var orgsSwitchCmd = &cobra.Command{
	Use:   "switch [ORG_ID]",
	Short: "Switch to a different organization",
	Long:  `Set the active organization for future commands. If no ID is provided, shows an interactive selector.`,
	Args:  cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client := api.NewClient(config.APIURL, cfg.APIToken)

		user, err := client.GetUser()
		if err != nil {
			return fmt.Errorf("failed to get user: %w", err)
		}

		if len(user.OrgMemberships) == 0 {
			ui.PrintWarning("No organizations found.")
			return nil
		}

		var orgID string

		// Interactive mode if no arg provided
		if len(args) == 0 {
			templates := &promptui.SelectTemplates{
				Label:    "{{ . }}?",
				Active:   "▸ {{ .Org.Name | cyan }} ({{ .Role | yellow }})",
				Inactive: "  {{ .Org.Name | white }} ({{ .Role | faint }})",
				Selected: "{{ .Org.Name | green | bold }}",
			}

			prompt := promptui.Select{
				Label:     "Select Organization",
				Items:     user.OrgMemberships,
				Templates: templates,
			}

			idx, _, err := prompt.Run()
			if err != nil {
				return fmt.Errorf("selection cancelled")
			}
			orgID = user.OrgMemberships[idx].OrgID
		} else {
			orgID = args[0]

			// Verify user has access
			var found bool
			for _, membership := range user.OrgMemberships {
				if membership.OrgID == orgID {
					found = true
					break
				}
			}
			if !found {
				return fmt.Errorf("organization not found or you are not a member")
			}
		}

		org, err := client.GetOrganization(orgID)
		if err != nil {
			return fmt.Errorf("failed to switch organization: %w", err)
		}

		// Clear active project since switching orgs
		cfg.ActiveProjectSlug = ""
		cfg.ActiveProjectName = ""
		if err := cfg.Save(cfgFile); err != nil {
			ui.PrintWarning("Failed to clear active project: %v", err)
		}

		ui.PrintSuccess("Switched to organization '%s'", ui.Highlight(org.Name))
		return nil
	},
}

var orgsUpdateCmd = &cobra.Command{
	Use:   "update [NAME]",
	Short: "Update the active organization's name",
	Long:  `Update the name of the active organization.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		name := args[0]
		client := api.NewClient(config.APIURL, cfg.APIToken)

		activeOrg, err := getActiveOrg(client)
		if err != nil {
			return err
		}
		if activeOrg == nil {
			return fmt.Errorf("no active organization. Use 'windkeep orgs switch' first")
		}

		org, err := client.UpdateOrganization(activeOrg.OrgID, api.UpdateOrgRequest{
			Name: name,
		})
		if err != nil {
			return fmt.Errorf("failed to update organization: %w", err)
		}

		ui.PrintSuccess("Organization updated to '%s'", ui.Highlight(org.Name))
		return nil
	},
}

func init() {
	orgsCmd.AddCommand(orgsListCmd)
	orgsCmd.AddCommand(orgsCreateCmd)
	orgsCmd.AddCommand(orgsSwitchCmd)
	orgsCmd.AddCommand(orgsUpdateCmd)
}
