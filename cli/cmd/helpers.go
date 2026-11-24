package cmd

import (
	"errors"
	"fmt"
	"slices"

	"github.com/manifoldco/promptui"
	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/matimortari/windkeep/cli/ui"
	"github.com/spf13/cobra"
)

func newClient() *api.Client {
	return api.NewClient(config.APIURL, cfg.APIToken)
}

func usingServiceToken() bool {
	return api.IsServiceToken(cfg.APIToken)
}

var (
	errNoActiveOrg     = errors.New("no active organization. Use 'windkeep orgs switch' first")
	errProjectNotFound = errors.New("project not found")
)

func requireActiveOrg(client *api.Client) (*api.OrgMembership, error) {
	org, err := getActiveOrg(client)
	if err == nil && org == nil {
		err = errNoActiveOrg
	}
	return org, err
}

// activeOrgProjects returns the active org and its projects, printing a hint when there are none.
func activeOrgProjects(client *api.Client) (*api.OrgMembership, []api.Project, error) {
	org, err := requireActiveOrg(client)
	if err != nil {
		return nil, nil, err
	}
	projects, err := projectsInOrg(client, org.OrgID)
	if err == nil && len(projects) == 0 {
		ui.PrintWarning("No projects found in '%s'.", org.Org.Name)
		ui.PrintInfo("Create one with: %s", ui.Highlight("windkeep projects create"))
	}
	return org, projects, err
}

func findProjectBySlug(client *api.Client, slug string) (*api.Project, error) {
	if cfg.ActiveOrgID == "" {
		return nil, errNoActiveOrg
	}
	projects, err := projectsInOrg(client, cfg.ActiveOrgID)
	if err != nil {
		return nil, err
	}
	if p := projectWithSlug(projects, slug); p != nil {
		return p, nil
	}
	return nil, fmt.Errorf("%w: '%s'", errProjectNotFound, slug)
}

func projectWithSlug(projects []api.Project, slug string) *api.Project {
	if i := slices.IndexFunc(projects, func(p api.Project) bool { return p.Slug == slug }); i >= 0 {
		return &projects[i]
	}
	return nil
}

// projectsInOrg fetches the org first because that marks it active server-side, and GetProjects only returns projects from the active org.
func projectsInOrg(client *api.Client, orgID string) ([]api.Project, error) {
	if _, err := client.GetOrganization(orgID); err != nil {
		return nil, fmt.Errorf("failed to activate organization: %w", err)
	}
	projects, err := client.GetProjects()
	if err != nil {
		return nil, fmt.Errorf("failed to get projects: %w", err)
	}
	return projects, nil
}

// resolveServiceTokenProject builds the project from config without an API call, since service tokens can't list projects and are locked to a single one.
func resolveServiceTokenProject(slug string) (*api.Project, error) {
	if cfg.ActiveProjectID == "" {
		return nil, fmt.Errorf("service token auth requires a project id – set WINDKEEP_PROJECT_ID or run 'windkeep login' with the service token")
	}
	if slug != "" && cfg.ActiveProjectSlug != "" && slug != cfg.ActiveProjectSlug {
		return nil, fmt.Errorf("service tokens are scoped to project '%s' and cannot switch projects", cfg.ActiveProjectSlug)
	}
	if slug != "" && cfg.ActiveProjectSlug == "" {
		return nil, fmt.Errorf("service tokens cannot resolve projects by slug – omit -p or login with the service token first")
	}

	name := cfg.ActiveProjectName
	if name == "" {
		name = cfg.ActiveProjectSlug
	}
	if name == "" {
		name = cfg.ActiveProjectID
	}

	return &api.Project{
		ID:    cfg.ActiveProjectID,
		Slug:  cfg.ActiveProjectSlug,
		Name:  name,
		OrgID: cfg.ActiveOrgID,
	}, nil
}

// resolveProject returns a project by slug, or the active project when slug is empty.
func resolveProject(client *api.Client, slug string) (*api.Project, error) {
	if usingServiceToken() {
		return resolveServiceTokenProject(slug)
	}

	if slug == "" {
		if cfg.ActiveProjectSlug == "" {
			return nil, fmt.Errorf("no active project. Use 'windkeep projects switch' first")
		}
		slug = cfg.ActiveProjectSlug
	}
	proj, err := findProjectBySlug(client, slug)
	if errors.Is(err, errProjectNotFound) && slug == cfg.ActiveProjectSlug {
		return nil, fmt.Errorf("active project '%s' not found. Use 'windkeep projects switch' to select a valid project", slug)
	}
	return proj, err
}

func getSecretByKey(client *api.Client, projectID, key string) (*api.Secret, error) {
	secrets, err := client.GetSecrets(projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get secrets: %w", err)
	}
	if i := slices.IndexFunc(secrets, func(s api.Secret) bool { return s.Key == key }); i >= 0 {
		return &secrets[i], nil
	}
	return nil, fmt.Errorf("secret '%s' not found", key)
}

func valueForEnv(secret api.Secret, env api.Environment) (string, bool) {
	if i := slices.IndexFunc(secret.Values, func(v api.SecretValue) bool { return v.Environment == env }); i >= 0 {
		return secret.Values[i].Value, true
	}
	return "", false
}

// confirmDelete prompts unless --confirm was passed; returns false if the user declined.
func confirmDelete(cmd *cobra.Command, label string) bool {
	if confirm, _ := cmd.Flags().GetBool("confirm"); confirm {
		return true
	}
	if _, err := (&promptui.Prompt{Label: label, IsConfirm: true}).Run(); err != nil {
		ui.PrintInfo("Deletion cancelled")
		return false
	}
	return true
}

func printProjectContext() {
	name := cfg.ActiveProjectName
	if name == "" {
		name = cfg.ActiveProjectSlug
	}
	if name != "" {
		ui.PrintInfo("Project: %s", ui.Highlight(name))
	}
}

func buildSecretValues(dev, staging, prod string) []api.SecretValueInput {
	var values []api.SecretValueInput
	for _, v := range []api.SecretValueInput{{Environment: api.EnvDevelopment, Value: dev}, {Environment: api.EnvStaging, Value: staging}, {Environment: api.EnvProduction, Value: prod}} {
		if v.Value != "" {
			values = append(values, v)
		}
	}
	return values
}

// mergeSecretValues overlays updates onto existing values per environment, so the
// server receives the full set and untouched environments keep their values.
func mergeSecretValues(existing []api.SecretValue, updates []api.SecretValueInput) []api.SecretValueInput {
	merged := make(map[api.Environment]string, len(existing))
	for _, v := range existing {
		merged[v.Environment] = v.Value
	}
	for _, v := range updates {
		merged[v.Environment] = v.Value
	}
	result := make([]api.SecretValueInput, 0, len(merged))
	for env, val := range merged {
		result = append(result, api.SecretValueInput{Environment: env, Value: val})
	}
	return result
}
