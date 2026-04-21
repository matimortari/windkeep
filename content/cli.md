# Command Line Interface

The WindKeep Command Line Interface allows you to manage secrets, organizations, and projects directly from your terminal. Fast, secure, and designed for developers who prefer working in the command line.

---

## Installation

### Shell Script (Linux / macOS)

```bash
curl -sSL https://windkeep.up.railway.app/install/install.sh | bash
```

### PowerShell Script (Windows)

```bash
irm https://windkeep.up.railway.app/install/install.ps1 | iex
```

### Manual Download

- [**Linux (x64)**](https://windkeep.up.railway.app/api/downloads/windkeep-linux-amd64) - For Ubuntu, Debian, Fedora, and other Linux distributions

- [**macOS (Intel)**](https://windkeep.up.railway.app/api/downloads/windkeep-darwin-amd64) - For Macs with Intel processors

- [**macOS (Apple Silicon)**](https://windkeep.up.railway.app/api/downloads/windkeep-darwin-arm64) - For Macs with M1, M2, M3, or M4 chips

- [**Windows (x64)**](https://windkeep.up.railway.app/api/downloads/windkeep-windows-amd64.exe) - For Windows 10/11

### Installation Steps

#### Linux / macOS

1. Download the binary
2. Open terminal and navigate to downloads:

```bash
cd ~/Downloads
```

3. Make it executable:

```bash
chmod +x windkeep-*
```

4. Move it to a directory in your PATH:

```bash
mv windkeep-* ~/.local/bin/windkeep
```

5. Ensure `~/.local/bin` is in your PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

6. Verify:

```bash
windkeep --version
```

---

#### Windows

1. Download the `.exe` file
2. Move it to:

```bash
Move-Item windkeep-windows-amd64.exe $env:LOCALAPPDATA\Programs\windkeep\windkeep.exe
```

3. Add this directory to your PATH:

```
%LOCALAPPDATA%\Programs\windkeep
```

4. Restart your terminal and verify:

```bash
windkeep --version
```

---

## Authentication

### Login

First, sign in to WindKeep and retrieve your API token:

1. Navigate to your **[preferences page](https://windkeep.com/admin/preferences)**
2. Copy your API token
3. Run:

```bash
# Pass token as argument
windkeep login YOUR_API_TOKEN

# Or use interactive mode (token input will be hidden)
windkeep login
```

> This validates your token and saves your configuration in `~/.windkeep/config.yaml`.

### Whoami

Display information about your currently authenticated user and active context.

**Example:**

```bash
windkeep whoami
```

### Logout

Remove stored authentication credentials by running:

```bash
windkeep logout
```

> This deletes your local configuration file. You'll need to run `windkeep login` again to authenticate.

---

## Next Steps

Now that you're set up, explore the documentation:

- **[Organizations](/cli-guide/organizations)** - Create and manage organizations
- **[Projects](/cli-guide/projects)** - Create and manage projects
- **[Secrets Management](/cli-guide/secrets)** - Create secrets and use `windkeep run`
- **[Pull & Push](/cli-guide/pull-push)** - Synchronize secrets with local files
- **[Guides & Troubleshooting](/cli-guide/guides)** - Common workflows and troubleshooting
