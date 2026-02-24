# Guides & Troubleshooting

Comprehensive guides for common workflows, real-world use cases, and solutions to common issues when using the WindKeep CLI.

---

## Complete Workflow Guides

### Setting Up a New Project from Scratch

> **Scenario:** You're starting a new application and want to manage all secrets in WindKeep.

```bash
# Create an organization (or switch to existing)
windkeep orgs create "My Company"

# Create a project
windkeep projects create "Backend API" -d "Main backend service"

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
  --staging "sk_test_staging456" \
  --prod "sk_live_xyz789"

# Add authentication secrets
windkeep secrets create JWT_SECRET \
  --description "JWT signing secret" \
  --dev "dev_secret_123" \
  --staging "staging_secret_456" \
  --prod "prod_secret_789"

# Add email service credentials
windkeep secrets create SMTP_HOST \
  --description "Email server host" \
  --dev "localhost" \
  --prod "smtp.sendgrid.net"

windkeep secrets create SMTP_PASSWORD \
  --description "Email server password" \
  --prod "your_smtp_password"

# Verify all secrets
windkeep secrets list

# Run your application
windkeep run npm run dev
```

---

### Migrating from .env Files to WindKeep

> **Scenario:** You have existing `.env` files and want to migrate to WindKeep.

**Step 1: Analyze Your .env Files**

```bash
# Example .env.development
DATABASE_URL=postgres://localhost:5432/dev
API_KEY=sk_test_abc123
STRIPE_KEY=sk_test_xyz789
SMTP_HOST=localhost
SMTP_PORT=1025
```

**Step 2: Create Secrets in WindKeep**

```bash
# Switch to your project
windkeep projects switch my-app

# Migrate each secret
windkeep secrets create DATABASE_URL \
  --dev "postgres://localhost:5432/dev"

windkeep secrets create API_KEY \
  --dev "sk_test_abc123"

windkeep secrets create STRIPE_KEY \
  --dev "sk_test_xyz789"

windkeep secrets create SMTP_HOST \
  --dev "localhost"

windkeep secrets create SMTP_PORT \
  --dev "1025"
```

**Step 3: Add Production Values**

```bash
# Add production values for each secret
windkeep secrets set DATABASE_URL \
  --prod "postgres://prod-db:5432/app"

windkeep secrets set API_KEY \
  --prod "sk_live_abc123"

windkeep secrets set STRIPE_KEY \
  --prod "sk_live_xyz789"

windkeep secrets set SMTP_HOST \
  --prod "smtp.sendgrid.net"

windkeep secrets set SMTP_PORT \
  --prod "587"
```

**Step 4: Test the Migration**

```bash
# Run your app with WindKeep
windkeep run npm run dev

# Verify it works, then delete .env files
rm .env.development .env.production
```

---

### Working Across Multiple Organizations

> **Scenario:** You work on personal projects and client projects, each in different organizations.

```bash
# Morning: Work on personal project
windkeep orgs list
windkeep orgs switch cm123personal
windkeep projects switch personal-blog
windkeep run npm run dev

# Afternoon: Switch to client work
windkeep orgs switch cm456client
windkeep projects switch client-website
windkeep run npm start

# Evening: Back to personal project
windkeep orgs switch cm123personal
windkeep projects switch side-project
windkeep run python app.py

# Quick check of current context
windkeep whoami
```

---

### CI/CD Integration

> **Scenario:** You want to use WindKeep secrets in your CI/CD pipeline.

**GitHub Actions Example:**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Install WindKeep CLI
        run: |
          # Add installation commands here when available
          # For now, use the Go binary

      - name: Deploy with WindKeep secrets
        env:
          WINDKEEP_TOKEN: ${{ secrets.WINDKEEP_TOKEN }}
        run: |
          windkeep login $WINDKEEP_TOKEN
          windkeep projects switch my-app
          windkeep run --env prod npm run build
          windkeep run --env prod npm run deploy
```

**GitLab CI Example:**

```yaml
deploy:
  stage: deploy
  script:
    - windkeep login $WINDKEEP_TOKEN
    - windkeep projects switch my-app
    - windkeep run --env prod npm run build
    - windkeep run --env prod npm run deploy
  only:
    - main
```

---

### Managing Multiple Microservices

> **Scenario:** You have multiple services that need different secrets.

```bash
# Create projects for each service
windkeep projects create "Auth Service" -d "Authentication microservice"
windkeep projects create "API Gateway" -d "API gateway service"
windkeep projects create "Payment Service" -d "Payment processing service"

# Setup auth service secrets
windkeep projects switch auth-service
windkeep secrets create DATABASE_URL --dev "postgres://localhost:5432/auth"
windkeep secrets create JWT_SECRET --dev "auth_jwt_secret"

# Setup API gateway secrets
windkeep projects switch api-gateway
windkeep secrets create AUTH_SERVICE_URL --dev "http://localhost:3001"
windkeep secrets create PAYMENT_SERVICE_URL --dev "http://localhost:3002"
windkeep secrets create API_KEY --dev "gateway_api_key"

# Setup payment service secrets
windkeep projects switch payment-service
windkeep secrets create STRIPE_KEY --dev "sk_test_xyz789"
windkeep secrets create PAYMENT_DATABASE_URL --dev "postgres://localhost:5432/payments"

# Run all services in different terminals
# Terminal 1:
windkeep projects switch auth-service && windkeep run npm run dev

# Terminal 2:
windkeep projects switch api-gateway && windkeep run npm run dev

# Terminal 3:
windkeep projects switch payment-service && windkeep run npm run dev
```

### Quick Context Switching

```bash
# Create aliases for common workflows
alias dev-backend='windkeep orgs switch cm123 && windkeep projects switch backend && windkeep run npm run dev'
alias dev-frontend='windkeep orgs switch cm123 && windkeep projects switch frontend && windkeep run npm start'

# Use them
dev-backend
dev-frontend
```

### Use Project Flags for One-Off Commands

```bash
# Run a command in a different project without switching
windkeep run -p other-project npm run task

# Your active project remains unchanged
windkeep whoami
```

### Combine with Other Tools

```bash
# Use with docker-compose
windkeep run docker-compose up

# Use with make
windkeep run make build

# Use with custom scripts
windkeep run ./scripts/deploy.sh
```

---

## Real-World Use Cases

### Use Case 1: No More .env Files

**Before WindKeep:**

```bash
# Managing multiple .env files
.env.development
.env.staging
.env.production
.env.test

# Manually copying values
cp .env.development .env
npm run dev

# Risk of committing secrets
git add .env  # 😱 DANGEROUS!
```

**After WindKeep:**

```bash
# No .env files needed!
windkeep run npm run dev
windkeep run -e staging npm test
windkeep run -e prod npm start

# Nothing to commit
# All secrets stored securely in WindKeep
```

**Benefits:**

- ✅ No risk of committing secrets
- ✅ No manual file copying
- ✅ Centralized secret management
- ✅ Easy environment switching

---

### Use Case 2: Secure CI/CD Pipelines

**Before WindKeep:**

```bash
# Storing secrets in CI/CD platform
# Each service needs secrets configured separately
# Hard to rotate or update secrets
# No centralized audit trail
```

**After WindKeep:**

```bash
# Single source of truth
windkeep login $WINDKEEP_TOKEN
windkeep projects switch my-app
windkeep run --env prod npm run build
windkeep run --env prod npm run deploy

# All secret access logged
# Easy to rotate secrets (update once, applies everywhere)
# Audit trail in WindKeep dashboard
```

**Benefits:**

- ✅ Centralized secret storage
- ✅ Audit trail for compliance
- ✅ Easy secret rotation
- ✅ Consistent across all pipelines

---

### Use Case 3: Onboarding New Developers

**Before WindKeep:**

```bash
# New developer joins
# Send them .env file via Slack/Email (😱 insecure!)
# Or manually share each secret
# They might have outdated secrets
```

**After WindKeep:**

```bash
# Invite developer to organization via web dashboard and share these commands:

windkeep login YOUR_API_TOKEN
windkeep orgs switch cm123team
windkeep projects switch backend-api
windkeep run npm run dev

# Developer has access to latest secrets immediately
# No manual sharing needed
# Access can be revoked instantly
```

**Benefits:**

- ✅ Secure onboarding
- ✅ Always up-to-date secrets
- ✅ Easy access management
- ✅ Audit trail of who accessed what

---

### Use Case 4: Multi-Environment Testing

**Before WindKeep:**

```bash
# Manually switching .env files
cp .env.staging .env
npm test

cp .env.production .env
npm test

# Easy to forget which environment you're in
```

**After WindKeep:**

```bash
# Clear, explicit environment selection
windkeep run -e dev npm test
windkeep run -e staging npm test
windkeep run -e prod npm run integration-test

# With verbose mode to see what's being used
windkeep run -v -e staging npm test
```

**Benefits:**

- ✅ Explicit environment selection
- ✅ No file management
- ✅ Clear audit trail
- ✅ Reduced human error

---

## Troubleshooting

### "Config file not found" Error

**Problem:** You haven't logged in yet.

**Solution:**

```bash
windkeep login YOUR_API_TOKEN
```

---

### "Not authenticated" Error

**Problem:** Your API token may have been regenerated, or is invalid.

**Solution:**

```bash
# Logout and login with new token
windkeep logout
windkeep login YOUR_NEW_API_TOKEN
```

To regenerate your API token, sign in to WindKeep and generate a new API token in the [preferences](https://windkeep.up.railway.app/admin/preferences) page.

---

### "No active organization" Error

**Problem:** You need to select an organization to work with.

**Solution:**

```bash
windkeep orgs list

# Switch to a listed organization
windkeep orgs switch cm123abc456
```

---

### "No active project" Error

**Problem:** You need to select a project before running secret commands.

**Solution:**

```bash
windkeep projects list

# Switch to a listed project
windkeep projects switch my-project
```

---

### Secrets Not Appearing in `windkeep run`

**Problem:** Your command runs but environment variables are missing.

**Possible Causes & Solutions:**

**Cause 1: Wrong environment**

```bash
# Check which environment you're using
windkeep run -v npm start

# Try different environment
windkeep run -e staging npm start
windkeep run -e prod npm start
```

**Cause 2: Wrong project**

```bash
# Check current project
windkeep whoami

# Switch to correct project
windkeep projects switch correct-project

# Or override with flag
windkeep run -p correct-project npm start
```

**Cause 3: Secret doesn't exist for that environment**

```bash
# List all secrets
windkeep secrets list

# Check specific secret values
windkeep secrets get DATABASE_URL

# Add missing environment value
windkeep secrets set DATABASE_URL --dev "postgres://localhost:5432/dev"
```

---

## Security Considerations

### Secrets Management

- **Never log secret values** in your application
- **Rotate secrets regularly** (especially API keys)
- **Use different secrets** for each environment
- **Delete unused secrets** to reduce attack surface
- **Monitor audit logs** for secret access
- **Use `--verbose` carefully** - it shows secret keys but not values

### Team Collaboration

- **Remove team members** when they leave the organization
- **Use appropriate roles** (OWNER, ADMIN, MEMBER)
- **Separate organizations** for different clients/contexts
- **Review audit logs regularly** in the dashboard

---
