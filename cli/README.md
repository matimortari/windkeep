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

1. Sign in to [**WindKeep**](https://windkeep.up.railway.app) and copy your API token from the preferences page

2. Authenticate using the CLI:

```bash
windkeep login YOUR_API_TOKEN
```

Configuration is stored at:

- Linux: `~/.config/windkeep/config.yml`
- Windows: `%APPDATA%\windkeep\config.yml`

```yml
api_token: your-api-token
active_org_id: org-id
active_org_name: My Organization
active_project_slug: my-project
active_project_name: My Project
```
