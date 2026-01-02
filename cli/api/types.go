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
	ID             string          `json:"id"`
	Email          string          `json:"email"`
	Name           string          `json:"name"`
	Image          *string         `json:"image"`
	APIToken       *string         `json:"apiToken"`
	OrgMemberships []OrgMembership `json:"orgMemberships,omitempty"`
	CreatedAt      time.Time       `json:"createdAt"`
	UpdatedAt      time.Time       `json:"updatedAt"`
}

// OrgMembership represents a user's membership in an organization
type OrgMembership struct {
	UserID   string       `json:"userId"`
	OrgID    string       `json:"orgId"`
	Role     Role         `json:"role"`
	IsActive bool         `json:"isActive"`
	Org      Organization `json:"org"`
}

// Organization represents an organization
type Organization struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Role      *Role     `json:"role,omitempty"`
	IsActive  *bool     `json:"isActive,omitempty"`
	Projects  []Project `json:"projects,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Project represents a project within an organization
type Project struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Slug        string        `json:"slug"`
	Description *string       `json:"description"`
	OrgID       string        `json:"orgId"`
	Org         *Organization `json:"org,omitempty"`
	Secrets     []Secret      `json:"secrets,omitempty"`
	CreatedAt   time.Time     `json:"createdAt"`
	UpdatedAt   time.Time     `json:"updatedAt"`
}

// Secret represents a secret key
type Secret struct {
	ID          string        `json:"id"`
	Key         string        `json:"key"`
	Description *string       `json:"description"`
	ProjectID   string        `json:"projectId"`
	Project     *Project      `json:"project,omitempty"`
	Values      []SecretValue `json:"values,omitempty"`
	CreatedAt   time.Time     `json:"createdAt"`
	UpdatedAt   time.Time     `json:"updatedAt"`
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

// Request types
type CreateProjectRequest struct {
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description *string `json:"description,omitempty"`
	OrgID       string  `json:"orgId"`
}

type UpdateProjectRequest struct {
	Name        *string `json:"name,omitempty"`
	Slug        *string `json:"slug,omitempty"`
	Description *string `json:"description,omitempty"`
}

type CreateOrgRequest struct {
	Name string `json:"name"`
}

type UpdateOrgRequest struct {
	Name string `json:"name"`
}

type CreateSecretRequest struct {
	Key         string             `json:"key"`
	Description *string            `json:"description,omitempty"`
	ProjectID   string             `json:"projectId"`
	Values      []SecretValueInput `json:"values,omitempty"`
}

type UpdateSecretRequest struct {
	Description *string            `json:"description,omitempty"`
	Values      []SecretValueInput `json:"values,omitempty"`
}

type SecretValueInput struct {
	Environment Environment `json:"environment"`
	Value       string      `json:"value"`
}
