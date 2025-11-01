# SecretkeepR API Specification

This document provides documentation for the SecretkeepR API.

## Overview

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod malesuada.

### Response Format

All responses follow a consistent JSON format:

#### Success Response

```json
{
  "data": "response_data"
}
```

#### Error Response

```json
{
  "statusCode": 400,
  "message": "Error message"
}
```

#### Error Codes

- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict
- **500 Internal Server Error**: Server error

---

## Endpoints

### Authentication

Most endpoints require authentication via session cookies. Authentication is handled through OAuth providers.

#### Sign In With Google

**GET** `/auth/google`

Initiates Google OAuth authentication flow.

**Response:**

- Redirects to Google OAuth consent screen
- On success, redirects to application with session cookie

#### Sign In With GitHub

**GET** `/auth/github`

Initiates GitHub OAuth authentication flow.

**Response:**

- Redirects to GitHub OAuth consent screen
- On success, redirects to application with session cookie

#### Sign In With GitLab

**GET** `/auth/gitlab`

Initiates GitLab OAuth authentication flow.

**Response:**

- Redirects to GitLab OAuth consent screen
- On success, redirects to application with session cookie

---

### User Management

#### Get User Profile

**GET** `/user`

Get current user information with organizations and active organization details.

**Response**:

```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "image": "string",
    "activeOrgId": "string",
    "apiToken": "string",
    "createdAt": "datetime"
  },
  "organizations": [
    {
      "id": "string",
      "name": "string",
      "role": "owner|admin|member"
    }
  ],
  "activeOrg": {
    "id": "string",
    "name": "string",
    "role": "owner|admin|member",
    "projects": [
      {
        "id": "string",
        "name": "string",
        "slug": "string"
      }
    ]
  }
}
```

#### Update User Profile

**PUT** `/user`

Update current user information.

**Request Body**:

```json
{
  "name": "string (optional, 2-100 chars)",
  "email": "string (optional, valid email)",
  "activeOrgId": "string (optional, CUID)"
}
```

**Response**:

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "activeOrgId": "string"
}
```

#### Delete User Account

**DELETE** `/user`

Delete current user account.

**Response**: `204 No Content`

---

### Organization Management

#### Create Organization

**POST** `/org`

Create a new organization.

**Request Body**:

```json
{
  "name": "string (2-100 chars)"
}
```

**Response**:

```json
{
  "id": "string",
  "name": "string",
  "role": "owner",
  "createdAt": "datetime"
}
```

#### Update Organization

**PUT** `/org/{orgId}`

Update organization information.

**Parameters**:

- `orgId` (path): Organization ID

**Request Body**:

```json
{
  "name": "string (optional, 2-100 chars)"
}
```

**Response**:

```json
{
  "id": "string",
  "name": "string",
  "updatedAt": "datetime"
}
```

#### Delete Organization

**DELETE** `/org/{orgId}`

Delete an organization.

**Parameters**:

- `orgId` (path): Organization ID

**Response**: `204 No Content`

---

### Organization Members

#### Create Organization Invitation

**POST** `/org/{orgId}/invite/create`

Create an invitation for a new organization member.

**Parameters**:

- `orgId` (path): Organization ID

**Request Body**:

```json
{
  "email": "string (valid email)",
  "role": "owner|admin|member"
}
```

**Response**:

```json
{
  "token": "string",
  "email": "string",
  "role": "string",
  "expiresAt": "datetime"
}
```

#### Accept Organization Invitation

**POST** `/org/{orgId}/invite/accept`

Accept an organization invitation.

**Parameters**:

- `orgId` (path): Organization ID

**Request Body**:

```json
{
  "token": "string (UUID)"
}
```

**Response**:

```json
{
  "organization": {
    "id": "string",
    "name": "string"
  },
  "role": "string"
}
```

#### Update Organization Member Role

**PUT** `/org/{orgId}/members/{memberId}`

Update organization member role.

**Parameters**:

- `orgId` (path): Organization ID
- `memberId` (path): Member ID

**Request Body**:

```json
{
  "role": "owner|admin|member"
}
```

**Response**:

```json
{
  "id": "string",
  "role": "string",
  "updatedAt": "datetime"
}
```

#### Remove Organization Member

**DELETE** `/org/{orgId}/members/{memberId}`

Remove a member from the organization.

**Parameters**:

- `orgId` (path): Organization ID
- `memberId` (path): Member ID

**Response**: `204 No Content`

---

### Audit Logs

#### Get Organization Audit Logs

**GET** `/org/{orgId}/audit`

Get organization audit logs with filtering and pagination.

**Parameters**:

- `orgId` (path): Organization ID

**Query Parameters**:

- `page`: number (default: 1, min: 1)
- `limit`: number (default: 20, min: 1, max: 100)
- `action`: string (optional)
- `resource`: string (optional)
- `userId`: string (optional)
- `startDate`: ISO datetime (optional)
- `endDate`: ISO datetime (optional)

**Response**:

```json
{
  "logs": [
    {
      "id": "string",
      "action": "string",
      "resource": "string",
      "userId": "string",
      "userName": "string",
      "metadata": "object",
      "ipAddress": "string",
      "userAgent": "string",
      "createdAt": "datetime"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

#### Get Organization Audit Log Filters

**GET** `/org/{orgId}/audit/filters`

Get available filter values for audit logs.

**Parameters**:

- `orgId` (path): Organization ID

**Response**:

```json
{
  "actions": ["string"],
  "resources": ["string"],
  "users": [
    {
      "id": "string",
      "name": "string"
    }
  ]
}
```

#### Delete Organization Audit Logs

**DELETE** `/org/{orgId}/audit`

Delete audit logs based on criteria.

**Parameters**:

- `orgId` (path): Organization ID

**Request Body**:

```json
{
  "olderThan": "ISO datetime (optional)",
  "action": "string (optional)",
  "resource": "string (optional)",
  "userId": "string (optional)"
}
```

**Response**: `204 No Content`

---

### Project Management

#### Get Projects

**GET** `/projects`

Get projects accessible to the current user.

**Query Parameters**:

- `orgId`: string (optional) - Filter by organization ID

**Response**:

```json
{
  "projects": [
    {
      "id": "string",
      "name": "string",
      "slug": "string",
      "description": "string",
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "orgId": "string",
      "organization": {
        "id": "string",
        "name": "string"
      },
      "members": [
        {
          "user": {
            "id": "string",
            "name": "string",
            "email": "string",
            "image": "string"
          },
          "role": "owner|admin|member"
        }
      ]
    }
  ]
}
```

#### Create Project

**POST** `/projects`

Create a new project.

**Request Body**:

```json
{
  "name": "string (2-100 chars)",
  "slug": "string (optional, lowercase alphanumeric with hyphens)",
  "description": "string (optional)"
}
```

**Response**:

```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "description": "string",
  "createdAt": "datetime"
}
```

#### Update Project

**PUT** `/projects/{projectId}`

Update project information.

**Parameters**:

- `projectId` (path): Project ID

**Request Body**:

```json
{
  "name": "string (optional, 2-100 chars)",
  "description": "string (optional)"
}
```

**Response**:

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "updatedAt": "datetime"
}
```

#### Delete Project

**DELETE** `/projects/{projectId}`

Delete a project.

**Parameters**:

- `projectId` (path): Project ID

**Response**: `204 No Content`

---

### Project Members

#### Add Project Member

**POST** `/projects/{projectId}/members`

Add a member to the project.

**Parameters**:

- `projectId` (path): Project ID

**Request Body**:

```json
{
  "email": "string (valid email)",
  "role": "owner|admin|member"
}
```

**Response**:

```json
{
  "id": "string",
  "email": "string",
  "role": "string"
}
```

#### Update Project Member

**PUT** `/projects/{projectId}/members/{memberId}`

Update project member role.

**Parameters**:

- `projectId` (path): Project ID
- `memberId` (path): Member ID

**Request Body**:

```json
{
  "role": "owner|admin|member"
}
```

**Response**:

```json
{
  "id": "string",
  "role": "string",
  "updatedAt": "datetime"
}
```

#### Remove Project Member

**DELETE** `/projects/{projectId}/members/{memberId}`

Remove a member from the project.

**Parameters**:

- `projectId` (path): Project ID
- `memberId` (path): Member ID

**Response**: `204 No Content`

---

### Secret Management

#### Get Project Secrets

**GET** `/projects/{projectId}/secrets`

Get secrets for a project.

**Parameters**:

- `projectId` (path): Project ID

**Query Parameters**:

- `environment`: string (optional) - Filter by environment (development|staging|production)

**Response**:

```json
{
  "secrets": [
    {
      "id": "string",
      "key": "string",
      "description": "string",
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "values": [
        {
          "environment": "development|staging|production",
          "value": "string",
          "createdAt": "datetime",
          "updatedAt": "datetime"
        }
      ]
    }
  ]
}
```

#### Create Secret

**POST** `/projects/{projectId}/secrets`

Create a new secret.

**Parameters**:

- `projectId` (path): Project ID

**Request Body**:

```json
{
  "key": "string (required)",
  "description": "string (optional)",
  "values": [
    {
      "environment": "development|staging|production",
      "value": "string (required)"
    }
  ]
}
```

**Response**:

```json
{
  "id": "string",
  "key": "string",
  "description": "string",
  "createdAt": "datetime"
}
```

#### Update Secret

**PUT** `/projects/{projectId}/secrets/{secretId}`

Update an existing secret.

**Parameters**:

- `projectId` (path): Project ID
- `secretId` (path): Secret ID

**Request Body**:

```json
{
  "description": "string (optional)",
  "values": [
    {
      "environment": "development|staging|production",
      "value": "string (required)"
    }
  ]
}
```

**Response**:

```json
{
  "id": "string",
  "description": "string",
  "updatedAt": "datetime"
}
```

#### Delete Secret

**DELETE** `/projects/{projectId}/secrets/{secretId}`

Delete a secret.

**Parameters**:

- `projectId` (path): Project ID
- `secretId` (path): Secret ID

**Response**: `204 No Content`

---
