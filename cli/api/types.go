package api

import "time"

// Environment types
type Environment string

const (
	EnvDevelopment Environment = "DEVELOPMENT"
	EnvStaging     Environment = "STAGING"
	EnvProduction  Environment = "PRODUCTION"
)

// Role types
type Role string

const (
	RoleOwner  Role = "OWNER"
	RoleAdmin  Role = "ADMIN"
	RoleMember Role = "MEMBER"
)

// User represents a user
type User struct {
	ID          string    `json:"id"`
	Email       string    `json:"email"`
	Name        string    `json:"name"`
	Image       *string   `json:"image"`
	ActiveOrgID *string   `json:"activeOrgId"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Organization represents an organization
type Organization struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// OrganizationWithRole includes the user's role in the organization
type OrganizationWithRole struct {
	Organization
	Role Role `json:"role"`
}

// Project represents a project within an organization
type Project struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Slug           string    `json:"slug"`
	Description    *string   `json:"description"`
	OrganizationID string    `json:"organizationId"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// ProjectWithRole includes the user's role in the project
type ProjectWithRole struct {
	Project
	Role Role `json:"role"`
}

// Secret represents a secret key
type Secret struct {
	ID          string    `json:"id"`
	Key         string    `json:"key"`
	Description *string   `json:"description"`
	ProjectID   string    `json:"projectId"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// SecretValue represents a secret value for a specific environment
type SecretValue struct {
	ID          string      `json:"id"`
	SecretID    string      `json:"secretId"`
	Environment Environment `json:"environment"`
	Value       string      `json:"value"`
	CreatedAt   time.Time   `json:"createdAt"`
	UpdatedAt   time.Time   `json:"updatedAt"`
}

// SecretWithValues includes all environment values
type SecretWithValues struct {
	Secret
	Values []SecretValue `json:"values"`
}
