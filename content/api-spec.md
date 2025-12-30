# WindKeep API Specification

This document provides documentation for the WindKeep API.

## Overview

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod malesuada.

---

### User Profile

#### Get User Profile

> **GET** `/user`

Get the current user's profile information.

**Response:**

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "image": "string | null",
  "createdAt": "Date",
  "memberships": [
    {
      "role": "OWNER | ADMIN | MEMBER",
      "organizationId": "string",
      "organization": {
        "id": "string",
        "name": "string",
        "memberships": [
          {
            "role": "OWNER | ADMIN | MEMBER",
            "user": {
              "id": "string",
              "name": "string",
              "email": "string",
              "image": "string | null"
            }
          }
        ]
      }
    }
  ],
  "projectRoles": [
    {
      "project": {
        "id": "string",
        "name": "string",
        "organizationId": "string"
      }
    }
  ]
}
```

#### Update User Profile

> **PUT** `/user`

Update current user's profile information.

**Request Body**:

```json
{
  "name": "string", // Optional
  "image": "string", // Optional
  "activeOrgId": "string | null", // Optional, for switching active org
  "apiToken": "string" // Optional// For API token regeneration
}
```

**Response:**

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "image": "string | null",
  "activeOrgId": "string | null",
  "apiToken": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Update User Image

> **PUT** `/user/image-upload`

Update current user's profile image.

**Request Body**:

```json
{
  "file": "binary image file (PNG, JPG, or WebP, max 2MB)" // multipart/form-data
}
```

**Response:**

```json
{
  "imageUrl": "string"
}
```

#### Delete User Account

> **DELETE** `/user`

Delete current user account.

**Response:**

```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

### Organization

#### Create Organization

> **POST** `/orgs`

Create a new organization.

**Request Body**:

```json
{
  "name": "string"
}
```

**Response:**

```json
{
  "id": "string",
  "name": "string",
  "memberships": [
    {
      "role": "OWNER | ADMIN | MEMBER",
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "image": "string | null"
      }
    }
  ]
}
```

#### Get Organization Details

> **GET** `/orgs/{org}`

Retrieve details of a specific organization.

**Route Parameters**:

- `org`: Organization ID.

**Response:**

```json
{
  "id": "string",
  "name": "string",
  "memberships": [
    {
      "role": "OWNER | ADMIN | MEMBER",
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "image": "string | null"
      }
    }
  ]
}
```

#### Update Organization

> **PUT** `/orgs/{org}`

Update organization information. Only owners and admins can perform this action.

**Route Parameters**:

- `org`: Organization ID.

**Request Body**:

```json
{
  "name": "string"
}
```

**Response:**

```json
{
  "id": "string",
  "name": "string",
  "memberships": [
    {
      "role": "OWNER | ADMIN | MEMBER",
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "image": "string | null"
      }
    }
  ]
}
```

#### Delete Organization

> **DELETE** `/orgs/{org}`

Delete an organization.

**Route Parameters**:

- `org`: Organization ID.

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

> **PUT** `/orgs/{org}/members/{member}`

Update a member's role in the organization.

**Route Parameters**:

- `org`: Organization ID.
- `member`: Member ID to update.

**Request Body**:

```json
{
  "role": "OWNER | ADMIN | MEMBER"
}
```

**Response:**

```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "image": "string | null"
  },
  "organization": {
    "name": "string"
  },
  "role": "OWNER | ADMIN | MEMBER"
}
```

#### Remove Organization Member

> **DELETE** `/orgs/{org}/members/{member}`

Remove a member from the organization. Members can also remove themselves. Only organization owners can remove members.

**Route Parameters**:

- `org`: Organization ID.
- `member`: Member ID to remove.

**Response:**

```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

#### Create Organization Invite

> **POST** `/orgs/{org}/invite/create`

Create an invitation for a new organization member.

**Route Parameters**:

- `org`: Organization ID.

**Response:**

```json
{
  "invitation": {
    "id": "string",
    "organization": {
      "id": "string",
      "name": "string"
    },
    "invitedBy": {
      "id": "string",
      "name": "string",
      "email": "string"
    },
    "token": "string",
    "expiresAt": "Date"
  },
  "inviteUrl": "string"
}
```

#### Accept Organization Invite

> **POST** `/orgs/{org}/invite/accept`

Accept an invite to join an organization.

**Route Parameters**:

- `org`: Organization ID.

**Request Body**:

```json
{
  "token": "string"
}
```

**Response:**

```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "image": "string | null"
  },
  "organization": {
    "id": "string",
    "name": "string"
  },
  "role": "MEMBER"
}
```

---

### Audit

#### Get Organization Audit Logs

> **GET** `/orgs/{org}/audit`

Retrieve audit logs for an organization with optional filtering and pagination. Only owners and admins can access.

**Route Parameters**:

- `org`: Organization ID.

**Query Parameters**:

- `page` — Page number, default 1.
- `limit` — Items per page, default 20.
- `projectId` — Filter by project ID.
- `action` — Filter by action string (case-insensitive).
- `userId` — Filter by user ID.
- `startDate` — Filter logs created after this date.
- `endDate` — Filter logs created before this date.

**Response:**

```json
{
  "auditLogs": [
    {
      "id": "string",
      "action": "string",
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "image": "string | null"
      },
      "project": {
        "id": "string",
        "name": "string"
      },
      "createdAt": "Date"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "totalItems": 100,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "users": [
      { "id": "string", "name": "string", "email": "string" }
    ],
    "projects": [
      { "id": "string", "name": "string" }
    ],
    "actions": ["string"]
  }
}
```

#### Delete Organization Audit Logs

> **DELETE** `/orgs/{org}/audit`

Delete audit logs in an organization. Only owners can perform this action.

**Route Parameters**:

- `org`: Organization ID.

**Request Body**:

```json
{
  "olderThan": "Date", // Filter logs older than this date
  "projectId": "string", // Filter by project
  "userId": "string", // Filter by user
  "action": "string" // Filter by action (partial match)
}
```

**Response:**

```json
{
  "success": true,
  "message": "Deleted 10 audit log(s)",
  "deletedCount": 10
}
```

---

### Project

#### Get Projects

> **GET** `/projects`

Retrieve all projects the current user has access to.

**Response:**

```json
{
  "projects": [
    {
      "id": "string",
      "name": "string",
      "slug": "string",
      "description": "string | null",
      "organization": {
        "id": "string",
        "name": "string"
      },
      "roles": [
        {
          "role": "OWNER | ADMIN | MEMBER",
          "user": {
            "id": "string",
            "name": "string",
            "email": "string",
            "image": "string | null"
          }
        }
      ],
      "secrets": [
        {
          "id": "string",
          "name": "string",
          "type": "string",
          "createdAt": "Date"
        }
      ],
      "createdAt": "Date"
    }
  ]
}
```

#### Create Project

> **POST** `/projects`

Create a new project in an organization. Only owners and admins of the organization can create projects.

**Request Body**:

```json
{
  "name": "string",
  "slug": "string",
  "description": "string", // Optional
  "organizationId": "string"
}
```

**Response:**

```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "organization": {
    "id": "string",
    "name": "string"
  },
  "roles": [
    {
      "role": "OWNER | ADMIN | MEMBER",
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "image": "string | null"
      }
    }
  ],
  "_count": {
    "secrets": 0
  },
  "createdAt": "Date"
}
```

#### Update Project

> **PUT** `/projects/{project}`

Update project details. Only project owners and admins can perform this action.

**Route Parameters**:

- `project`: Project ID.

**Request Body**:

```json
{
  "name": "string", // Optional
  "slug": "string", // Optional
  "description": "string" // Optional
}
```

**Response:**

```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "organization": {
    "id": "string",
    "name": "string"
  },
  "updatedAt": "Date"
}
```

#### Delete Project

> **DELETE** `/projects/{project}`

Delete a project. Only project owners can delete. All secrets, secret values, roles, and audit logs are cascade deleted.

**Route Parameters**:

- `project`: Project ID.

**Response:**

```json
{
  "success": true,
  "message": "Project \"string\" deleted successfully",
  "secretsDeleted": 0
}
```

---

### Project Memberships

#### Add Project Member

> **POST** `/projects/{project}/members`

Add a new member to a project. Only project owners and admins can add members.

**Route Parameters**:

- `project`: Project ID.

**Request Body**:

```json
{
  "userId": "string",
  "role": "ADMIN | MEMBER"
}
```

**Response:**

```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "image": "string | null"
  },
  "project": {
    "id": "string",
    "name": "string"
  },
  "role": "ADMIN | MEMBER"
}
```

#### Update Project Member

> **PUT** `/projects/{project}/members/{member}`

Update the role of a project member. Owners and admins can update roles, with restrictions: non-owners cannot promote to owner or demote an owner, and members cannot update their own role.

**Route Parameters**:

- `project`: Project ID
- `member`: Member ID to update.

**Request Body**:

```json
{
  "role": "OWNER | ADMIN | MEMBER"
}
```

**Response:**

```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "image": "string | null"
  },
  "project": {
    "id": "string",
    "name": "string",
    "organizationId": "string"
  },
  "role": "OWNER | ADMIN | MEMBER"
}
```

#### Remove Project Member

> **DELETE** `/projects/{project}/members/{member}`

Remove a member from a project. Members can remove themselves, but the last owner cannot leave the project. Only owners can remove other owners.

**Route Parameters**:

- `project`: Project ID.
- `member`: Member ID to remove.

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

> **GET** `/projects/{project}/secrets`

Get secrets for a project.

**Route Parameters**:

- `project`: Project ID.

**Response:**

```json
[
  {
    "id": "string",
    "key": "string",
    "description": "string | null",
    "project": {
      "id": "string",
      "name": "string",
      "organizationId": "string"
    },
    "values": [
      {
        "id": "string",
        "environment": "string",
        "value": "string"
      }
    ],
    "createdAt": "Date"
  }
]
```

#### Create Secret

> **POST** `/projects/{project}/secrets`

Create a new secret in a project. Only project owners or admins can perform this action.

**Route Parameters**:

- `project`: Project ID.

**Request Body**:

```json
{
  "key": "string",
  "description": "string", // Optional
  "values": [
    {
      "environment": "string",
      "value": "string"
    }
  ] // Optional
}
```

**Response:**

```json
{
  "id": "string",
  "key": "string",
  "description": "string | null",
  "project": {
    "id": "string",
    "name": "string",
    "organizationId": "string"
  },
  "values": [
    {
      "id": "string",
      "environment": "string",
      "value": "string"
    }
  ],
  "createdAt": "Date"
}
```

#### Update Secret

> **PUT** `/projects/{project}/secrets/{secret}`

Update a secret's description or its environment values. Only project owners or admins can perform this action.

**Route Parameters**:

- `project`: Project ID.
- `secret`: Secret ID to update.

**Request Body**:

```json
{
  "description": "string", // Optional
  "values": [
    {
      "environment": "string",
      "value": "string"
    }
  ] // Optional
}
```

**Response:**

```json
{
  "id": "string",
  "key": "string",
  "description": "string | null",
  "project": {
    "id": "string",
    "name": "string",
    "organizationId": "string"
  },
  "values": [
    {
      "id": "string",
      "environment": "string",
      "value": "string"
    }
  ],
  "updatedAt": "Date"
}
```

#### Delete Secret

> **DELETE** `/projects/{project}/secrets/{secret}`

Delete a secret. Only project owners can perform this action.

**Route Parameters**:

- `project`: Project ID.
- `secret`: Secret ID to delete.

**Response:**

```json
{
  "success": true,
  "message": "Secret \"string\" deleted successfully",
  "valuesDeleted": 0
}
```

---
