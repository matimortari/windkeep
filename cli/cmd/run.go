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
	Use:   "run [flags] [command] [args...]",
	Short: "Run a command with injected secrets",
	Long: `Run a command with environment variables injected from your active project's secrets.

Fetches all secrets from the specified environment and injects them as environment
variables when running your command. No .env file needed.

windkeep flags must come before the command name:

  windkeep run npm run dev
  windkeep run -e prod npm run build
  windkeep run -v -e staging go run main.go
  windkeep run -p api-service -e prod -- node --inspect server.js

Flags:
  -e, --env      Environment (dev/development, staging, prod/production) [default: development]
  -p, --project  Project slug (overrides active project)
  -v, --verbose  Show injected secret keys before running`,
	// DisableFlagParsing passes ALL args to RunE unmodified, so flags like
	// --version or --inspect in the child command are never intercepted by Cobra.
	DisableFlagParsing: true,
	RunE: func(cmd *cobra.Command, args []string) error {
		// Manually parse windkeep flags from the front of args.
		// Stop at the first arg that is not a recognised windkeep flag.
		environment := "development"
		projectSlug := ""
		verbose := false

		i := 0
		for i < len(args) {
			arg := args[i]

			if arg == "--" {
				i++ // skip separator, everything after is child args
				break
			}

			consumed := true
			switch arg {
			case "-e", "--env":
				i++
				if i >= len(args) {
					return fmt.Errorf("flag %s requires a value", arg)
				}
				environment = args[i]
			case "-p", "--project":
				i++
				if i >= len(args) {
					return fmt.Errorf("flag %s requires a value", arg)
				}
				projectSlug = args[i]
			case "-v", "--verbose":
				verbose = true
			case "-h", "--help":
				return cmd.Help()
			default:
				if strings.HasPrefix(arg, "--env=") {
					environment = strings.TrimPrefix(arg, "--env=")
				} else if strings.HasPrefix(arg, "--project=") {
					projectSlug = strings.TrimPrefix(arg, "--project=")
				} else {
					consumed = false
				}
			}

			if !consumed {
				break // first non-windkeep arg is the start of the child command
			}
			i++
		}

		childArgs := args[i:]
		if len(childArgs) == 0 {
			return fmt.Errorf("no command specified\nUsage: windkeep run [flags] [command] [args...]")
		}

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
			return fmt.Errorf("invalid environment '%s' — use: dev, staging, or prod", environment)
		}

		client := api.NewClient(config.APIURL, cfg.APIToken)

		// Resolve project
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

		// Build env vars map
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

		// Run the child command
		execCmd := exec.Command(childArgs[0], childArgs[1:]...)
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
	// Flags are parsed manually (DisableFlagParsing: true) so that child command
	// flags like --version, --inspect, etc. are never intercepted by Cobra.
	// Supported windkeep flags: -e/--env, -p/--project, -v/--verbose
}
