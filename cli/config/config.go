package config

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

const (
	DefaultConfigDir  = ".secretkeepr"
	DefaultConfigFile = "config.yaml"
	DefaultAPIURL     = "https://secretkeepr.vercel.app"
)

type Config struct {
	APIToken           string `yaml:"api_token"`
	APIURL             string `yaml:"api_url"`
	ActiveOrgID        string `yaml:"active_org_id,omitempty"`
	ActiveOrgName      string `yaml:"active_org_name,omitempty"`
	ActiveProjectID    string `yaml:"active_project_id,omitempty"`
	ActiveProjectName  string `yaml:"active_project_name,omitempty"`
	DefaultEnvironment string `yaml:"default_environment,omitempty"`
}

// GetConfigDir returns the configuration directory path
func GetConfigDir() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}

	configDir := filepath.Join(homeDir, DefaultConfigDir)
	return configDir, nil
}

// GetConfigPath returns the full path to the config file
func GetConfigPath(customPath string) (string, error) {
	if customPath != "" {
		return customPath, nil
	}

	configDir, err := GetConfigDir()
	if err != nil {
		return "", err
	}

	return filepath.Join(configDir, DefaultConfigFile), nil
}

// EnsureConfigDir creates the config directory if it doesn't exist
func EnsureConfigDir() error {
	configDir, err := GetConfigDir()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(configDir, 0700); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	return nil
}

// Load reads the configuration from the file
func Load(customPath string) (*Config, error) {
	configPath, err := GetConfigPath(customPath)
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("config file not found at %s", configPath)
		}
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	// Set defaults if not provided
	if cfg.APIURL == "" {
		cfg.APIURL = DefaultAPIURL
	}

	return &cfg, nil
}

// Save writes the configuration to the file
func (c *Config) Save(customPath string) error {
	if err := EnsureConfigDir(); err != nil {
		return err
	}

	configPath, err := GetConfigPath(customPath)
	if err != nil {
		return err
	}

	data, err := yaml.Marshal(c)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(configPath, data, 0600); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// Delete removes the configuration file
func Delete(customPath string) error {
	configPath, err := GetConfigPath(customPath)
	if err != nil {
		return err
	}

	if err := os.Remove(configPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete config file: %w", err)
	}

	return nil
}

// Update modifies specific fields in the config
func (c *Config) Update(updates map[string]string) {
	for key, value := range updates {
		switch key {
		case "api_token":
			c.APIToken = value
		case "api_url":
			c.APIURL = value
		case "active_org_id":
			c.ActiveOrgID = value
		case "active_org_name":
			c.ActiveOrgName = value
		case "active_project_id":
			c.ActiveProjectID = value
		case "active_project_name":
			c.ActiveProjectName = value
		case "default_environment":
			c.DefaultEnvironment = value
		}
	}
}

// IsAuthenticated checks if the user has a valid API token
func (c *Config) IsAuthenticated() bool {
	return c.APIToken != ""
}

// HasActiveOrg checks if an organization is set
func (c *Config) HasActiveOrg() bool {
	return c.ActiveOrgID != ""
}

// HasActiveProject checks if a project is set
func (c *Config) HasActiveProject() bool {
	return c.ActiveProjectID != ""
}
