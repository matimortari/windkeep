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

1. Sign in to WindKeep at https://windkeep.up.railway.app
2. Navigate to Admin → Preferences
3. Copy your API token from the dashboard
4. Authenticate using the CLI:

```bash
windkeep login YOUR_API_TOKEN
```

This will validate your token and save your configuration. The CLI stores its configuration in `~/.windkeep/config.yaml`:

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

---

### Organizations

#### `windkeep orgs list`

List all organizations you are a member of.

**Example:**

```bash
windkeep orgs list
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

#### `windkeep orgs update [NAME]`

Update the active organization's name.

**Example:**

```bash
windkeep orgs update "New Organization Name"
```

---

### Projects

#### `windkeep projects list`

List all projects you have access to across all organizations.

**Example:**

```bash
windkeep projects list
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

#### `windkeep secrets get [KEY]`

Retrieve all environment values for a specific secret.

**Example:**

```bash
windkeep secrets get DATABASE_URL
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

Update values for an existing secret. Only specified environments will be updated. You can also update the description independently.

**Flags:**

- `-d, --description`: Update the secret's description
- `--dev`: Value for DEVELOPMENT environment
- `--staging`: Value for STAGING environment
- `--prod`: Value for PRODUCTION environment

**Examples:**

```bash
# Update only production value
windkeep secrets set DATABASE_URL --prod "postgres://new-prod-db:5432/app"

# Update description only
windkeep secrets set JWT_SECRET -d "Rotated signing secret"

# Update description and a value together
windkeep secrets set DATABASE_URL \
  -d "Primary database" \
  --prod "postgres://new-prod-db:5432/app"

# Update multiple environments
windkeep secrets set API_KEY \
  --staging "sk_test_xyz789" \
  --prod "sk_live_xyz789"
```

#### `windkeep secrets history [KEY]`

Show the full change history for a secret across all environments, including who made each change and when.

**Flags:**

- `-e, --env`: Filter by environment (dev/staging/prod)

**Examples:**

```bash
# Show full history
windkeep secrets history DATABASE_URL

# Show only production history
windkeep secrets history API_KEY -e prod
```

#### `windkeep secrets delete [KEY]`

Delete a secret and all its values. This action cannot be undone.

**Flags:**

- `--confirm`: Skip confirmation prompt

**Example:**

```bash
windkeep secrets delete OLD_API_KEY --confirm
```

---

### Pull & Push

#### `windkeep pull [OUTPUT_FILE]`

Pull secrets from your active project and save to a local file.

**Flags:**

- `-e, --env`: Environment to pull (default: development)
- `-p, --project`: Project slug (overrides active project)

**Examples:**

```bash
# Pull to .env
windkeep pull

# Pull production to custom file
windkeep pull prod.env -e production

# Pull from a specific project without switching context
windkeep pull -p api-service -e staging .env.staging
```

#### `windkeep push [INPUT_FILE]`

Push secrets from a local file to your active project.

**Flags:**

- `-e, --env`: Environment to push to (default: development)
- `--overwrite`: Update secrets that already exist (default: skip existing)

**Examples:**

```bash
# Push from .env
windkeep push

# Push to production
windkeep push prod.env -e production

# Push and overwrite existing secrets
windkeep push --overwrite
```

**Security Note:** Pulled files contain plaintext secrets. Store them securely and never commit them to version control.

---

### Running Commands with Injected Secrets

#### `windkeep run [command] [args...]`

Run a command with environment variables injected from your active project's secrets. This eliminates the need for a `.env` file by fetching secrets directly from WindKeep.

**Flags:**

- `-e, --env`: Environment to use (default: development)
- `-p, --project`: Project slug (overrides active project)
- `-v, --verbose`: Show injected secret keys before running (inherited from global flag)

**Examples:**

```bash
# Run with development secrets
windkeep run npm run dev

# Run with production secrets
windkeep run -e prod node server.js

# Show which secrets are injected
windkeep run -v npm start

# Use a different project without switching context
windkeep run -p api-service -e staging npm test
```
