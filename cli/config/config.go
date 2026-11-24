package config

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"gopkg.in/yaml.v3"
)

const APIURL = "https://windkeep.up.railway.app"

type Config struct {
	APIToken          string `yaml:"api_token"`
	ActiveOrgID       string `yaml:"active_org_id,omitempty"`
	ActiveOrgName     string `yaml:"active_org_name,omitempty"`
	ActiveProjectSlug string `yaml:"active_project_slug,omitempty"`
	ActiveProjectID   string `yaml:"active_project_id,omitempty"`
	ActiveProjectName string `yaml:"active_project_name,omitempty"`
	ServiceTokenName  string `yaml:"service_token_name,omitempty"`
}

// LoadAuth loads the config file, letting WINDKEEP_TOKEN and WINDKEEP_PROJECT_ID override it (e.g. in CI without a prior login).
func LoadAuth() (*Config, error) {
	envToken := strings.TrimSpace(os.Getenv("WINDKEEP_TOKEN"))
	envProjectID := strings.TrimSpace(os.Getenv("WINDKEEP_PROJECT_ID"))

	cfg, err := Load()
	if err != nil {
		if envToken == "" {
			return nil, err
		}
		cfg = &Config{}
	}

	if envToken != "" {
		cfg.APIToken = envToken
	}
	if envProjectID != "" {
		cfg.ActiveProjectID = envProjectID
	}

	if cfg.APIToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}

	return cfg, nil
}

func GetConfigPath() (string, error) {
	var baseDir string

	if runtime.GOOS == "windows" {
		baseDir = os.Getenv("APPDATA")
		if baseDir == "" {
			return "", fmt.Errorf("APPDATA not set")
		}
	} else {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		baseDir = filepath.Join(home, ".config")
	}

	dir := filepath.Join(baseDir, "windkeep")
	return filepath.Join(dir, "config.yml"), nil
}

func Load() (*Config, error) {
	configPath, err := GetConfigPath()
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

	return &cfg, nil
}

func (c *Config) Save() error {
	configPath, err := GetConfigPath()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(configPath), 0700); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
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

func Delete() error {
	configPath, err := GetConfigPath()
	if err != nil {
		return err
	}

	if err := os.Remove(configPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete config file: %w", err)
	}

	return nil
}
