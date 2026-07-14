package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/matimortari/windkeep/cli/api"
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
		environment := "development"
		projectSlug := ""
		verbose := false

		i := 0
		for i < len(args) {
			arg := args[i]
			if arg == "--" {
				i++
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
				break
			}
			i++
		}

		childArgs := args[i:]
		if len(childArgs) == 0 {
			return fmt.Errorf("no command specified\nUsage: windkeep run [flags] [command] [args...]")
		}

		env, err := api.ParseEnvironment(environment)
		if err != nil {
			return err
		}

		client := newClient()
		project, err := resolveProject(client, projectSlug)
		if err != nil {
			return err
		}

		secrets, err := client.GetSecrets(project.ID)
		if err != nil {
			return fmt.Errorf("failed to fetch secrets: %w", err)
		}

		envVars := make(map[string]string)
		for _, secret := range secrets {
			for _, val := range secret.Values {
				if val.Environment == env {
					envVars[secret.Key] = val.Value
					break
				}
			}
		}

		if len(envVars) == 0 {
			ui.PrintWarning("No secrets found for %s environment in project '%s'", string(env), project.Name)
		} else if verbose {
			ui.PrintInfo("Project: %s  •  Env: %s  •  Injecting %d secret(s)",
				ui.Highlight(project.Name), ui.Info(string(env)), len(envVars))
			for key := range envVars {
				fmt.Printf("  %s %s\n", ui.Info("→"), key)
			}
			fmt.Println()
		}

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
