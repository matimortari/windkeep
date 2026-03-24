# WindKeep CLI

Command-line interface for managing secrets, organizations, and projects in WindKeep.

## Installation

## Quick Install (Recommended)

### Linux / macOS

```bash
curl -sSL https://windkeep.up.railway.app/install/install.sh | bash
```

Make sure the install directory is in your PATH at `~/.local/bin`

### Windows (PowerShell)

```bash
irm https://windkeep.up.railway.app/install/install.ps1 | iex
```

Make sure the install directory is in your PATH at `%LOCALAPPDATA%\Programs\windkeep`

## Install via Go (Optional)

```bash
go install github.com/matimortari/windkeep/cli@latest
```

> This installs the binary to your Go bin directory. For this method, you need to have Go installed and the Go bin directory in your PATH.

## Getting Started

1. Sign in to [**WindKeep**](https://windkeep.up.railway.app) and copy your API token from the preferences page
2. Authenticate using the CLI:

```bash
windkeep login YOUR_API_TOKEN
```

Configuration is stored at:

- Windows: `%APPDATA%\windkeep\config.yml`
- Linux/macOS: `~/.config/windkeep/config.yml`

```yml
api_token: your-api-token
active_org_id: org-id
active_org_name: My Organization
active_project_slug: my-project
active_project_name: My Project
```
