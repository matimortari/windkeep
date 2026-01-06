# WindKeep CLI

The WindKeep Command Line Interface allows you to manage secrets, organizations, and projects directly from your terminal. Fast, secure, and designed for developers who prefer working in the command line.

---

## Getting Started

### Download & Install

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

### Authentication

First, sign in to WindKeep and retrieve your API token:

1. Navigate to **Admin → Preferences**
2. Copy your API token
3. Run the login command:

```bash
windkeep login YOUR_API_TOKEN
```

This validates your token and saves your configuration. Once authenticated, you can start creating and managing secrets:

### Configuration

The CLI stores its configuration in `~/.windkeep/config.yaml`. You can manually edit this file if needed, but it's recommended to use the CLI commands instead.

---

## Next Steps

Now that you're set up, explore the documentation:

- **[Organizations](/cli-guide/organizations)** - Create and manage organizations
- **[Projects](/cli-guide/projects)** - Create and manage projects
- **[Secrets Management](/cli-guide/secrets)** - Create secrets and use `windkeep run`
- **[Pull & Push](/cli-guide/pull-push)** - Synchronize secrets with local files
- **[Guides & Troubleshooting](/cli-guide/guides)** - Common workflows and troubleshooting
