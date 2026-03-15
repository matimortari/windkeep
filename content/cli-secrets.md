# Secrets Management

Secrets are environment variables stored securely in WindKeep. Each secret can have different values across multiple environments (development, staging, production), allowing you to manage all your configuration in one place.

---

## Understanding Secrets

### What Are Secrets?

Secrets are sensitive configuration values like:

- Database connection strings
- API keys and tokens
- OAuth credentials
- Email service passwords
- Encryption keys

### Environments

Each secret can have different values for different environments:

- **DEVELOPMENT** - Local development values
- **STAGING** - Testing/QA environment values
- **PRODUCTION** - Live production values

### Active Project Requirement

> **Important:** All secret commands require an active project. Use `windkeep projects switch` to set your active project first.

---

## Command Reference

### `windkeep secrets list`

List all secrets in your active project, showing which environments have values.

**Example:**

```bash
windkeep secrets list
```

**Output:**

```
KEY              ENVIRONMENTS                      DESCRIPTION           UPDATED
DATABASE_URL     DEVELOPMENT, STAGING, PRODUCTION  Database connection    2d ago
API_KEY          PRODUCTION                        Third-party API key   5m ago
SMTP_PASSWORD    DEVELOPMENT, PRODUCTION           Email service         Jan 3, 2025
```

---

### `windkeep secrets get [KEY]`

Retrieve all environment values for a specific secret. This shows you the actual secret values.

**Arguments:**

- `KEY` - The secret key name (required)

**Example:**

```bash
windkeep secrets get DATABASE_URL
```

**Output:**

```
Key:     DATABASE_URL
Desc:    Database connection string
Updated: 2d ago

ENVIRONMENT   VALUE
DEVELOPMENT   postgres://localhost:5432/dev
STAGING       postgres://staging-db:5432/app
PRODUCTION    postgres://prod-db:5432/app
```

---

### `windkeep secrets create [KEY]`

Create a new secret in your active project. You can set values for one or more environments.

**Arguments:**

- `KEY` - The secret key name (required, uppercase recommended)

**Flags:**

- `-d, --description` - Secret description (optional)
- `--dev` - Value for DEVELOPMENT environment (optional)
- `--staging` - Value for STAGING environment (optional)
- `--prod` - Value for PRODUCTION environment (optional)

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
  --description "Third-party API key" \
  --prod "sk_live_abc123def456"

# Create a secret placeholder (values can be set later)
windkeep secrets create SMTP_PASSWORD \
  --description "Email service password"

# Create a development-only secret
windkeep secrets create DEBUG_MODE \
  --description "Enable debug logging" \
  --dev "true"

# Create with staging and production (no dev)
windkeep secrets create ANALYTICS_KEY \
  --staging "sk_test_xyz789" \
  --prod "sk_live_xyz789"
```

**Output:**

```
✓ Created 'DATABASE_URL'
• Set value for DEVELOPMENT
• Set value for STAGING
• Set value for PRODUCTION
```

---

### `windkeep secrets set [KEY]`

Update values for an existing secret. Only specified environments will be updated; other environments remain unchanged. You can also update the description independently.

**Arguments:**

- `KEY` - The secret key name (required)

**Flags:**

- `-d, --description` - Update the secret's description (optional)
- `--dev` - Value for DEVELOPMENT environment (optional)
- `--staging` - Value for STAGING environment (optional)
- `--prod` - Value for PRODUCTION environment (optional)

At least one flag must be provided.

**Examples:**

```bash
# Update only production value
windkeep secrets set DATABASE_URL \
  --prod "postgres://new-prod-db:5432/app"

# Update multiple environments at once
windkeep secrets set API_KEY \
  --staging "sk_test_xyz789" \
  --prod "sk_live_xyz789"

# Update description only
windkeep secrets set JWT_SECRET -d "Rotated signing secret"

# Update description and a value together
windkeep secrets set DATABASE_URL \
  -d "Primary database connection" \
  --prod "postgres://new-prod-db:5432/app"

# Update all environments
windkeep secrets set JWT_SECRET \
  --dev "dev_secret_key_123" \
  --staging "staging_secret_key_456" \
  --prod "prod_secret_key_789"
```

**Output:**

```
✓ Updated 'DATABASE_URL'
• Updated value for PRODUCTION
```

---

### `windkeep secrets history [KEY]`

Show the full change history for a secret across all environments, including who made each change and when.

**Arguments:**

- `KEY` - The secret key name (required)

**Flags:**

- `-e, --env` - Filter history by environment (dev/staging/prod) (optional)

**Examples:**

```bash
# Show full history across all environments
windkeep secrets history DATABASE_URL

# Show only production history
windkeep secrets history API_KEY -e prod
```

**Output:**

```
History for: DATABASE_URL

[PRODUCTION]  current: postgres://prod-db:5432/app
VALUE                              CHANGED BY     WHEN
postgres://old-prod-db:5432/app    Alice Smith    3d ago
postgres://legacy-db:5432/app      Bob Jones      Jan 10, 2025

[DEVELOPMENT]  current: postgres://localhost:5432/dev
No previous changes
```

---

### `windkeep secrets delete [KEY]`

Delete a secret and all its values across all environments. **This action cannot be undone.**

**Arguments:**

- `KEY` - The secret key name (required)

**Flags:**

- `--confirm` - Skip confirmation prompt (optional)

**Example:**

```bash
# With interactive confirmation
windkeep secrets delete OLD_API_KEY

# Skip confirmation prompt
windkeep secrets delete OLD_API_KEY --confirm
```

---

## Running Commands with Secrets

### `windkeep run [command] [args...]`

Run any command with environment variables automatically injected from your active project's secrets. This eliminates the need for `.env` files.

**Flags:**

- `-e, --env` - Environment to use (dev/development, staging, prod/production) - default: development
- `-p, --project` - Project slug to use (overrides active project)
- `-v, --verbose` - Show injected secret keys before running (global flag)

**How It Works:**

1. Fetches all secrets from your active project
2. Filters secrets for the specified environment
3. Injects them as environment variables
4. Runs your command with those variables available

**Examples:**

```bash
# Run a Node.js app with development secrets
windkeep run npm run dev

# Run a Python script with production secrets
windkeep run --env prod python app.py

# Run with staging secrets
windkeep run -e staging node server.js

# Show which secret keys are being injected
windkeep run -v npm start

# Override active project temporarily
windkeep run --project my-other-project npm run dev

# Combine flags: specific project with production environment
windkeep run -p api-service -e prod npm start

# Run tests with staging data
windkeep run -e staging npm test

# Run database migrations with production credentials
windkeep run -e prod npm run migrate
```

> **Tip:** `--verbose` (`-v`) is a global flag available on all commands. On `run`, it shows the secret keys being injected — but never their values.

---

## Common Workflows

### Setting Up Secrets for a New Project

```bash
# Switch to your project
windkeep projects switch my-app

# Add database credentials
windkeep secrets create DATABASE_URL \
  --description "PostgreSQL connection string" \
  --dev "postgres://localhost:5432/myapp_dev" \
  --staging "postgres://staging-db:5432/myapp" \
  --prod "postgres://prod-db:5432/myapp"

# Add API keys
windkeep secrets create STRIPE_KEY \
  --description "Stripe payment API key" \
  --dev "sk_test_abc123" \
  --prod "sk_live_xyz789"

# Verify secrets
windkeep secrets list

# Run your app
windkeep run npm run dev
```

---

### Updating Secrets

```bash
# View current values
windkeep secrets get API_KEY

# Update production value
windkeep secrets set API_KEY --prod "sk_live_new_key_789"

# Check who changed what and when
windkeep secrets history API_KEY
```

---

### Managing Environment-Specific Secrets

```bash
# Development-only secret for debugging
windkeep secrets create DEBUG_LOGGING \
  --dev "true"

# Production-only secrets for security
windkeep secrets create PRODUCTION_API_KEY \
  --prod "sk_live_secure_key"

# Staging and production (skip development)
windkeep secrets create ANALYTICS_ID \
  --staging "UA-12345-STAGING" \
  --prod "UA-12345-PROD"
```

---

### Running Commands in Different Contexts

**Local Development:**

```bash
# No .env file needed!
windkeep run npm run dev
windkeep run python manage.py runserver
windkeep run go run main.go
```

**CI/CD Pipeline:**

```bash
# In your CI/CD script
export WINDKEEP_TOKEN=${{ secrets.WINDKEEP_TOKEN }}
windkeep login $WINDKEEP_TOKEN
windkeep projects switch my-app
windkeep run --env prod npm run build
windkeep run --env prod npm run deploy
```

**Running Tests:**

```bash
# Test with staging data
windkeep run -e staging npm test

# Test with production-like environment
windkeep run -e prod npm run integration-tests
```

**Database Operations:**

```bash
# Run migrations with development database
windkeep run npm run migrate

# Run migrations with production database
windkeep run -e prod npm run migrate

# Seed staging database
windkeep run -e staging npm run db:seed
```

**Multiple Services:**

```bash
# Terminal 1: Backend service
windkeep projects switch backend-api
windkeep run npm run dev

# Terminal 2: Frontend service
windkeep projects switch frontend-web
windkeep run npm start

# Terminal 3: Worker service
windkeep projects switch worker-service
windkeep run python worker.py
```

---

## Security Considerations

- **Never log secret values** in your application
- **Rotate secrets regularly** (especially API keys)
- **Use different secrets** for each environment
- **Delete unused secrets** to reduce attack surface
- **Monitor audit logs** for secret access
- **Use `--verbose` carefully** - it shows secret keys but not values

---

## Related Documentation

- **[Organizations](/cli-guide/organizations)** - Manage organizations and their projects
- **[Projects](/cli-guide/projects)** - Create and manage projects within organizations
- **[Pull & Push Secrets](/cli-guide/pull-push)** - Import and export secrets in bulk
- **[Guides & Troubleshooting](/cli-guide/guides)** - Common workflows and troubleshooting
