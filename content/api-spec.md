# WindKeep API Specification

This document provides comprehensive documentation for the WindKeep REST API, which is used by the WindKeep web application and CLI to manage organizations, projects, secrets, and user profiles. The WindKeep API is organized around REST principles with predictable resource-oriented URLs, JSON request/response bodies, and standard HTTP response codes.

## Overview

### Authentication

The API uses OAuth 2.0 for user authentication via third-party providers (Google, GitHub and GitLab). Sessions are managed using secure HTTP-only cookies.

For CLI and programmatic access, an API token is used for authentication. The token can be obtained from the [preferences page](https://windkeep.up.railway.app/admin/preferences). Include the token in the `Authorization` header:

```
Authorization: Bearer YOUR_API_TOKEN
```

### Response Format

All responses are returned in JSON format. Successful responses return a `2xx` status code. Error responses include an error message in the response body.

### Error Handling

The API uses standard HTTP response codes to indicate success or failure:

- `200 OK` - Request succeeded
- `400 Bad Request` - Invalid request parameters or validation error
- `401 Unauthorized` - Authentication required or invalid credentials
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `500 Internal Server Error` - Server error

---

## Endpoints

### Authentication & Session

#### Login with Provider

> **POST** `/api/auth/{provider}`

Initiates OAuth login with the specified provider.

**Route Parameters**:

- `provider`: OAuth provider name (required). Supported providers: `google`, `github`, `gitlab`.

**Response:**

Navigates to the provider's OAuth consent screen.

#### Logout

> **POST** `/api/auth/logout`

Logs out the authenticated user and clears the session.

**Response:**

```json
{
  "success": true
}
```

#### Refresh Session

> **POST** `/api/auth/refresh`

Refreshes the authenticated user's session, extending it by 7 days.

**Response:**

```json
{
  "success": true,
  "expiresAt": "Date"
}
```

#### Validate Session

> **POST** `/api/auth/validate`

Validates the authenticated user's session and checks for inactivity timeout. Updates the last activity timestamp.

**Response:**

```json
{
  "valid": true,
  "expiresAt": "Date"
}
```

---

### User Profile

#### Get User Profile

> **GET** `/api/user`

Retrieves the authenticated user's profile information, including organization and project memberships.

**Response:**

```json
{
  "userData": {
    "id": "string",
    "email": "string",
    "name": "string",
    "image": "string | null",
    "apiToken": "string | null",
    "createdAt": "Date",
    "updatedAt": "Date",
    "orgMemberships": [
      {
        "id": "string",
        "role": "OWNER | ADMIN | MEMBER",
        "isActive": "boolean",
        "userId": "string",
        "orgId": "string",
        "org": {
          "id": "string",
          "name": "string",
          "slug": "string",
          "createdAt": "Date",
          "updatedAt": "Date"
        }
      }
    ],
    "projectMemberships": [
      {
        "role": "OWNER | ADMIN | MEMBER",
        "projectId": "string",
        "project": {
          "id": "string",
          "name": "string",
          "slug": "string",
          "orgId": "string"
        }
      }
    ]
  }
}
```

#### Update User Profile

> **PUT** `/api/user`

Updates the authenticated user's profile information.

**Request Body**:

```json
{
  "name": "string", // Optional: 3-50 characters
  "regenerateApiToken": "boolean" // Optional: set to true to regenerate API token
}
```

**Response:**

```json
{
  "updatedUser": {
    "id": "string",
    "email": "string",
    "name": "string",
    "image": "string | null",
    "apiToken": "string | null",
    "createdAt": "Date",
    "updatedAt": "Date"
  }
}
```

#### Update User Image

> **PUT** `/api/user/image-upload`

Uploads and updates the authenticated user's profile image. Replaces the existing image if one exists.

**Request Body:** Multipart form data

- `file`: Image file (PNG, JPEG, or WebP format, max 2MB)

**Response:**

```json
{
  "imageUrl": "string"
}
```

#### Delete User Account

> **DELETE** `/api/user`

Deletes the authenticated user's account. Also deletes any organizations where the user is the sole owner with no other members. If the user is the sole owner of organizations that have other members, the user must transfer ownership or delete those organizations before deleting their account. This action cannot be undone.

**Response:**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### Organizations

#### Create Organization

> **POST** `/api/orgs`

Creates a new organization with the authenticated user as the owner. Automatically sets the new organization as the user's active organization.

**Request Body**:

```json
{
  "name": "string" // Required: 3-50 characters
}
```

**Response:**

```json
{
  "organization": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "createdAt": "Date",
    "updatedAt": "Date"
  }
}
```

#### Get Organization Details

> **GET** `/api/orgs/{org}`

Retrieves details of a specific organization. Requires membership in the organization.

**Route Parameters**:

- `org`: Organization ID (required).

**Response:**

```json
{
  "organization": {
    "id": "string",
    "name": "string",
    "createdAt": "Date",
    "updatedAt": "Date",
    "role": "OWNER | ADMIN | MEMBER",
    "isActive": "boolean",
    "memberships": [
      {
        "userId": "string",
        "role": "OWNER | ADMIN | MEMBER",
        "isActive": "boolean",
        "user": {
          "id": "string",
          "name": "string",
          "image": "string | null"
        }
      }
    ],
    "projects": [
      {
        "id": "string",
        "name": "string",
        "slug": "string",
        "description": "string | null",
        "orgId": "string",
        "createdAt": "Date",
        "updatedAt": "Date"
      }
    ]
  }
}
```

#### Update Organization

> **PUT** `/api/orgs/{org}`

Updates organization information. Only organization owners can perform this action.

**Route Parameters**:

- `org`: Organization ID (required).

**Request Body**:

```json
{
  "name": "string" // Optional: 3-50 characters
}
```

**Response:**

```json
{
  "updatedOrg": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "createdAt": "Date",
    "updatedAt": "Date"
  }
}
```

#### Delete Organization

> **DELETE** `/api/orgs/{org}`

Permanently deletes an organization. Only organization owners can perform this action.

**Route Parameters**:

- `org`: Organization ID (required).

**Response:**

```json
{
  "success": true,
  "message": "Organization deleted successfully"
}
```

---

### Organization Memberships

#### Update Organization Member Role

> **PUT** `/api/orgs/{org}/members/{member}`

Updates a member's role in the organization. Only owners and admins can update member roles. Cannot promote users to owner roles or modify existing owners. Users cannot change their own role.

**Route Parameters**:

- `org`: Organization ID (required).
- `member`: Member user ID (required).

**Request Body**:

```json
{
  "role": "ADMIN | MEMBER" // Required: the new role for the member
}
```

**Response:**

```json
{
  "updatedMembership": {
    "userId": "string",
    "orgId": "string",
    "role": "ADMIN | MEMBER",
    "isActive": "boolean",
    "user": {
      // ... User details
    },
    "org": {
      // ... Organization details
    }
  }
}
```

#### Remove Organization Member

> **DELETE** `/api/orgs/{org}/members/{member}`

Removes a member from the organization. Members can remove themselves (leave the organization). Only owners and admins can remove other members. If other members exist, organization owners must transfer ownership. If the owner is the last remaining member, they can leave and the organization will be deleted.

**Route Parameters**:

- `org`: Organization ID (required).
- `member`: Member user ID (required).

**Response:**

```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

#### Create Organization Invite

> **POST** `/api/orgs/{org}/invite/create`

Creates an invitation link for new members to join the organization. Only owners and admins can create invitations.

**Route Parameters**:

- `org`: Organization ID (required).

**Response:**

```json
{
  "invitation": {
    "id": "string",
    "orgId": "string",
    "token": "string",
    "expiresAt": "Date",
    "invitedById": "string",
    "org": {
      // ... Organization details
    },
    "invitedBy": {
      // ... User details
    }
  },
  "inviteUrl": "string"
}
```

#### Accept Organization Invite

> **POST** `/api/orgs/{org}/invite/accept`

Accepts an invitation to join an organization. Adds the authenticated user to the organization with the member role.

**Route Parameters**:

- `org`: Organization ID (required).

**Request Body**:

```json
{
  "token": "string" // Required: invitation token
}
```

**Response:**

```json
{
  "organization": {
    // ... Organization details
  },
  "membership": {
    "userId": "string",
    "orgId": "string",
    "role": "MEMBER",
    "isActive": "boolean",
    "org": {
      // ... Organization details
    },
    "user": {
      // ... User details
    }
  }
}
```

#### Transfer Organization Ownership

> **POST** `/api/orgs/{org}/transfer-ownership`

Transfers organization ownership to another member. Only the current organization owner can perform this action. The current owner will be demoted to the admin role, and the specified member will become the new owner.

**Route Parameters**:

- `org`: Organization ID (required).

**Request Body**:

```json
{
  "newOwnerId": "string" // Required: user ID of the member who will become the new owner
}
```

**Response:**

```json
{
  "success": true,
  "message": "Ownership transferred successfully",
  "previousOwner": {
    "userId": "string",
    "role": "ADMIN",
    "user": {
      // ... User details
    }
  },
  "newOwner": {
    "userId": "string",
    "role": "OWNER",
    "user": {
      // ... User details
    }
  }
}
```

---

### Audit Logs

#### Get Organization Audit Logs

> **GET** `/api/orgs/{org}/audit`

Retrieves audit logs for an organization with optional filtering and pagination. Only owners and admins can access audit logs.

**Route Parameters**:

- `org`: Organization ID (required).

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page, max 100 (default: 20)
- `projectId`: Filter by project ID
- `action`: Filter by action string (case-insensitive partial match)
- `userId`: Filter by user ID
- `startDate`: Filter logs created after this date (ISO 8601 datetime)
- `endDate`: Filter logs created before this date (ISO 8601 datetime)

**Response:**

```json
{
  "auditLogs": [
    {
      "id": "string",
      "action": "string",
      "resource": "string",
      "description": "string",
      "metadata": "object | null",
      "userId": "string",
      "orgId": "string",
      "projectId": "string | null",
      "createdAt": "Date",
      "user": {
        // ... User details
      },
      "project": {
        // ... Project details
      }
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "totalPages": "number",
    "totalItems": "number",
    "hasNext": "boolean",
    "hasPrev": "boolean"
  },
  "filters": {
    "users": [
      {
        "id": "string",
        "name": "string",
        "email": "string"
      }
    ],
    "projects": [
      {
        "id": "string",
        "name": "string"
      }
    ],
    "actions": ["string"]
  }
}
```

#### Delete Organization Audit Logs

> **DELETE** `/api/orgs/{org}/audit`

Deletes audit logs in an organization based on specified filters. Only organization owners can perform this action.

**Route Parameters**:

- `org`: Organization ID (required).

**Request Body**:

```json
{
  "olderThan": "string", // Optional: ISO 8601 datetime, delete logs older than this date
  "projectId": "string", // Optional: filter by project ID
  "userId": "string", // Optional: filter by user ID
  "action": "string" // Optional: filter by action (case-insensitive partial match)
}
```

**Response:**

```json
{
  "success": true,
  "message": "Deleted 10 audit log(s)"
}
```

---

### Projects

#### Get Projects

> **GET** `/api/projects`

Retrieves all projects the authenticated user has access to, including their organization, memberships, and secrets.

**Response:**

```json
{
  "projects": [
    {
      "id": "string",
      "name": "string",
      "slug": "string",
      "description": "string | null",
      "orgId": "string",
      "createdAt": "Date",
      "updatedAt": "Date",
      "org": {
        // ... Organization details
      },
      "memberships": [
        {
          "userId": "string",
          "projectId": "string",
          "role": "OWNER | ADMIN | MEMBER",
          "user": {
            // ... User details
          }
        }
      ],
      "secrets": [
        {
          "id": "string",
          "key": "string",
          "description": "string | null",
          "projectId": "string",
          "createdAt": "Date",
          "updatedAt": "Date"
        }
      ]
    }
  ]
}
```

#### Create Project

> **POST** `/api/projects`

Creates a new project in an organization. Only organization owners and admins can create projects. The authenticated user becomes the project owner. The project slug is automatically generated from the project name.

**Request Body**:

```json
{
  "name": "string", // Required: 3-50 characters
  "description": "string", // Optional: max 255 characters
  "orgId": "string" // Required: organization ID where the project will be created
}
```

**Response:**

```json
{
  "project": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "description": "string | null",
    "orgId": "string",
    "createdAt": "Date",
    "updatedAt": "Date",
    "org": {
      // ... Organization details
    },
    "memberships": [
      {
        "userId": "string",
        "projectId": "string",
        "role": "OWNER",
        "user": {
          // ... User details
        }
      }
    ],
    "_count": {
      "secrets": "number"
    }
  }
}
```

#### Update Project

> **PUT** `/api/projects/{project}`

Updates project details. Only project owners can perform this action.

**Route Parameters**:

- `project`: Project ID (required).

**Request Body**:

```json
{
  "name": "string", // Optional: 3-50 characters
  "slug": "string", // Optional: 3-50 characters, lowercase letters, numbers, and hyphens only
  "description": "string" // Optional: max 255 characters
}
```

**Response:**

```json
{
  "project": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "description": "string | null",
    "orgId": "string",
    "createdAt": "Date",
    "updatedAt": "Date",
    "org": {
      // ... Organization details
    }
  }
}
```

#### Delete Project

> **DELETE** `/api/projects/{project}`

Permanently deletes a project. Only project owners can perform this action. All associated secrets, secret values, memberships, and audit logs are subsequently deleted.

**Route Parameters**:

- `project`: Project ID (required).

**Response:**

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

### Project Memberships

#### Add Project Member

> **POST** `/api/projects/{project}/members`

Adds a new member to a project. Only project owners and admins can add members. The user must already be a member of the organization. Users can only be added as members or admins (the owner role is assigned during project creation only).

**Route Parameters**:

- `project`: Project ID (required).

**Request Body**:

```json
{
  "userId": "string", // Required: user ID to add as member
  "role": "ADMIN | MEMBER" // Optional: defaults to MEMBER
}
```

**Response:**

```json
{
  "projectRole": {
    "userId": "string",
    "projectId": "string",
    "role": "ADMIN | MEMBER",
    "user": {
      // ... User details
    },
    "project": {
      // ... Project details
    }
  }
}
```

#### Update Project Member Role

> **PUT** `/api/projects/{project}/members/{member}`

Updates a member's role in the project. Only owners and admins can update member roles. Cannot promote users to the owner role or modify existing owner roles. Users cannot change their own role.

**Route Parameters**:

- `project`: Project ID (required).
- `member`: Member user ID (required).

**Request Body**:

```json
{
  "role": "ADMIN | MEMBER" // Required: the new role for the member
}
```

**Response:**

```json
{
  "updatedRole": {
    "userId": "string",
    "projectId": "string",
    "role": "ADMIN | MEMBER",
    "user": {
      // ... User details
    },
    "project": {
      "id": "string",
      "name": "string",
      "org": {
        // ... Organization details
      }
    }
  }
}
```

#### Remove Project Member

> **DELETE** `/api/projects/{project}/members/{member}`

Removes a member from a project. Members can remove themselves (leave the project). Only owners and admins can remove other members. Cannot remove project owners.

**Route Parameters**:

- `project`: Project ID (required).
- `member`: Member user ID (required).

**Response:**

```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

### Project Secrets

#### Get Project Secrets

> **GET** `/api/projects/{project}/secrets`

Retrieves all secrets for a project with their decrypted values. All project members can view secrets.

**Route Parameters**:

- `project`: Project ID (required).

**Response:**

```json
{
  "decryptedSecrets": [
    {
      "id": "string",
      "key": "string",
      "description": "string | null",
      "projectId": "string",
      "createdAt": "Date",
      "updatedAt": "Date",
      "values": [
        {
          "id": "string",
          "secretId": "string",
          "environment": "DEVELOPMENT | STAGING | PRODUCTION",
          "value": "string",
          "createdAt": "Date",
          "updatedAt": "Date"
        }
      ],
      "project": {
        // ... Project details
      }
    }
  ]
}
```

#### Create Secret

> **POST** `/api/projects/{project}/secrets`

Creates a new secret in a project. Only project owners and admins can create secrets.

**Route Parameters**:

- `project`: Project ID (required).

**Request Body**:

```json
{
  "key": "string", // Required: 1-50 characters, uppercase letters, numbers, and underscores only, cannot start/end with underscore or contain consecutive underscores
  "description": "string", // Optional: max 255 characters
  "values": [ // Optional: at least 1 value if provided
    {
      "environment": "DEVELOPMENT | STAGING | PRODUCTION", // Required: environment type
      "value": "string" // Required: 1-1000 characters
    }
  ]
}
```

**Response:**

```json
{
  "id": "string",
  "key": "string",
  "description": "string | null",
  "projectId": "string",
  "createdAt": "Date",
  "updatedAt": "Date",
  "values": [
    {
      "id": "string",
      "secretId": "string",
      "environment": "DEVELOPMENT | STAGING | PRODUCTION",
      "value": "string",
      "createdAt": "Date",
      "updatedAt": "Date"
    }
  ],
  "project": {
    "id": "string",
    "name": "string",
    "org": {
      // ... Organization details
    }
  }
}
```

#### Update Secret

> **PUT** `/api/projects/{project}/secrets/{secret}`

Updates a secret's description or environment values. Only project owners and admins can update secrets.

**Route Parameters**:

- `project`: Project ID (required).
- `secret`: Secret ID (required).

**Request Body**:

```json
{
  "description": "string | null", // Optional: max 255 characters
  "values": [ // Optional: at least 1 value if provided
    {
      "environment": "DEVELOPMENT | STAGING | PRODUCTION", // Required: environment type
      "value": "string" // Required: 1-1000 characters
    }
  ]
}
```

**Response:**

```json
{
  "id": "string",
  "key": "string",
  "description": "string | null",
  "projectId": "string",
  "createdAt": "Date",
  "updatedAt": "Date",
  "values": [
    {
      "id": "string",
      "secretId": "string",
      "environment": "DEVELOPMENT | STAGING | PRODUCTION",
      "value": "string",
      "createdAt": "Date",
      "updatedAt": "Date"
    }
  ],
  "project": {
    "id": "string",
    "name": "string",
    "org": {
      // ... Organization details
    }
  }
}
```

#### Delete Secret

> **DELETE** `/api/projects/{project}/secrets/{secret}`

Permanently deletes a secret and all its environment values. Only project owners and admins can delete secrets.

**Route Parameters**:

- `project`: Project ID (required).
- `secret`: Secret ID (required).

**Response:**

```json
{
  "success": true,
  "message": "Secret deleted successfully"
}
```

#### Get Secret History

> **GET** `/api/projects/{project}/secrets/{secret}/history`

Retrieves the complete change history for a secret, including all previous decrypted values for each environment and information about who made each change. All project members can view secret history.

**Route Parameters**:

- `project`: Project ID (required).
- `secret`: Secret ID (required).

**Response:**

```json
{
  "history": [
    {
      "environment": "DEVELOPMENT | STAGING | PRODUCTION",
      "currentValue": "string",
      "history": [
        {
          "id": "string",
          "value": "string",
          "changedBy": {
            "id": "string",
            "name": "string",
            "email": "string",
            "image": "string | null"
          },
          "changedAt": "Date"
        }
      ]
    }
  ]
}
```

---
