package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	BaseURL    string
	APIToken   string
	HTTPClient *http.Client
}

type APIError struct {
	Status  int
	Message string
}

func (e *APIError) Error() string {
	return fmt.Sprintf("API error %d: %s", e.Status, e.Message)
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Status  int    `json:"status"`
}

func ParseEnvironment(environment string) Environment {
	switch strings.ToUpper(environment) {
	case "DEV", "DEVELOPMENT":
		return EnvDevelopment
	case "STAGING":
		return EnvStaging
	case "PROD", "PRODUCTION":
		return EnvProduction
	default:
		return EnvDevelopment
	}
}

func NewClient(baseURL, apiToken string) *Client {
	return &Client{
		BaseURL:  baseURL,
		APIToken: apiToken,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) doRequest(method, endpoint string, body any) (*http.Response, error) {
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, c.BaseURL+endpoint, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	if c.APIToken != "" {
		req.Header.Set("Authorization", "Bearer "+c.APIToken)
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	if resp.StatusCode >= 400 {
		defer resp.Body.Close()
		bodyBytes, _ := io.ReadAll(resp.Body)

		var errResp ErrorResponse
		if err := json.Unmarshal(bodyBytes, &errResp); err != nil {
			return nil, &APIError{Status: resp.StatusCode, Message: string(bodyBytes)}
		}

		msg := errResp.Message
		if msg == "" {
			msg = errResp.Error
		}
		return nil, &APIError{Status: resp.StatusCode, Message: msg}
	}

	return resp, nil
}

func parseResponse(resp *http.Response, v any) error {
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	if err := json.Unmarshal(body, v); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	return nil
}

func (c *Client) Get(endpoint string, result any) error {
	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return err
	}
	return parseResponse(resp, result)
}

func (c *Client) Post(endpoint string, body any, result any) error {
	resp, err := c.doRequest("POST", endpoint, body)
	if err != nil {
		return err
	}
	if result != nil {
		return parseResponse(resp, result)
	}
	resp.Body.Close()
	return nil
}

func (c *Client) Put(endpoint string, body any, result any) error {
	resp, err := c.doRequest("PUT", endpoint, body)
	if err != nil {
		return err
	}
	if result != nil {
		return parseResponse(resp, result)
	}
	resp.Body.Close()
	return nil
}

func (c *Client) Delete(endpoint string) error {
	resp, err := c.doRequest("DELETE", endpoint, nil)
	if err != nil {
		return err
	}
	resp.Body.Close()
	return nil
}

func (c *Client) GetUser() (*User, error) {
	var response struct {
		UserData User `json:"userData"`
	}
	if err := c.Get("/api/user", &response); err != nil {
		return nil, err
	}
	return &response.UserData, nil
}

func (c *Client) GetOrganization(orgID string) (*Organization, error) {
	var response struct {
		Organization Organization `json:"organization"`
	}
	if err := c.Get("/api/orgs/"+orgID, &response); err != nil {
		return nil, err
	}
	return &response.Organization, nil
}

func (c *Client) CreateOrganization(req CreateOrgRequest) (*Organization, error) {
	var response struct {
		Organization Organization `json:"organization"`
	}
	if err := c.Post("/api/orgs", req, &response); err != nil {
		return nil, err
	}
	return &response.Organization, nil
}

func (c *Client) UpdateOrganization(orgID string, req UpdateOrgRequest) (*Organization, error) {
	var response struct {
		UpdatedOrg Organization `json:"updatedOrg"`
	}
	if err := c.Put("/api/orgs/"+orgID, req, &response); err != nil {
		return nil, err
	}
	return &response.UpdatedOrg, nil
}

func (c *Client) GetProjects() ([]Project, error) {
	var response struct {
		Projects []Project `json:"projects"`
	}
	if err := c.Get("/api/projects", &response); err != nil {
		return nil, err
	}
	return response.Projects, nil
}

func (c *Client) CreateProject(req CreateProjectRequest) (*Project, error) {
	var response struct {
		Project Project `json:"project"`
	}
	if err := c.Post("/api/projects", req, &response); err != nil {
		return nil, err
	}
	return &response.Project, nil
}

func (c *Client) UpdateProject(projectID string, req UpdateProjectRequest) (*Project, error) {
	var response struct {
		Project Project `json:"project"`
	}
	if err := c.Put("/api/projects/"+projectID, req, &response); err != nil {
		return nil, err
	}
	return &response.Project, nil
}

func (c *Client) DeleteProject(projectID string) error {
	return c.Delete("/api/projects/" + projectID)
}

func (c *Client) GetSecrets(projectID string) ([]Secret, error) {
	var response struct {
		DecryptedSecrets []Secret `json:"decryptedSecrets"`
	}
	if err := c.Get("/api/projects/"+projectID+"/secrets", &response); err != nil {
		return nil, err
	}
	return response.DecryptedSecrets, nil
}

func (c *Client) CreateSecret(projectID string, req CreateSecretRequest) (*Secret, error) {
	var secret Secret
	if err := c.Post("/api/projects/"+projectID+"/secrets", req, &secret); err != nil {
		return nil, err
	}
	return &secret, nil
}

func (c *Client) UpdateSecret(projectID, secretID string, req UpdateSecretRequest) (*Secret, error) {
	var secret Secret
	if err := c.Put("/api/projects/"+projectID+"/secrets/"+secretID, req, &secret); err != nil {
		return nil, err
	}
	return &secret, nil
}

func (c *Client) DeleteSecret(projectID, secretID string) error {
	return c.Delete("/api/projects/" + projectID + "/secrets/" + secretID)
}

func (c *Client) GetSecretHistory(projectID, secretID string) ([]EnvironmentHistory, error) {
	var response struct {
		History []EnvironmentHistory `json:"history"`
	}
	if err := c.Get("/api/projects/"+projectID+"/secrets/"+secretID+"/history", &response); err != nil {
		return nil, err
	}
	return response.History, nil
}
