# Command Line Interface

> The WindKeep Command Line Interface allows you to manage secrets, organizations, and projects directly from your terminal. Fast, secure, and designed for developers who prefer working in the command line.

---

## Installation

### Shell Script (Linux / macOS)

```bash
curl -sSL https://windkeep.vercel.app/install/install.sh | bash
```

### PowerShell Script (Windows)

```bash
irm https://windkeep.vercel.app/install/install.ps1 | iex
```

### Manual Download

> [**Linux (x64)**](https://windkeep.vercel.app/api/downloads/windkeep-linux-amd64) - For Ubuntu, Debian, Fedora, and other Linux distributions

> [**macOS (Intel)**](https://windkeep.vercel.app/api/downloads/windkeep-darwin-amd64) - For Macs with Intel processors

> [**macOS (Apple Silicon)**](https://windkeep.vercel.app/api/downloads/windkeep-darwin-arm64) - For Macs with M1, M2, M3, or M4 chips

> [**Windows (x64)**](https://windkeep.vercel.app/api/downloads/windkeep-windows-amd64.exe) - For Windows 10/11

### Installation Steps

**Linux / macOS:**

1. Download the binary for your system
2. Open terminal and navigate to downloads: `cd ~/Downloads`
3. Make it executable: `chmod +x windkeep-*`
4. Move to PATH: `sudo mv windkeep-* /usr/local/bin/windkeep`
5. Verify: `windkeep --version`

**Windows:**

1. Download the `.exe` file
2. Move it to a directory in your PATH
3. Open PowerShell and verify: `windkeep --version`

---

## Authentication

First, sign in to WindKeep and retrieve your API token:

1. Navigate to your **[preferences page](https://windkeep.com/admin/preferences)**
2. Copy your API token
3. Run the login command, passing your token as an argument:

```bash
windkeep login YOUR_API_TOKEN
```

> This validates your token and saves your configuration in `~/.windkeep/config.yaml`.

---

## Next Steps

Now that you're set up, explore the documentation:

- **[Organizations](/cli-guide/organizations)** - Create and manage organizations
- **[Projects](/cli-guide/projects)** - Create and manage projects
- **[Secrets Management](/cli-guide/secrets)** - Create secrets and use `windkeep run`
- **[Pull & Push](/cli-guide/pull-push)** - Synchronize secrets with local files
- **[Guides & Troubleshooting](/cli-guide/guides)** - Common workflows and troubleshooting
