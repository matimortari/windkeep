package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/spf13/cobra"
)

var (
	pullEnv string
)

var pullCmd = &cobra.Command{
	Use:   "pull [OUTPUT_FILE]",
	Short: "Pull secrets from WindKeep to local file",
	Long:  `Pull secrets from the active project and save to a .env file.`,
	Args:  cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		outputFile := ".env"
		if len(args) > 0 {
			outputFile = args[0]
		}

		client := api.NewClient(config.APIURL, cfg.APIToken)
		projectID, err := getActiveProjectID(client)
		if err != nil {
			return err
		}

		secrets, err := client.GetSecrets(projectID)
		if err != nil {
			return fmt.Errorf("failed to get secrets: %w", err)
		}

		var data []byte
		env := config.ParseEnvironment(pullEnv)
		var lines []string
		for _, secret := range secrets {
			for _, val := range secret.Values {
				if val.Environment == env {
					lines = append(lines, fmt.Sprintf("%s=%s", secret.Key, val.Value))
					break
				}
			}
		}
		data = []byte(strings.Join(lines, "\n"))
		if len(data) > 0 {
			data = append(data, '\n')
		}

		err = os.WriteFile(outputFile, data, 0600)
		if err != nil {
			return fmt.Errorf("failed to write file: %w", err)
		}

		fmt.Printf("Pulled %s secrets to %s\n", pullEnv, outputFile)
		return nil
	},
}

func init() {
	pullCmd.Flags().StringVarP(&pullEnv, "env", "e", "development", "Environment to pull (dev/development, staging, prod/production)")
}
