package cmd

import (
	"fmt"
	"os"
	"strings"
	"text/tabwriter"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/spf13/cobra"
)

var secretsCmd = &cobra.Command{
	Use:     "secrets",
	Aliases: []string{"secret"},
	Short:   "Manage secrets",
	Long:    `Create, list, update, and delete secrets in your projects.`,
}

var secretsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List secrets in active project",
	Long:  `List all secrets in your active project.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		if cfg.ActiveProjectID == "" {
			return fmt.Errorf("no active project. Use 'windkeep projects switch' first")
		}

		client := api.NewClient(config.APIURL, cfg.APIToken)

		secrets, err := client.GetSecrets(cfg.ActiveProjectID)
		if err != nil {
			return fmt.Errorf("failed to get secrets: %w", err)
		}

		if len(secrets) == 0 {
			fmt.Println("No secrets found. Create one with 'windkeep secrets create'")
			return nil
		}

		w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
		fmt.Fprintln(w, "KEY\tENVIRONMENTS\tDESCRIPTION")
		for _, secret := range secrets {
			envs := []string{}
			for _, val := range secret.Values {
				envs = append(envs, string(val.Environment))
			}
			desc := ""
			if secret.Description != nil {
				desc = *secret.Description
			}
			fmt.Fprintf(w, "%s\t%s\t%s\n",
				secret.Key,
				strings.Join(envs, ", "),
				desc)
		}
		w.Flush()

		return nil
	},
}

var secretsGetCmd = &cobra.Command{
	Use:   "get [KEY]",
	Short: "Get a secret's values",
	Long:  `Retrieve all environment values for a specific secret.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		if cfg.ActiveProjectID == "" {
			return fmt.Errorf("no active project. Use 'windkeep projects switch' first")
		}

		key := args[0]
		client := api.NewClient(config.APIURL, cfg.APIToken)

		secrets, err := client.GetSecrets(cfg.ActiveProjectID)
		if err != nil {
			return fmt.Errorf("failed to get secrets: %w", err)
		}

		var found *api.Secret
		for _, s := range secrets {
			if s.Key == key {
				found = &s
				break
			}
		}

		if found == nil {
			return fmt.Errorf("secret '%s' not found", key)
		}

		fmt.Printf("Key: %s\n", found.Key)
		if found.Description != nil {
			fmt.Printf("Description: %s\n", *found.Description)
		}
		fmt.Println("\nValues:")
		w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
		fmt.Fprintln(w, "ENVIRONMENT\tVALUE")
		for _, val := range found.Values {
			fmt.Fprintf(w, "%s\t%s\n", val.Environment, val.Value)
		}
		w.Flush()

		return nil
	},
}

var secretsCreateCmd = &cobra.Command{
	Use:   "create [KEY]",
	Short: "Create a new secret",
	Long:  `Create a new secret key in your active project. Use --env flags to set values for specific environments.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		if cfg.ActiveProjectID == "" {
			return fmt.Errorf("no active project. Use 'windkeep projects switch' first")
		}

		key := args[0]
		description, _ := cmd.Flags().GetString("description")
		dev, _ := cmd.Flags().GetString("dev")
		staging, _ := cmd.Flags().GetString("staging")
		prod, _ := cmd.Flags().GetString("prod")

		client := api.NewClient(config.APIURL, cfg.APIToken)

		req := api.CreateSecretRequest{
			Key:       key,
			ProjectID: cfg.ActiveProjectID,
		}

		if description != "" {
			req.Description = &description
		}

		// Add environment values if provided
		values := []api.SecretValueInput{}
		if dev != "" {
			values = append(values, api.SecretValueInput{
				Environment: api.EnvDevelopment,
				Value:       dev,
			})
		}
		if staging != "" {
			values = append(values, api.SecretValueInput{
				Environment: api.EnvStaging,
				Value:       staging,
			})
		}
		if prod != "" {
			values = append(values, api.SecretValueInput{
				Environment: api.EnvProduction,
				Value:       prod,
			})
		}
		req.Values = values

		secret, err := client.CreateSecret(cfg.ActiveProjectID, req)
		if err != nil {
			return fmt.Errorf("failed to create secret: %w", err)
		}

		fmt.Printf("✓ Secret '%s' created successfully\n", secret.Key)
		return nil
	},
}

var secretsSetCmd = &cobra.Command{
	Use:   "set [KEY]",
	Short: "Set secret values",
	Long:  `Update values for a specific secret. Use --env flags to set values for specific environments.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		if cfg.ActiveProjectID == "" {
			return fmt.Errorf("no active project. Use 'windkeep projects switch' first")
		}

		key := args[0]
		dev, _ := cmd.Flags().GetString("dev")
		staging, _ := cmd.Flags().GetString("staging")
		prod, _ := cmd.Flags().GetString("prod")

		if dev == "" && staging == "" && prod == "" {
			return fmt.Errorf("at least one environment value must be provided (--dev, --staging, or --prod)")
		}

		client := api.NewClient(config.APIURL, cfg.APIToken)

		// Find the secret first
		secrets, err := client.GetSecrets(cfg.ActiveProjectID)
		if err != nil {
			return fmt.Errorf("failed to get secrets: %w", err)
		}

		var secretID string
		for _, s := range secrets {
			if s.Key == key {
				secretID = s.ID
				break
			}
		}

		if secretID == "" {
			return fmt.Errorf("secret '%s' not found", key)
		}

		// Build values array
		values := []api.SecretValueInput{}
		if dev != "" {
			values = append(values, api.SecretValueInput{
				Environment: api.EnvDevelopment,
				Value:       dev,
			})
		}
		if staging != "" {
			values = append(values, api.SecretValueInput{
				Environment: api.EnvStaging,
				Value:       staging,
			})
		}
		if prod != "" {
			values = append(values, api.SecretValueInput{
				Environment: api.EnvProduction,
				Value:       prod,
			})
		}

		req := api.UpdateSecretRequest{
			Values: values,
		}

		if _, err := client.UpdateSecret(cfg.ActiveProjectID, secretID, req); err != nil {
			return fmt.Errorf("failed to update secret: %w", err)
		}

		fmt.Printf("✓ Secret '%s' updated successfully\n", key)
		return nil
	},
}

var secretsDeleteCmd = &cobra.Command{
	Use:   "delete [KEY]",
	Short: "Delete a secret",
	Long:  `Delete a secret and all its values. This action cannot be undone.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		if cfg.ActiveProjectID == "" {
			return fmt.Errorf("no active project. Use 'windkeep projects switch' first")
		}

		key := args[0]
		confirm, _ := cmd.Flags().GetBool("confirm")

		if !confirm {
			return fmt.Errorf("this action is destructive. Use --confirm flag to proceed")
		}

		client := api.NewClient(config.APIURL, cfg.APIToken)

		// Find the secret first
		secrets, err := client.GetSecrets(cfg.ActiveProjectID)
		if err != nil {
			return fmt.Errorf("failed to get secrets: %w", err)
		}

		var secretID string
		for _, s := range secrets {
			if s.Key == key {
				secretID = s.ID
				break
			}
		}

		if secretID == "" {
			return fmt.Errorf("secret '%s' not found", key)
		}

		if err := client.DeleteSecret(cfg.ActiveProjectID, secretID); err != nil {
			return fmt.Errorf("failed to delete secret: %w", err)
		}

		fmt.Printf("✓ Secret '%s' deleted successfully\n", key)
		return nil
	},
}

func init() {
	secretsCmd.AddCommand(secretsListCmd)
	secretsCmd.AddCommand(secretsGetCmd)
	secretsCmd.AddCommand(secretsCreateCmd)
	secretsCmd.AddCommand(secretsSetCmd)
	secretsCmd.AddCommand(secretsDeleteCmd)

	secretsCreateCmd.Flags().StringP("description", "d", "", "Secret description")
	secretsCreateCmd.Flags().String("dev", "", "Value for DEVELOPMENT environment")
	secretsCreateCmd.Flags().String("staging", "", "Value for STAGING environment")
	secretsCreateCmd.Flags().String("prod", "", "Value for PRODUCTION environment")

	secretsSetCmd.Flags().String("dev", "", "Value for DEVELOPMENT environment")
	secretsSetCmd.Flags().String("staging", "", "Value for STAGING environment")
	secretsSetCmd.Flags().String("prod", "", "Value for PRODUCTION environment")

	secretsDeleteCmd.Flags().Bool("confirm", false, "Confirm destructive action")
}
