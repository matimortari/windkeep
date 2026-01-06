package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/spf13/cobra"
)

var (
	pushEnv string
)

var pushCmd = &cobra.Command{
	Use:   "push [INPUT_FILE]",
	Short: "Push secrets from local file to WindKeep",
	Long:  `Push secrets from a .env file to the active project.`,
	Args:  cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		inputFile := ".env"
		if len(args) > 0 {
			inputFile = args[0]
		}

		client := api.NewClient(config.APIURL, cfg.APIToken)
		projectID, err := getActiveProjectID(client)
		if err != nil {
			return err
		}

		data, err := os.ReadFile(inputFile)
		if err != nil {
			return fmt.Errorf("failed to read file: %w", err)
		}

		var secrets []api.Secret
		env := config.ParseEnvironment(pushEnv)
		scanner := bufio.NewScanner(strings.NewReader(string(data)))
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}

			parts := strings.SplitN(line, "=", 2)
			if len(parts) != 2 {
				continue
			}

			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])

			secrets = append(secrets, api.Secret{
				Key: key,
				Values: []api.SecretValue{
					{
						Environment: env,
						Value:       value,
					},
				},
			})
			if err := scanner.Err(); err != nil {
				return fmt.Errorf("failed to parse .env file: %w", err)
			}
		}

		successCount := 0
		for _, secret := range secrets {
			values := make([]api.SecretValueInput, len(secret.Values))
			for i, v := range secret.Values {
				values[i] = api.SecretValueInput{
					Environment: v.Environment,
					Value:       v.Value,
				}
			}

			req := api.CreateSecretRequest{
				Key:         secret.Key,
				Description: secret.Description,
				ProjectID:   projectID,
				Values:      values,
			}

			_, err := client.CreateSecret(projectID, req)
			if err != nil {
				fmt.Printf("Warning: failed to push secret '%s': %v\n", secret.Key, err)
				continue
			}
			successCount++
		}

		fmt.Printf("Successfully pushed %d/%d secret(s) to %s environment\n", successCount, len(secrets), pushEnv)
		return nil
	},
}

func init() {
	pushCmd.Flags().StringVarP(&pushEnv, "env", "e", "development", "Environment to push to (dev/development, staging, prod/production)")
}
