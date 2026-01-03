# Organizations

Organizations in WindKeep are workspaces where teams can collaborate on projects and manage secrets together. Each user can be a member of multiple organizations with different roles.

---

## Understanding Organizations

### Organization Roles

- **OWNER** - Full control over the organization, projects, and members
- **ADMIN** - Can manage projects and secrets, but cannot delete the organization
- **MEMBER** - Can view and use secrets in assigned projects

### Active Organization

Your **active organization** is the context for creating new projects. When you create a project, it belongs to your active organization.

---

## Command Reference

### `windkeep orgs list`

List all organizations you are a member of, showing your role and which one is currently active.

**Example:**

```bash
windkeep orgs list
```

**Output:**

```
ID              NAME              ROLE    ACTIVE
cm123abc456     My Organization   OWNER   ✓
cm789def012     Team Workspace    ADMIN
cm456ghi789     Client Project    MEMBER
```

---

### `windkeep orgs create [NAME]`

Create a new organization. You will automatically become the owner and it will be set as your active organization.

**Arguments:**

- `NAME` - The name of the organization (required)

**Example:**

```bash
windkeep orgs create "My Company"
```

**Output:**

```
✓ Created organization 'My Company' (ID: cm123abc456)
✓ Set as active organization
```

**What Happens:**

1. A new organization is created with you as the owner
2. The organization becomes your active organization
3. Any projects you create will belong to this organization

---

### `windkeep orgs switch [ORG_ID]`

Switch to a different organization as your active organization. This clears your active project since projects belong to specific organizations.

**Arguments:**

- `ORG_ID` - The ID of the organization to switch to (required)

**Example:**

```bash
windkeep orgs switch cm789def012
```

**Output:**

```
✓ Switched to organization 'Team Workspace'
ℹ Active project cleared (projects are organization-specific)
```

> **Tip:** Use `windkeep orgs list` to see all available organization IDs.

---

### `windkeep orgs update [ORG_ID] [NAME]`

Update an organization's name. Requires OWNER or ADMIN role.

**Arguments:**

- `ORG_ID` - The ID of the organization to update (required)
- `NAME` - The new name for the organization (required)

**Example:**

```bash
windkeep orgs update cm123abc456 "New Company Name"
```

**Output:**

```
✓ Updated organization name to 'New Company Name'
```

---

## Common Workflows

### Starting with a New Organization

```bash
# Create your organization
windkeep orgs create "My Startup"

# Verify it's active
windkeep whoami

# Create your first project
windkeep projects create "Backend API"
```

---

### Switching Between Organizations

```bash
# List all organizations you belong to
windkeep orgs list

# Switch to a specific organization
windkeep orgs switch cm789def012

# List projects in this organization
windkeep projects list

# Switch to a project
windkeep projects switch my-project
```

---

### Working Across Multiple Organizations

```bash
# Check current organization
windkeep whoami

# Switch to personal organization
windkeep orgs switch cm123abc456
windkeep projects switch personal-app
windkeep run npm run dev

# Switch to work organization
windkeep orgs switch cm789def012
windkeep projects switch work-api
windkeep run --env prod npm start
```

---

### Renaming an Organization

```bash
windkeep orgs list

# Update the name
windkeep orgs update cm123abc456 "Updated Company Name"

# Verify the change
windkeep orgs list
```

---

## Related Documentation

- **[Projects](/cli-guide/projects)** - Create and manage projects within organizations
- **[Secrets Management](/cli-guide/secrets)** - Manage secrets in organization projects
- **[Guides & Troubleshooting](/cli-guide/guides)** - Common workflows and troubleshooting
