# Pull & Push

Synchronize secrets between WindKeep and local `.env` files. Pull downloads secrets to a file, while push uploads secrets from a file to WindKeep.

---

## Understanding Pull & Push

### When to Use Pull

- Setting up a new development environment
- Creating backup files of your secrets
- Working with tools that require `.env` files
- Sharing environment-specific configurations with team members

### When to Use Push

- Migrating from `.env` files to WindKeep
- Bulk importing secrets from another source
- Synchronizing local changes to WindKeep

### Important Notes

- Pull and push operations work with your **active project** by default
- Use `-p, --project` to target a project without switching your active context
- Files are in standard `.env` format: `KEY=value`
- Default file is `.env` if no file is specified
- Default environment is `development` if not specified

---

## Command Reference

### `windkeep pull [OUTPUT_FILE]`

Pull secrets from your active project in WindKeep and save to a local file.

**Arguments:**

- `OUTPUT_FILE` - File to save secrets to (optional, default: `.env`)

**Flags:**

- `-e, --env` - Environment to pull (dev/development, staging, prod/production) - default: development
- `-p, --project` - Project slug to pull from (overrides active project)

**Examples:**

```bash
# Pull development secrets to .env
windkeep pull

# Pull production secrets to custom file
windkeep pull prod.env -e production

# Pull from a specific project without switching context
windkeep pull -p api-service -e staging .env.staging
```

---

### `windkeep push [INPUT_FILE]`

Push secrets from a local file to your active project.

**Arguments:**

- `INPUT_FILE` - File to read secrets from (optional, default: `.env`)

**Flags:**

- `-e, --env` - Environment to push to (dev/development, staging, prod/production) - default: development
- `--overwrite` - Update secrets that already exist (default: skip existing)

**Examples:**

```bash
# Push .env file to development environment
windkeep push

# Push custom file to production environment
windkeep push prod.env -e production

# Push and overwrite any existing secrets
windkeep push --overwrite

# Push to staging, overwriting existing values
windkeep push staging.env -e staging --overwrite
```

**Notes:**

- By default, secrets that already exist in the project are **skipped** with a warning
- Use `--overwrite` to update existing secrets instead of skipping them
- Blank lines and comments (starting with `#`) are ignored in the input file
- Lines with invalid format (`KEY=VALUE` expected) are skipped with a warning

**Output:**

```
• Project: my-app  •  Env: development
✓ Created 3 new secret(s)
✓ Updated 1 existing secret(s)
⚠ Skipped 2 secret(s)
```

---

## Use Cases

### Local Development

```bash
# Pull development secrets to .env for your app
windkeep pull
npm run dev  # Your app reads from .env
```

### Backup Secrets

```bash
windkeep pull backup-$(date +%Y%m%d).env -e production
```

### Migrate from .env Files

```bash
# Push your existing .env to WindKeep (first time)
windkeep push

# After editing local .env, sync changes
windkeep push --overwrite
```

### Migrate Between Projects

```bash
# Pull from source project without switching context
windkeep pull /tmp/secrets.env -p source-project -e production

# Switch to destination and push
windkeep projects switch destination-project
windkeep push /tmp/secrets.env -e production
```

### Share Environment-Specific Secrets

```bash
# Pull production secrets for deployment
windkeep pull prod.env -e production

# Team member pushes to their production environment
windkeep push prod.env -e production
```

---

## Security Considerations

- **Pulled files contain plaintext secrets** — store them securely
- Never commit secret files to version control
- Consider encrypting pulled files before sharing
- Delete local `.env` files after migrating to WindKeep

---

## Related Documentation

- **[Organizations](/cli-guide/organizations)** - Manage organizations and their projects
- **[Projects](/cli-guide/projects)** - Create and manage projects within organizations
- **[Secrets Management](/cli-guide/secrets)** - Manage secrets within projects
