# Pull & Push

Pull secrets from WindKeep to local files or push local secrets to WindKeep.

---

## Command Reference

### `windkeep pull [OUTPUT_FILE]`

Pull secrets from your active project in WindKeep and save to a local file.

**Flags:**

- `-e, --env`: Environment to pull (dev/development, staging, prod/production) - default: development

**Examples:**

```bash
# Pull development secrets to .env
windkeep pull

# Pull production secrets to custom file
windkeep pull prod.env -e production
```

---

### `windkeep push [INPUT_FILE]`

Push secrets from a local file to your active project.

**Flags:**

- `-e, --env`: Environment to push to (dev/development, staging, prod/production) - default: development

**Examples:**

```bash
# Push .env file to development environment
windkeep push

# Push custom file to production environment
windkeep push prod.env -e production
```

**Notes:**

- Existing secrets with the same key will not be overwritten
- Invalid or duplicate secrets will be skipped with a warning
- Blank lines and comments (starting with #) are ignored in the input file

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
windkeep pull backup-$(date +%Y%m%d).env
```

### Migrate Between Projects

```bash
# Pull from source project
windkeep projects switch source-project

# Push to destination project
windkeep projects switch destination-project
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

- **Pulled files contain plaintext secrets** - store them securely
- Never commit secret files to version control
- Consider encrypting pulled files before sharing

---

## Related Documentation

- **[Organizations](/cli-guide/organizations)** - Manage organizations and their projects
- **[Projects](/cli-guide/projects)** - Create and manage projects within organizations
- **[Secrets Management](/cli-guide/secrets)** - Manage secrets within projects
