# WindKeep CLI

Command-line interface for managing secrets, organizations, and projects in WindKeep.

Full documentation: [**CLI Guide**](https://windkeep.up.railway.app/cli-guide)

## Installation

### Linux

```bash
curl -sSL https://windkeep.up.railway.app/install/install.sh | bash
```

### Windows (PowerShell)

```powershell
irm https://windkeep.up.railway.app/install/install.ps1 | iex
```

### Go Binary

```bash
go install github.com/matimortari/windkeep/cli@latest
```

Requires Go and a Go bin directory on your PATH. Does not set up the `wk` shortcut.

## Getting Started

### Interactive use

Copy your **personal API token** from the general Preferences tab. Personal tokens are unscoped and suitable for general use.

```bash
windkeep login YOUR_API_TOKEN
```

### CI/CD

Use a **service token** from the project's Access Control tab. Service tokens can only read secrets for the project they are scoped to.

```bash
export WINDKEEP_TOKEN=st_...
export WINDKEEP_PROJECT_ID=your_project_id
windkeep run --env prod npm run build
```

Or persist the service token locally:

```bash
windkeep login st_YOUR_SERVICE_TOKEN
```

Configuration is stored at:

- Linux: `~/.config/windkeep/config.yml`
- Windows: `%APPDATA%\windkeep\config.yml`

```yml
api_token: your-api-token
active_org_id: org-id
active_org_name: My Organization
active_project_slug: my-project
active_project_id: project-id
active_project_name: My Project
```
