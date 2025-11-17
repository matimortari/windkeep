package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	BaseURL    string
	APIToken   string
	HTTPClient *http.Client
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Status  int    `json:"status"`
}

// NewClient creates a new API client
func NewClient(baseURL, apiToken string) *Client {
	return &Client{
		BaseURL:  baseURL,
		APIToken: apiToken,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// doRequest performs an HTTP request with authentication
func (c *Client) doRequest(method, endpoint string, body any) (*http.Response, error) {
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	url := c.BaseURL + endpoint
	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	if c.APIToken != "" {
		req.Header.Set("Authorization", "Bearer "+c.APIToken)
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	// Handle error responses
	if resp.StatusCode >= 400 {
		defer resp.Body.Close()
		bodyBytes, _ := io.ReadAll(resp.Body)

		var errResp ErrorResponse
		if err := json.Unmarshal(bodyBytes, &errResp); err != nil {
			return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(bodyBytes))
		}

		return nil, fmt.Errorf("API error: %s", errResp.Message)
	}

	return resp, nil
}

// parseResponse reads and unmarshals the response body
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

// GET request
func (c *Client) Get(endpoint string, result any) error {
	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return err
	}
	return parseResponse(resp, result)
}

// POST request
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

// PUT request
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

// DELETE request
func (c *Client) Delete(endpoint string) error {
	resp, err := c.doRequest("DELETE", endpoint, nil)
	if err != nil {
		return err
	}
	resp.Body.Close()
	return nil
}
