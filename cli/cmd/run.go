package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/spf13/cobra"
)

var runCmd = &cobra.Command{
	Use:   "run [command] [args...]",
	Short: "Run a command with injected secrets",
	Long: `Run a command with environment variables injected from your active project's secrets.
	
This command fetches all secrets from the specified environment and injects them
as environment variables when running your command. Perfect for running your app
with secrets without needing a .env file.`,
	Args:               cobra.MinimumNArgs(1),
	DisableFlagParsing: false,
	RunE: func(cmd *cobra.Command, args []string) error {
		environment, _ := cmd.Flags().GetString("env")
		projectSlug, _ := cmd.Flags().GetString("project")

		// Validate environment
		var env api.Environment
		switch strings.ToUpper(environment) {
		case "DEV", "DEVELOPMENT":
			env = api.EnvDevelopment
		case "STAGING":
			env = api.EnvStaging
		case "PROD", "PRODUCTION":
			env = api.EnvProduction
		default:
			return fmt.Errorf("invalid environment: %s (use dev, staging, or prod)", environment)
		}

		client := api.NewClient(config.APIURL, cfg.APIToken)

		// Determine which project to use (default to active project, flag overrides)
		var projectID string
		var projectName string
		var err error

		if projectSlug != "" {
			projects, err := client.GetProjects()
			if err != nil {
				return fmt.Errorf("failed to get projects: %w", err)
			}

			found := false
			for _, proj := range projects {
				if proj.Slug == projectSlug {
					projectID = proj.ID
					projectName = proj.Name
					found = true
					break
				}
			}
			if !found {
				return fmt.Errorf("project '%s' not found", projectSlug)
			}
		} else {
			projectID, err = getActiveProjectID(client)
			if err != nil {
				return err
			}
			projectName = cfg.ActiveProjectSlug
		}

		secrets, err := client.GetSecrets(projectID)
		if err != nil {
			return fmt.Errorf("failed to get secrets: %w", err)
		}
		if len(secrets) == 0 {
			fmt.Printf("No secrets found in project '%s'\n", projectName)
		}

		// Build environment variables map
		envVars := make(map[string]string)
		secretsInjected := 0
		for _, secret := range secrets {
			for _, val := range secret.Values {
				if val.Environment == env {
					envVars[secret.Key] = val.Value
					secretsInjected++
					break
				}
			}
		}

		if secretsInjected == 0 {
			fmt.Printf("No secrets found for environment '%s'\n", env)
		} else {
			verbose, _ := cmd.Flags().GetBool("verbose")
			if verbose {
				fmt.Printf("✓ Injecting %d secret(s) from environment '%s'\n", secretsInjected, env)
				for key := range envVars {
					fmt.Printf("  • %s\n", key)
				}
				fmt.Println()
			}
		}

		// Prepare command
		commandName := args[0]
		commandArgs := []string{}
		if len(args) > 1 {
			commandArgs = args[1:]
		}

		// Copy current environment and add secrets
		execCmd := exec.Command(commandName, commandArgs...)
		execCmd.Env = os.Environ()
		for key, value := range envVars {
			execCmd.Env = append(execCmd.Env, fmt.Sprintf("%s=%s", key, value))
		}

		execCmd.Stdin = os.Stdin
		execCmd.Stdout = os.Stdout
		execCmd.Stderr = os.Stderr

		if err := execCmd.Run(); err != nil {
			if exitErr, ok := err.(*exec.ExitError); ok {
				os.Exit(exitErr.ExitCode())
			}
			return fmt.Errorf("failed to run command: %w", err)
		}

		return nil
	},
}

func init() {
	runCmd.Flags().StringP("env", "e", "development", "Environment to use (dev/development, staging, prod/production)")
	runCmd.Flags().StringP("project", "p", "", "Project slug to use (overrides active project)")
	runCmd.Flags().BoolP("verbose", "v", false, "Show which secrets are being injected")
}
