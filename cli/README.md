# WindKeep CLI

Command-line interface for managing secrets, organizations, and projects in WindKeep.

## Installation

### Prerequisites

- Go 1.21 or higher
- A WindKeep account with an API token

### From Source

1. Clone the repository:

```bash
git clone https://github.com/matimortari/windkeep.git
cd windkeep/cli
```

2. Install dependencies:

```bash
go mod download
```

3. Build the CLI:

```bash
go build -o windkeep
```

4. (Optional) Install globally:

**Linux/macOS:**

```bash
sudo mv windkeep /usr/local/bin/
```

**Windows (PowerShell as Administrator):**

```powershell
Move-Item windkeep.exe C:\Windows\System32\windkeep.exe
```

## Getting Started

### 1. Get Your API Token

1. Sign in to WindKeep at https://windkeep.vercel.app
2. Navigate to Admin → Preferences
3. Copy your API token from the dashboard

### 2. Login

```bash
windkeep login YOUR_API_TOKEN
```

This will:

- Validate your token
- Save your configuration to `~/.windkeep/config.yaml`
- Display your authenticated user information

### 3. Create or Switch to an Organization

```bash
# Create a new organization
windkeep orgs create "My Organization"

# Or list and switch to an existing one
windkeep orgs list
windkeep orgs switch <ORG_ID>
```

### 4. Create or Switch to a Project

```bash
# Create a new project
windkeep projects create "My Project" -d "Project description"

# Or list and switch to an existing one
windkeep projects list
windkeep projects switch my-project
```

### 5. Manage Secrets

```bash
# Create a secret with values for different environments
windkeep secrets create DATABASE_URL \
  --description "Database connection string" \
  --dev "postgres://localhost:5432/dev" \
  --staging "postgres://staging-db:5432/app" \
  --prod "postgres://prod-db:5432/app"

# List all secrets
windkeep secrets list

# View a specific secret
windkeep secrets get DATABASE_URL

# Update secret values
windkeep secrets set DATABASE_URL --prod "postgres://new-prod-db:5432/app"

# Delete a secret (requires confirmation)
windkeep secrets delete DATABASE_URL --confirm
```

## Configuration

The CLI stores its configuration in `~/.windkeep/config.yaml`:

```yaml
api_token: your-api-token
active_org_id: org-id
active_org_name: My Organization
active_project_slug: my-project
active_project_name: My Project
```

## Command Reference

### Authentication

#### `windkeep login [API_TOKEN]`

Authenticate with WindKeep using your API token.

**Example:**

```bash
windkeep login a1b2c3d4e5f6g7h8
```

#### `windkeep logout`

Remove stored authentication credentials.

**Example:**

```bash
windkeep logout
```

#### `windkeep whoami`

Display current user and configuration information.

**Example:**

```bash
windkeep whoami
```

**Output:**

```
=== User Information ===
Name:  John Doe
Email: john@example.com
API Token: a1b2c3d4e5f6g7h8

=== Active Configuration ===
Organization: My Organization (ID: cm123abc456)
Project:      My Project (slug: my-project)

=== Configuration File ===
Location: /home/user/.windkeep/config.yaml

api_token: a1b2c3d4e5f6g7h8
active_org_id: cm123abc456
active_org_name: My Organization
active_project_slug: my-project
active_project_name: My Project
```

---

### Organizations

#### `windkeep orgs list`

List all organizations you are a member of.

**Example:**

```bash
windkeep orgs list
```

**Output:**

```
ID              NAME              ROLE    ACTIVE
cm123abc456     My Organization   OWNER   ✓
cm789def012     Team Workspace    ADMIN
```

#### `windkeep orgs create [NAME]`

Create a new organization. You will be set as the owner and it will become your active organization.

**Example:**

```bash
windkeep orgs create "My New Organization"
```

#### `windkeep orgs switch [ORG_ID]`

Set the active organization for future commands. This will clear your active project.

**Example:**

```bash
windkeep orgs switch cm123abc456
```

#### `windkeep orgs update [ORG_ID] [NAME]`

Update an organization's name.

**Example:**

```bash
windkeep orgs update cm123abc456 "New Organization Name"
```

---

### Projects

#### `windkeep projects list`

List all projects you have access to across all organizations.

**Example:**

```bash
windkeep projects list
```

**Output:**

```
ID              NAME          SLUG         ORGANIZATION      SECRETS
cm111aaa111     My Project    my-project   My Organization   5
cm222bbb222     API Service   api-service  Team Workspace    12
```

#### `windkeep projects create [NAME]`

Create a new project in your active organization. The slug is automatically generated from the name.

**Flags:**

- `-d, --description`: Project description

**Examples:**

```bash
# Create a project (slug auto-generated)
windkeep projects create "My Project"
# Creates project with slug: my-project

windkeep projects create "API Service" -d "Backend API for mobile app"
# Creates project with slug: api-service
```

#### `windkeep projects switch [PROJECT_SLUG]`

Set the active project for future commands.

**Example:**

```bash
windkeep projects switch my-project
```

#### `windkeep projects update [PROJECT_SLUG]`

Update a project's details.

**Flags:**

- `-n, --name`: New project name
- `-s, --slug`: New project slug
- `-d, --description`: New project description

**Examples:**

```bash
windkeep projects update my-project --name "Updated Project Name"
windkeep projects update my-project --slug new-slug --description "New description"
```

#### `windkeep projects delete [PROJECT_SLUG] --confirm`

Delete a project and all its secrets. This action cannot be undone.

**Example:**

```bash
windkeep projects delete my-project --confirm
```

---

### Secrets

All secret commands require an active project. Use `windkeep projects switch` first.

#### `windkeep secrets list`

List all secrets in your active project.

**Example:**

```bash
windkeep secrets list
```

**Output:**

```
KEY            ENVIRONMENTS                      DESCRIPTION
DATABASE_URL   DEVELOPMENT, STAGING, PRODUCTION  Database connection string
API_KEY        PRODUCTION                        Third-party API key
```

#### `windkeep secrets get [KEY]`

Retrieve all environment values for a specific secret.

**Example:**

```bash
windkeep secrets get DATABASE_URL
```

**Output:**

```
Key: DATABASE_URL
Description: Database connection string

Values:
ENVIRONMENT   VALUE
DEVELOPMENT   postgres://localhost:5432/dev
STAGING       postgres://staging-db:5432/app
PRODUCTION    postgres://prod-db:5432/app
```

#### `windkeep secrets create [KEY]`

Create a new secret in your active project.

**Flags:**

- `-d, --description`: Secret description
- `--dev`: Value for DEVELOPMENT environment
- `--staging`: Value for STAGING environment
- `--prod`: Value for PRODUCTION environment

**Examples:**

```bash
# Create a secret with all environments
windkeep secrets create DATABASE_URL \
  --description "Database connection string" \
  --dev "postgres://localhost:5432/dev" \
  --staging "postgres://staging-db:5432/app" \
  --prod "postgres://prod-db:5432/app"

# Create a secret with only production value
windkeep secrets create API_KEY \
  --prod "sk_live_abc123def456"

# Create a secret without values (to be set later)
windkeep secrets create SMTP_PASSWORD \
  --description "Email service password"
```

#### `windkeep secrets set [KEY]`

Update values for an existing secret. Only specified environments will be updated.

**Flags:**

- `--dev`: Value for DEVELOPMENT environment
- `--staging`: Value for STAGING environment
- `--prod`: Value for PRODUCTION environment

**Examples:**

```bash
# Update only production value
windkeep secrets set DATABASE_URL --prod "postgres://new-prod-db:5432/app"

# Update multiple environments
windkeep secrets set API_KEY \
  --staging "sk_test_xyz789" \
  --prod "sk_live_xyz789"
```

#### `windkeep secrets delete [KEY] --confirm`

Delete a secret and all its values. This action cannot be undone.

**Example:**

```bash
windkeep secrets delete OLD_API_KEY --confirm
```

---

## Development

### Building for Multiple Platforms

```bash
# Linux (64-bit)
GOOS=linux GOARCH=amd64 go build -o windkeep-linux-amd64

# macOS (Intel)
GOOS=darwin GOARCH=amd64 go build -o windkeep-darwin-amd64

# macOS (Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o windkeep-darwin-arm64

# Windows (64-bit)
GOOS=windows GOARCH=amd64 go build -o windkeep-windows-amd64.exe
```

## Troubleshooting

### "Config file not found" error

**Solution:** You need to login first:

```bash
windkeep login YOUR_API_TOKEN
```

### "Not authenticated" error

**Solution:** Your API token may have expired or been regenerated. Login again:

```bash
windkeep logout
windkeep login YOUR_NEW_API_TOKEN
```

### "No active organization/project" error

**Solution:** Switch to an organization/project:

```bash
windkeep orgs list
windkeep orgs switch <ORG_ID>

windkeep projects list
windkeep projects switch <PROJECT_ID>
```

---

## Contact

Feel free to reach out to discuss collaboration opportunities or to say hello!

- [**My Email**](mailto:matheus.felipe.19rt@gmail.com)
- [**My LinkedIn Profile**](https://www.linkedin.com/in/matheus-mortari-19rt)
- [**My GitHub Profile**](https://github.com/matimortari)

## License

This project is licensed under the [**MIT License**](../LICENSE).
