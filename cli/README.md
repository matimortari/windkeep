# SecretkeepR CLI

Command-line interface for managing secrets in SecretkeepR.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/matimortari/secretkeepr/cli.git
cd cli
```

2. Install dependencies:

```bash
go mod download
```

3. Build the CLI:

```bash
go build -o secretkeepr
```

4. (Optional) Install globally:

```bash
go install
```

## Configuration

The CLI stores its configuration in `~/.secretkeepr/config.yaml`:

```yaml
api_token: your-api-token
api_url: https://secretkeepr.vercel.app
active_org_id: org-id
active_org_name: My Organization
active_project_id: project-id
active_project_name: My Project
default_environment: DEVELOPMENT
```

## Usage

### Authentication

```bash
# Login with your API token
secretkeepr login YOUR_API_TOKEN

# Logout
secretkeepr logout
```

### Configuration

```bash
# View current configuration
secretkeepr config view

# Set configuration values
secretkeepr config set default_environment PRODUCTION
```

### Secrets Management

```bash
# List all secrets in the active project
secretkeepr secrets list

# Get a specific secret
secretkeepr secrets get API_KEY

# Create a new secret
secretkeepr secrets create DATABASE_URL --description "Database connection string"

# Set a secret value for an environment
secretkeepr secrets set DATABASE_URL postgres://... --env PRODUCTION

# Delete a secret
secretkeepr secrets delete API_KEY
```

### Organizations

```bash
# List all organizations
secretkeepr orgs list

# Switch active organization
secretkeepr orgs use my-org-id

# Create a new organization
secretkeepr orgs create "My New Organization"
```

### Projects

```bash
# List all projects in active organization
secretkeepr projects list

# Switch active project
secretkeepr projects use my-project-slug

# Create a new project
secretkeepr projects create "My Project" --slug my-project --description "Project description"
```

## Development

### Running Tests

```bash
go test ./...
```

### Building for Multiple Platforms

```bash
# Linux
GOOS=linux GOARCH=amd64 go build -o secretkeepr-linux-amd64

# macOS (Intel)
GOOS=darwin GOARCH=amd64 go build -o secretkeepr-darwin-amd64

# macOS (Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o secretkeepr-darwin-arm64

# Windows
GOOS=windows GOARCH=amd64 go build -o secretkeepr-windows-amd64.exe
```

## Contact

Feel free to reach out to discuss collaboration opportunities or to say hello!

- [**My Email**](mailto:matheus.felipe.19rt@gmail.com)
- [**My LinkedIn Profile**](https://www.linkedin.com/in/matheus-mortari-19rt)
- [**My GitHub Profile**](https://github.com/matimortari)

## License

This project is licensed under the [**MIT License**](./LICENSE).
