package cmd

import (
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/spf13/cobra"
)

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
			fmt.Println("No organizations found. Create one with 'windkeep orgs create'")
			return nil
		}

		w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
		fmt.Fprintln(w, "ID\tNAME\tROLE\tACTIVE")
		for _, membership := range user.OrgMemberships {
			active := ""
			if membership.IsActive {
				active = "✓"
			}
			fmt.Fprintf(w, "%s\t%s\t%s\t%s\n",
				membership.OrgID,
				membership.Org.Name,
				membership.Role,
				active)
		}
		w.Flush()

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

		fmt.Printf("✓ Organization '%s' created successfully (ID: %s)\n", org.Name, org.ID)

		// Update config to set as active org
		cfg.ActiveOrgID = org.ID
		cfg.ActiveOrgName = org.Name
		if err := cfg.Save(cfgFile); err != nil {
			fmt.Printf("Warning: Failed to save active organization to config: %v\n", err)
		} else {
			fmt.Printf("✓ Set '%s' as active organization\n", org.Name)
		}

		return nil
	},
}

var orgsSwitchCmd = &cobra.Command{
	Use:   "switch [ORG_ID]",
	Short: "Switch to a different organization",
	Long:  `Set the active organization for future commands.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		orgID := args[0]
		client := api.NewClient(config.APIURL, cfg.APIToken)

		org, err := client.GetOrganization(orgID)
		if err != nil {
			return fmt.Errorf("failed to get organization: %w", err)
		}

		cfg.ActiveOrgID = org.ID
		cfg.ActiveOrgName = org.Name
		// Clear active project when switching orgs
		cfg.ActiveProjectID = ""
		cfg.ActiveProjectName = ""

		if err := cfg.Save(cfgFile); err != nil {
			return fmt.Errorf("failed to save config: %w", err)
		}

		fmt.Printf("✓ Switched to organization '%s'\n", org.Name)
		return nil
	},
}

var orgsUpdateCmd = &cobra.Command{
	Use:   "update [ORG_ID] [NAME]",
	Short: "Update an organization's name",
	Long:  `Update the name of an organization.`,
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		orgID := args[0]
		name := args[1]
		client := api.NewClient(config.APIURL, cfg.APIToken)

		org, err := client.UpdateOrganization(orgID, api.UpdateOrgRequest{
			Name: name,
		})
		if err != nil {
			return fmt.Errorf("failed to update organization: %w", err)
		}

		fmt.Printf("✓ Organization updated to '%s'\n", org.Name)

		// Update config if it's the active org
		if cfg.ActiveOrgID == orgID {
			cfg.ActiveOrgName = org.Name
			if err := cfg.Save(cfgFile); err != nil {
				fmt.Printf("Warning: Failed to update config: %v\n", err)
			}
		}

		return nil
	},
}

func init() {
	orgsCmd.AddCommand(orgsListCmd)
	orgsCmd.AddCommand(orgsCreateCmd)
	orgsCmd.AddCommand(orgsSwitchCmd)
	orgsCmd.AddCommand(orgsUpdateCmd)
}
