package cmd

import (
	"fmt"

	"github.com/matimortari/windkeep/cli/api"
	"github.com/matimortari/windkeep/cli/config"
	"github.com/matimortari/windkeep/cli/ui"
)

func newClient() *api.Client {
	return api.NewClient(config.APIURL, cfg.APIToken)
}

func findProjectBySlug(client *api.Client, slug string) (*api.Project, error) {
	if cfg.ActiveOrgID == "" {
		return nil, fmt.Errorf("no active organization. Use 'windkeep orgs switch' first")
	}
	projects, err := projectsInOrg(client, cfg.ActiveOrgID)
	if err != nil {
		return nil, err
	}
	for i := range projects {
		if projects[i].Slug == slug {
			return &projects[i], nil
		}
	}
	return nil, fmt.Errorf("project '%s' not found", slug)
}

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

// resolveProject returns a project by slug, or the active project when slug is empty.
func resolveProject(client *api.Client, slug string) (*api.Project, error) {
	if slug == "" {
		if cfg.ActiveProjectSlug == "" {
			return nil, fmt.Errorf("no active project. Use 'windkeep projects switch' first")
		}
		slug = cfg.ActiveProjectSlug
	}
	proj, err := findProjectBySlug(client, slug)
	if err != nil && slug == cfg.ActiveProjectSlug {
		return nil, fmt.Errorf("active project '%s' not found. Use 'windkeep projects switch' to select a valid project", slug)
	}
	return proj, err
}

func getSecretByKey(client *api.Client, projectID, key string) (*api.Secret, error) {
	secrets, err := client.GetSecrets(projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get secrets: %w", err)
	}
	for i := range secrets {
		if secrets[i].Key == key {
			return &secrets[i], nil
		}
	}
	return nil, fmt.Errorf("secret '%s' not found", key)
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
	if dev != "" {
		values = append(values, api.SecretValueInput{Environment: api.EnvDevelopment, Value: dev})
	}
	if staging != "" {
		values = append(values, api.SecretValueInput{Environment: api.EnvStaging, Value: staging})
	}
	if prod != "" {
		values = append(values, api.SecretValueInput{Environment: api.EnvProduction, Value: prod})
	}
	return values
}

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
