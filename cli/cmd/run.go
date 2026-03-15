package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/matimortari/windkeep/cli/ui"
	"github.com/spf13/cobra"
)

var runCmd = &cobra.Command{
	Use:   "run [command] [args...]",
	Short: "Run a command with injected secrets",
	Long: `Run a command with environment variables injected from your active project's secrets.

Fetches all secrets from the specified environment and injects them as environment
variables when running your command. No .env file needed.

Examples:
  windkeep run npm run dev
  windkeep run -e prod -- ./server
  windkeep run -e staging -p my-api -- go run main.go`,
	Args:               cobra.MinimumNArgs(1),
	DisableFlagParsing: false,
	RunE: func(cmd *cobra.Command, args []string) error {
		environment, _ := cmd.Flags().GetString("env")
		projectSlug, _ := cmd.Flags().GetString("project")
		verbose, _ := cmd.Flags().GetBool("verbose")

		// Validate and parse environment
		var env api.Environment
		switch strings.ToUpper(environment) {
		case "DEV", "DEVELOPMENT":
			env = api.EnvDevelopment
		case "STAGING":
			env = api.EnvStaging
		case "PROD", "PRODUCTION":
			env = api.EnvProduction
		default:
			return fmt.Errorf("invalid environment '%s' — use: dev, staging, or prod", environment)
		}

		client := api.NewClient(config.APIURL, cfg.APIToken)

		// Resolve project: flag overrides active project
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
			projectName = cfg.ActiveProjectName
			if projectName == "" {
				projectName = cfg.ActiveProjectSlug
			}
		}

		secrets, err := client.GetSecrets(projectID)
		if err != nil {
			return fmt.Errorf("failed to fetch secrets: %w", err)
		}

		// Build env vars map, filtering by environment
		envVars := make(map[string]string)
		for _, secret := range secrets {
			for _, val := range secret.Values {
				if val.Environment == env {
					envVars[secret.Key] = val.Value
					break
				}
			}
		}

		injected := len(envVars)

		if injected == 0 {
			ui.PrintWarning("No secrets found for %s environment in project '%s'", string(env), projectName)
		} else if verbose {
			ui.PrintInfo("Project: %s  •  Env: %s  •  Injecting %d secret(s)",
				ui.Highlight(projectName), ui.Info(string(env)), injected)
			for key := range envVars {
				fmt.Printf("  %s %s\n", ui.Info("→"), key)
			}
			fmt.Println()
		}

		// Build and run the command
		commandName := args[0]
		var commandArgs []string
		if len(args) > 1 {
			commandArgs = args[1:]
		}

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
			return fmt.Errorf("command failed: %w", err)
		}

		return nil
	},
}

func init() {
	runCmd.Flags().StringP("env", "e", "development", "Environment (dev/development, staging, prod/production)")
	runCmd.Flags().StringP("project", "p", "", "Project slug (overrides active project)")
}
