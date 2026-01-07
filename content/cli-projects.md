# Projects

Projects in WindKeep are containers for your secrets. Each project belongs to an organization and can have multiple secrets across different environments (development, staging, production).

---

## Understanding Projects

### Project Structure

- **Name** - Human-readable project name (e.g., "Backend API")
- **Slug** - URL-friendly identifier (e.g., "backend-api")
- **Description** - Optional description of the project
- **Organization** - The organization the project belongs to
- **Secrets** - Environment variables stored in the project

### Active Project

Your **active project** is the default context for secret commands. When you run secret commands, they operate on your active project by default. This behavior can be overridden by specifying a different project slug via flags.

---

## Command Reference

### `windkeep projects list`

List all projects you have access to across all organizations.

**Example:**

```bash
windkeep projects list
```

**Output:**

```
ID              NAME            SLUG           ORGANIZATION      SECRETS
cm111aaa111     My Project      my-project     My Organization   5
cm222bbb222     API Service     api-service    Team Workspace    12
cm333ccc333     Frontend App    frontend-app   My Organization   8
```

---

### `windkeep projects create [NAME]`

Create a new project in your active organization. The slug is automatically generated from the name.

**Arguments:**

- `NAME` - The name of the project (required)

**Flags:**

- `-d, --description` - Project description (optional)

**Examples:**

```bash
# Create a basic project
windkeep projects create "My Project"
# Creates project with slug: my-project

# Create with description
windkeep projects create "API Service" -d "Backend API for mobile app"
# Creates project with slug: api-service

# Create with multi-word name
windkeep projects create "E-Commerce Platform"
# Creates project with slug: e-commerce-platform
```

---

### `windkeep projects switch [PROJECT_SLUG]`

Set a project as your active project for future commands.

**Arguments:**

- `PROJECT_SLUG` - The slug of the project to switch to (required)

**Example:**

```bash
windkeep projects switch api-service
```

**Output:**

```
✓ Switched to project 'API Service' (slug: api-service)
```

> **Tip:** Use `windkeep projects list` to see all available projects.

---

### `windkeep projects update [PROJECT_SLUG]`

Update a project's details. You can update the name, slug, or description.

**Arguments:**

- `PROJECT_SLUG` - The slug of the project to update (required)

**Flags:**

- `-n, --name` - New project name (optional)
- `-s, --slug` - New project slug (optional)
- `-d, --description` - New project description (optional)

**Examples:**

```bash
# Update project name
windkeep projects update my-project --name "Updated Project Name"

# Update slug
windkeep projects update my-project --slug new-project-slug

# Update description
windkeep projects update my-project --description "New project description"

# Update multiple fields at once
windkeep projects update my-project \
  --name "API Service v2" \
  --slug api-service-v2 \
  --description "Updated backend API"
```

---

### `windkeep projects delete [PROJECT_SLUG] --confirm`

Delete a project and all its secrets. **This action cannot be undone.**

**Arguments:**

- `PROJECT_SLUG` - The slug of the project to delete (required)

**Flags:**

- `--confirm` - Required flag to confirm deletion (required)

**Example:**

```bash
windkeep projects delete old-project --confirm
```

---

## Common Workflows

### Creating Your First Project

```bash
# Make sure you're in the right organization
windkeep whoami

# Create the project
windkeep projects create "My App" -d "My awesome application"

# Verify it was created
windkeep projects list

# Start adding secrets
windkeep secrets create DATABASE_URL --dev "postgres://localhost:5432/dev"
```

---

### Organizing Multiple Projects

```bash
# Create projects for different environments
windkeep projects create "My App - Development" -d "Dev environment"
windkeep projects create "My App - Staging" -d "Staging environment"
windkeep projects create "My App - Production" -d "Production environment"

# Or create projects for different services
windkeep projects create "Backend API" -d "REST API service"
windkeep projects create "Frontend Web" -d "React web application"
windkeep projects create "Mobile App" -d "React Native mobile app"
```

---

### Switching Between Projects

```bash
# List all projects
windkeep projects list

# Switch to backend project
windkeep projects switch backend-api

# Work with backend secrets
windkeep secrets list
windkeep run npm run dev

# Switch to frontend project
windkeep projects switch frontend-web

# Work with frontend secrets
windkeep secrets list
windkeep run npm start
```

---

### Renaming a Project

```bash
# Update project name and slug
windkeep projects update my-project \
  --name "New Project Name" \
  --slug new-project-slug

# Verify the change
windkeep projects list

# Switch using the new slug
windkeep projects switch new-project-slug
```

---

### Migrating Projects Between Organizations

> **Note:** Projects cannot be moved between organizations via CLI. To migrate a project:

1. Export secrets from the old project (via web dashboard or CLI)
2. Create a new project in the target organization
3. Import secrets to the new project
4. Delete the old project when migration is complete

**Example:**

```bash
# In old organization
windkeep orgs switch cm123old
windkeep projects switch old-project
# Export secrets via web dashboard

# In new organization
windkeep orgs switch cm456new
windkeep projects create "Migrated Project"
# Import secrets via web dashboard

# Clean up old project
windkeep orgs switch cm123old
windkeep projects delete old-project --confirm
```

---

## Related Documentation

- **[Organizations](/cli-guide/organizations)** - Manage organizations and their projects
- **[Secrets Management](/cli-guide/secrets)** - Manage secrets within projects
- **[Guides & Troubleshooting](/cli-guide/guides)** - Common workflows and troubleshooting
