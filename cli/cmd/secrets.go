package cmd

import (
	"fmt"
	"strings"
	"time"

	"github.com/manifoldco/promptui"
	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/ui"
	"github.com/spf13/cobra"
)

func formatRelativeTime(t time.Time) string {
	d := time.Since(t)
	switch {
	case d < time.Minute:
		return "just now"
	case d < time.Hour:
		return fmt.Sprintf("%dm ago", int(d.Minutes()))
	case d < 24*time.Hour:
		return fmt.Sprintf("%dh ago", int(d.Hours()))
	case d < 7*24*time.Hour:
		return fmt.Sprintf("%dd ago", int(d.Hours()/24))
	default:
		return t.Format("Jan 2, 2006")
	}
}

var secretsCmd = &cobra.Command{
	Use:     "secrets",
	Aliases: []string{"secret"},
	Short:   "Manage secrets",
	Long:    `Create, list, update, and delete secrets in your projects.`,
}

var secretsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List secrets in the active project",
	Long:  `List all secrets in your active project.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newClient()
		project, err := resolveProject(client, "")
		if err != nil {
			return err
		}

		printProjectContext()

		secrets, err := client.GetSecrets(project.ID)
		if err != nil {
			return fmt.Errorf("failed to get secrets: %w", err)
		}

		if len(secrets) == 0 {
			ui.PrintWarning("No secrets found.")
			ui.PrintInfo("Create one with: %s", ui.Highlight("windkeep secrets create"))
			return nil
		}

		table := ui.CreateTable([]string{"Key", "Environments", "Description", "Updated"})
		for _, secret := range secrets {
			var envs []string
			for _, val := range secret.Values {
				envs = append(envs, string(val.Environment))
			}
			desc := ""
			if secret.Description != nil {
				desc = *secret.Description
			}
			table.Append([]string{
				secret.Key,
				strings.Join(envs, ", "),
				desc,
				formatRelativeTime(secret.UpdatedAt),
			})
		}
		table.Render()
		fmt.Printf("\n%d secret(s) total\n", len(secrets))
		return nil
	},
}

var secretsGetCmd = &cobra.Command{
	Use:   "get [KEY]",
	Short: "Get a secret's values",
	Long:  `Retrieve all environment values for a specific secret.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newClient()
		project, err := resolveProject(client, "")
		if err != nil {
			return err
		}

		found, err := getSecretByKey(client, project.ID, args[0])
		if err != nil {
			return err
		}

		ui.CyanBold.Printf("Key:     %s\n", found.Key)
		if found.Description != nil && *found.Description != "" {
			fmt.Printf("Desc:    %s\n", *found.Description)
		}
		fmt.Printf("Updated: %s\n\n", formatRelativeTime(found.UpdatedAt))

		if len(found.Values) == 0 {
			ui.PrintWarning("No values set for any environment")
			return nil
		}

		table := ui.CreateTable([]string{"Environment", "Value"})
		for _, val := range found.Values {
			table.Append([]string{string(val.Environment), val.Value})
		}
		table.Render()
		return nil
	},
}

var secretsCreateCmd = &cobra.Command{
	Use:   "create [KEY]",
	Short: "Create a new secret",
	Long: `Create a new secret in your active project.

Examples:
  windkeep secrets create DATABASE_URL --dev "postgres://localhost/dev" --prod "postgres://prod/app"
  windkeep secrets create API_KEY -d "Third-party API key" --prod "sk_live_xyz"
  windkeep secrets create PLACEHOLDER -d "To be filled later"`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		description, _ := cmd.Flags().GetString("description")
		dev, _ := cmd.Flags().GetString("dev")
		staging, _ := cmd.Flags().GetString("staging")
		prod, _ := cmd.Flags().GetString("prod")

		client := newClient()
		project, err := resolveProject(client, "")
		if err != nil {
			return err
		}

		req := api.CreateSecretRequest{
			Key:       args[0],
			ProjectID: project.ID,
			Values:    buildSecretValues(dev, staging, prod),
		}
		if description != "" {
			req.Description = &description
		}

		secret, err := client.CreateSecret(project.ID, req)
		if err != nil {
			return fmt.Errorf("failed to create secret: %w", err)
		}

		ui.PrintSuccess("Created '%s'", ui.Highlight(secret.Key))
		for _, val := range secret.Values {
			ui.PrintInfo("Set value for %s", string(val.Environment))
		}
		return nil
	},
}

var secretsSetCmd = &cobra.Command{
	Use:   "set [KEY]",
	Short: "Update a secret's values",
	Long: `Update environment values for an existing secret.
Only the environments you specify are changed; all others retain their current values.

Examples:
  windkeep secrets set API_KEY --prod "sk_live_new"
  windkeep secrets set DATABASE_URL --staging "postgres://staging/app" --prod "postgres://prod/app"
  windkeep secrets set JWT_SECRET -d "Updated signing secret" --dev "new_dev_secret"`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		key := args[0]
		description, _ := cmd.Flags().GetString("description")
		dev, _ := cmd.Flags().GetString("dev")
		staging, _ := cmd.Flags().GetString("staging")
		prod, _ := cmd.Flags().GetString("prod")

		values := buildSecretValues(dev, staging, prod)
		if len(values) == 0 && description == "" {
			return fmt.Errorf("nothing to update — provide at least one of: --dev, --staging, --prod, or -d/--description")
		}

		client := newClient()
		project, err := resolveProject(client, "")
		if err != nil {
			return err
		}

		found, err := getSecretByKey(client, project.ID, key)
		if err != nil {
			return fmt.Errorf("%w. Use 'windkeep secrets create' to create it", err)
		}

		req := api.UpdateSecretRequest{
			Values: mergeSecretValues(found.Values, values),
		}
		if description != "" {
			req.Description = &description
		}

		if _, err := client.UpdateSecret(project.ID, found.ID, req); err != nil {
			return fmt.Errorf("failed to update secret: %w", err)
		}

		ui.PrintSuccess("Updated '%s'", ui.Highlight(key))
		if description != "" {
			ui.PrintInfo("Updated description")
		}
		for _, val := range values {
			ui.PrintInfo("Updated value for %s", string(val.Environment))
		}
		return nil
	},
}

var secretsHistoryCmd = &cobra.Command{
	Use:   "history [KEY]",
	Short: "Show change history for a secret",
	Long: `Show the full change history for a secret across all environments.

Examples:
  windkeep secrets history DATABASE_URL
  windkeep secrets history API_KEY -e prod`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		key := args[0]
		envFilter, _ := cmd.Flags().GetString("env")

		client := newClient()
		project, err := resolveProject(client, "")
		if err != nil {
			return err
		}

		printProjectContext()

		found, err := getSecretByKey(client, project.ID, key)
		if err != nil {
			return err
		}

		history, err := client.GetSecretHistory(project.ID, found.ID)
		if err != nil {
			return fmt.Errorf("failed to get history: %w", err)
		}

		if len(history) == 0 {
			ui.PrintInfo("No history found for '%s'", key)
			return nil
		}

		ui.CyanBold.Printf("History for: %s\n\n", key)

		var filterEnv api.Environment
		if envFilter != "" {
			filterEnv, err = api.ParseEnvironment(envFilter)
			if err != nil {
				return err
			}
		}

		for _, envHistory := range history {
			if envFilter != "" && envHistory.Environment != filterEnv {
				continue
			}

			ui.CyanBold.Printf("[%s]  current: %s\n", envHistory.Environment, envHistory.CurrentValue)

			if len(envHistory.History) == 0 {
				fmt.Println("  No previous changes")
			} else {
				table := ui.CreateTable([]string{"Value", "Changed By", "When"})
				for _, entry := range envHistory.History {
					table.Append([]string{
						entry.Value,
						entry.ChangedBy.Name,
						formatRelativeTime(entry.ChangedAt),
					})
				}
				table.Render()
			}
			fmt.Println()
		}

		return nil
	},
}

var secretsDeleteCmd = &cobra.Command{
	Use:   "delete [KEY]",
	Short: "Delete a secret",
	Long:  `Delete a secret and all its values. This action cannot be undone.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		key := args[0]
		confirm, _ := cmd.Flags().GetBool("confirm")

		if !confirm {
			prompt := promptui.Prompt{
				Label:     fmt.Sprintf("Delete '%s' and all its values", key),
				IsConfirm: true,
			}
			if _, err := prompt.Run(); err != nil {
				ui.PrintInfo("Deletion cancelled")
				return nil
			}
		}

		client := newClient()
		project, err := resolveProject(client, "")
		if err != nil {
			return err
		}

		found, err := getSecretByKey(client, project.ID, key)
		if err != nil {
			return err
		}

		if err := client.DeleteSecret(project.ID, found.ID); err != nil {
			return fmt.Errorf("failed to delete secret: %w", err)
		}

		ui.PrintSuccess("Deleted '%s'", ui.Highlight(key))
		return nil
	},
}

func init() {
	secretsCmd.AddCommand(secretsListCmd)
	secretsCmd.AddCommand(secretsGetCmd)
	secretsCmd.AddCommand(secretsCreateCmd)
	secretsCmd.AddCommand(secretsSetCmd)
	secretsCmd.AddCommand(secretsHistoryCmd)
	secretsCmd.AddCommand(secretsDeleteCmd)

	secretsCreateCmd.Flags().StringP("description", "d", "", "Secret description")
	secretsCreateCmd.Flags().String("dev", "", "Value for DEVELOPMENT environment")
	secretsCreateCmd.Flags().String("staging", "", "Value for STAGING environment")
	secretsCreateCmd.Flags().String("prod", "", "Value for PRODUCTION environment")

	secretsSetCmd.Flags().StringP("description", "d", "", "Update the secret's description")
	secretsSetCmd.Flags().String("dev", "", "Value for DEVELOPMENT environment")
	secretsSetCmd.Flags().String("staging", "", "Value for STAGING environment")
	secretsSetCmd.Flags().String("prod", "", "Value for PRODUCTION environment")

	secretsHistoryCmd.Flags().StringP("env", "e", "", "Filter by environment (dev/staging/prod)")

	secretsDeleteCmd.Flags().Bool("confirm", false, "Skip confirmation prompt")
}
