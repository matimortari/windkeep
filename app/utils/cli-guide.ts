const INDEX_CONTENT: CliSection[] = [
  {
    title: "Overview",
    paragraphs: [[
      "The WindKeep CLI lets you manage secrets, organizations, and projects from your terminal.",
      " It is the fastest way to create projects, rotate keys, and run local commands with injected environment variables — without maintaining ",
      { code: ".env" },
      " files.",
    ]],
    note: ["You can also use the ", { code: "wk" }, " alias for any ", { code: "windkeep" }, " command."],
  },
  {
    title: "Quick Installation",
    paragraphs: [["The install script downloads the right binary for your platform and places it on your PATH."]],
    code: [
      { label: "Linux / macOS", command: "curl -sSL https://windkeep.up.railway.app/install/install.sh | bash" },
      { label: "Windows (PowerShell)", command: "irm https://windkeep.up.railway.app/install/install.ps1 | iex" },
    ],
  },
  {
    title: "Manual Downloads",
    paragraphs: [["Prefer a direct download? Grab the binary for your platform below."]],
    links: [
      { href: "https://windkeep.up.railway.app/api/downloads/windkeep-linux-amd64", label: "Linux (x64)", description: "Ubuntu, Debian, Fedora, and other Linux distros." },
      { href: "https://windkeep.up.railway.app/api/downloads/windkeep-windows-amd64.exe", label: "Windows (x64)", description: "Windows 10/11." },
    ],
  },
  {
    title: "Manual Setup: Linux",
    paragraphs: [["After downloading the binary, make it executable and move it to a directory on your PATH."]],
    code: [{
      command: [
        "# Navigate to your downloads folder",
        "cd ~/Downloads",
        "",
        "# Make the binary executable",
        "chmod +x windkeep-*",
        "",
        "# Move to a directory on your PATH",
        "mv windkeep-* ~/.local/bin/windkeep",
        "",
        "# Ensure ~/.local/bin is on your PATH (add to ~/.bashrc or ~/.zshrc to persist)",
        "export PATH=\"$HOME/.local/bin:$PATH\"",
        "",
        "# Verify installation",
        "windkeep --version",
      ].join("\n"),
    }],
  },
  {
    title: "Manual Setup: Windows",
    paragraphs: [["After downloading the ", { code: ".exe" }, ", move it to a permanent location and add that folder to your PATH."]],
    code: [{
      command: [
        "# Move the binary to a permanent location",
        "Move-Item windkeep-windows-amd64.exe $env:LOCALAPPDATA\\Programs\\windkeep\\windkeep.exe",
        "",
        "# Add %LOCALAPPDATA%\\Programs\\windkeep to PATH, restart the terminal, then verify",
        "windkeep --version",
      ].join("\n"),
    }],
  },
  {
    title: "Authentication",
    paragraphs: [[
      "Before running other commands, authenticate with your API token.",
      " Copy it from the ",
      { link: { href: "/admin/preferences", text: "preferences page" } },
      " in the WindKeep dashboard.",
    ]],
    note: ["Login validates your token and saves credentials to ", { code: "~/.config/windkeep/config.yml" }, " (Linux/macOS) or ", { code: "%APPDATA%\\windkeep\\config.yml" }, " (Windows)."],
    code: [{
      command: [
        "# Authenticate with your API token",
        "windkeep login YOUR_API_TOKEN",
        "",
        "# Or use interactive mode (token input is hidden)",
        "windkeep login",
        "",
        "# Show your user and active org/project context",
        "windkeep whoami",
        "",
        "# Remove stored credentials",
        "windkeep logout",
      ].join("\n"),
    }],
  },
  {
    title: "Upgrading",
    paragraphs: [["Download and install the latest CLI release in place."]],
    code: [{ command: "windkeep upgrade" }],
    note: ["On Windows, run ", { code: "windkeep --version" }, " after upgrading to finish the installation."],
  },
  {
    title: "Next Steps",
    links: [
      { href: "/cli-guide/orgs-projects", label: "Organizations & Projects", description: "Manage workspaces and project containers." },
      { href: "/cli-guide/secrets", label: "Secrets Management", description: "Create secrets and use windkeep run." },
      { href: "/cli-guide/guides", label: "Guides & Troubleshooting", description: "Workflows and common fixes." },
    ],
  },
]

const ORGS_PROJECTS_CONTENT: CliSection[] = [
  {
    title: "Overview",
    paragraphs: [[
      "Organizations are team workspaces. Projects are secret containers inside an organization.",
      " You can belong to multiple orgs — each with its own projects, members, and roles.",
    ]],
  },
  {
    title: "Context & Roles",
    paragraphs: [
      [{ strong: "Active organization" }, " determines where new projects are created. ", { strong: "Active project" }, " is the default target for secret commands — use ", { code: "windkeep projects switch" }, " to change it, or pass ", { code: "-p" }, " on ", { code: "windkeep run" }, " and ", { code: "windkeep pull" }, " to override."],
      ["Each organization member has one of these roles:"],
    ],
    commands: [
      { label: "OWNER", description: "Full control over the org, its projects, and members." },
      { label: "ADMIN", description: "Manage projects and secrets; cannot delete the organization." },
      { label: "MEMBER", description: "View and use secrets in assigned projects." },
    ],
  },
  {
    title: "Organizations: List",
    paragraphs: [["List every organization you belong to, along with your role and which one is currently active."]],
    code: [{
      label: "Example & Output:",
      command: "windkeep orgs list",
      output: "ID             NAME              ROLE    ACTIVE\ncm123abc456    My Organization   OWNER   ✓\ncm789def012    Team Workspace    ADMIN\ncm456ghi789    Client Project    MEMBER",
    }],
  },
  {
    title: "Organizations: Create",
    paragraphs: [["Create a new organization. You become the owner and it is set as your active org."]],
    commands: [{ label: "Arguments", code: "NAME", description: "Organization name (required)." }],
    code: [{ command: "windkeep orgs create \"My Company\"" }],
  },
  {
    title: "Organizations: Switch",
    paragraphs: [[
      "Set the active organization for future commands.",
      " Switching orgs also clears your active project, since projects belong to a single organization.",
    ]],
    commands: [{ label: "Arguments", code: "ORG_ID", description: "Target org ID (optional — omit to open an interactive selector)." }],
    code: [{
      label: "Example & Output:",
      command: "windkeep orgs switch cm789def012",
      output: "✓ Switched to organization 'Team Workspace'",
    }],
    note: ["Run ", { code: "windkeep orgs list" }, " to find organization IDs."],
  },
  {
    title: "Organizations: Update",
    paragraphs: [["Rename your ", { strong: "active" }, " organization. Requires OWNER or ADMIN."]],
    commands: [{ label: "Arguments", code: "NAME", description: "New organization name (required)." }],
    code: [{
      command: [
        "# Switch to the org you want to rename (if it is not already active)",
        "windkeep orgs switch cm123abc456",
        "",
        "# Update the name",
        "windkeep orgs update \"New Company Name\"",
      ].join("\n"),
    }],
  },
  {
    title: "Projects: List",
    paragraphs: [["List all projects in your active organization, including secret counts."]],
    code: [{
      label: "Example & Output:",
      command: "windkeep projects list",
      output: "ID             NAME           SLUG           SECRETS\ncm111aaa111    My Project     my-project     5\ncm222bbb222    API Service    api-service    12",
    }],
  },
  {
    title: "Projects: Create",
    paragraphs: [["Create a project in your active organization. The slug is auto-generated from the name, and the new project becomes active."]],
    commands: [
      { label: "Arguments", code: "NAME", description: "Project name (required)." },
      { label: "Flags", code: "-d, --description", description: "Optional description." },
    ],
    code: [{
      command: [
        "windkeep projects create \"My Project\"",
        "",
        "windkeep projects create \"API Service\" -d \"Backend API\"",
      ].join("\n"),
    }],
  },
  {
    title: "Projects: Switch",
    paragraphs: [["Set the active project for secret commands and ", { code: "windkeep run" }, ". Only projects from the active organization are shown."]],
    commands: [{ label: "Arguments", code: "PROJECT_SLUG", description: "Target slug (optional — omit to open an interactive selector)." }],
    code: [{
      label: "Example & Output:",
      command: "windkeep projects switch api-service",
      output: "✓ Switched to project 'API Service' (slug: api-service)",
    }],
    note: ["Run ", { code: "windkeep projects list" }, " to find project slugs."],
  },
  {
    title: "Projects: Update",
    paragraphs: [["Update a project's name, slug, or description. At least one flag is required."]],
    commands: [
      { label: "Arguments", code: "PROJECT_SLUG", description: "Project to update (required)." },
      { label: "Flags", code: "-n, --name", description: "New name." },
      { label: "Flags", code: "-s, --slug", description: "New slug." },
      { label: "Flags", code: "-d, --description", description: "New description." },
    ],
    code: [{ command: "windkeep projects update my-project \\\n  --name \"API Service v2\" \\\n  --slug api-service-v2 \\\n  --description \"Updated backend API\"" }],
  },
  {
    title: "Projects: Delete",
    paragraphs: [["Permanently delete a project and ", { strong: "all" }, " of its secrets. ", { strong: "This cannot be undone." }]],
    commands: [
      { label: "Arguments", code: "PROJECT_SLUG", description: "Project to delete (required)." },
      { label: "Flags", code: "--confirm", description: "Skip the confirmation prompt." },
    ],
    code: [{ command: "windkeep projects delete old-project --confirm" }],
  },
  {
    title: "Common Workflows",
    code: [{
      command: [
        "# Bootstrap a new org and project",
        "windkeep orgs create \"My Startup\"",
        "windkeep whoami",
        "windkeep projects create \"Backend API\"",
        "",
        "# Switch between orgs and projects",
        "windkeep orgs list",
        "windkeep orgs switch cm789def012",
        "windkeep projects list",
        "windkeep projects switch my-project",
        "",
        "# Work across orgs (each line sets context, then runs your app)",
        "windkeep orgs switch cm123abc456 && windkeep projects switch personal-app && windkeep run npm run dev",
        "windkeep orgs switch cm789def012 && windkeep projects switch work-api && windkeep run --env prod npm start",
        "",
        "# Create a project and add your first secret",
        "windkeep whoami",
        "windkeep projects create \"My App\" -d \"My application\"",
        "windkeep secrets create DATABASE_URL --dev \"postgres://localhost:5432/dev\"",
      ].join("\n"),
    }],
  },
  {
    title: "Migrating Projects Between Orgs",
    paragraphs: [["Projects cannot be moved between organizations via the CLI. Use this sequence instead:"]],
    steps: [
      "Export secrets from the old project (via the dashboard or windkeep pull).",
      "Create a new project in the target organization.",
      "Import secrets into the new project (via the dashboard or windkeep push).",
      "Delete the old project when you are done.",
    ],
    code: [{
      label: "Example sequence:",
      command: [
        "# Switch to the source org and project",
        "windkeep orgs switch cm123old",
        "windkeep projects switch old-project",
        "",
        "# Export secrets locally",
        "windkeep pull .env.backup -e production",
        "",
        "# Create the project in the target org",
        "windkeep orgs switch cm456new",
        "windkeep projects create \"Migrated Project\"",
        "",
        "# Import secrets and clean up",
        "windkeep push .env.backup -e production",
        "windkeep orgs switch cm123old",
        "windkeep projects delete old-project --confirm",
      ].join("\n"),
    }],
  },
  {
    title: "Related Documentation",
    links: [
      { href: "/cli-guide/secrets", label: "Secrets Management", description: "Manage secrets within projects." },
      { href: "/cli-guide/guides", label: "Guides & Troubleshooting", description: "Workflows and troubleshooting." },
    ],
  },
]

const SECRETS_CONTENT: CliSection[] = [
  {
    title: "Overview",
    paragraphs: [[
      "Secrets are environment variables stored in WindKeep.",
      " Each secret can hold different values for development, staging, and production — so the same key works across every environment.",
    ]],
  },
  {
    title: "Understanding Secrets",
    paragraphs: [
      ["Use secrets for connection strings, API tokens, OAuth credentials, encryption keys, and any other sensitive configuration."],
      ["Each secret supports per-environment values:"],
      [{ strong: "Important:" }, " Secret commands require an active project. Run ", { code: "windkeep projects switch" }, " first, or pass ", { code: "-p" }, " to ", { code: "windkeep run" }, " and ", { code: "windkeep pull" }, "."],
    ],
    commands: [
      { label: "DEVELOPMENT", description: "Local development values (default for windkeep run)." },
      { label: "STAGING", description: "Test and QA environments." },
      { label: "PRODUCTION", description: "Live application values." },
    ],
  },
  {
    title: "Command: List Secrets",
    paragraphs: [["List all secrets in the active project, including which environments have values and when each secret was last updated."]],
    code: [{
      label: "Example & Output:",
      command: "windkeep secrets list",
      output: "Project: My Project\n\nKEY            ENVIRONMENTS                     DESCRIPTION          UPDATED\nDATABASE_URL   DEVELOPMENT, STAGING, PRODUCTION  Database connection  2d ago\nAPI_KEY        PRODUCTION                        Third-party API key  5m ago\n\n2 secret(s) total",
    }],
  },
  {
    title: "Command: Get Secret",
    paragraphs: [["Show decrypted values and metadata for a single secret key."]],
    commands: [{ label: "Arguments", code: "KEY", description: "Secret key name (required)." }],
    code: [{
      label: "Example & Output:",
      command: "windkeep secrets get DATABASE_URL",
      output: "Key:     DATABASE_URL\nDesc:    Database connection string\nUpdated: 2d ago\n\nENVIRONMENT  VALUE\nDEVELOPMENT  postgres://localhost:5432/dev\nSTAGING      postgres://staging-db:5432/app\nPRODUCTION   postgres://prod-db:5432/app",
    }],
  },
  {
    title: "Command: Create Secret",
    paragraphs: [["Create a new secret in the active project. Set values per environment with ", { code: "--dev" }, ", ", { code: "--staging" }, ", and ", { code: "--prod" }, "."]],
    commands: [
      { label: "Arguments", code: "KEY", description: "Secret key (required; uppercase recommended)." },
      { label: "Flags", code: "-d, --description", description: "Optional description." },
      { label: "Flags", code: "--dev, --staging, --prod", description: "Environment values." },
    ],
    code: [{
      command: [
        "# Set values for all environments at once",
        "windkeep secrets create DATABASE_URL \\",
        "  --description \"Database connection string\" \\",
        "  --dev \"postgres://localhost:5432/dev\" \\",
        "  --staging \"postgres://staging-db:5432/app\" \\",
        "  --prod \"postgres://prod-db:5432/app\"",
        "",
        "# Or create a secret with only the environments you need",
        "windkeep secrets create API_KEY --description \"Production API key\" --prod \"sk_live_abc123\"",
      ].join("\n"),
    }],
  },
  {
    title: "Command: Set Secret",
    paragraphs: [["Update values for an existing secret. Only the environments you specify are changed — all others keep their current values."]],
    commands: [
      { label: "Arguments", code: "KEY", description: "Secret key (required)." },
      { label: "Flags", code: "-d, --description", description: "Update the description." },
      { label: "Flags", code: "--dev, --staging, --prod", description: "Environment values to update." },
    ],
    code: [{
      command: [
        "windkeep secrets set DATABASE_URL --prod \"postgres://new-prod-db:5432/app\"",
        "",
        "windkeep secrets set API_KEY --staging \"sk_test_xyz789\" --prod \"sk_live_xyz789\"",
        "",
        "windkeep secrets set JWT_SECRET -d \"Updated signing secret\" --dev \"new_dev_secret\"",
      ].join("\n"),
    }],
  },
  {
    title: "Command: Secret History",
    paragraphs: [["View the audit trail for a secret — who changed each value and when."]],
    commands: [
      { label: "Arguments", code: "KEY", description: "Secret key (required)." },
      { label: "Flags", code: "-e, --env", description: "Filter by environment (dev, staging, or prod)." },
    ],
    code: [{
      label: "Example & Output:",
      command: "windkeep secrets history DATABASE_URL -e prod",
      output: "History for: DATABASE_URL\n\n[PRODUCTION]  current: postgres://prod-db:5432/app\nVALUE                          CHANGED BY  WHEN\npostgres://old-prod-db:5432/app  Alice Smith  3d ago",
    }],
  },
  {
    title: "Command: Delete Secret",
    paragraphs: [["Permanently delete a secret and all of its environment values. ", { strong: "This cannot be undone." }]],
    commands: [
      { label: "Arguments", code: "KEY", description: "Secret key to delete (required)." },
      { label: "Flags", code: "--confirm", description: "Skip the confirmation prompt." },
    ],
    code: [{ command: "windkeep secrets delete OLD_API_KEY --confirm" }],
  },
  {
    title: "Injecting Secrets at Runtime",
    paragraphs: [
      [{ code: "windkeep run" }, " fetches secrets from WindKeep and injects them as environment variables into your process — no ", { code: ".env" }, " file required."],
      ["WindKeep flags must come ", { strong: "before" }, " the command you want to run. Use ", { code: "--" }, " to separate flags when your command also uses ", { code: "--" }, " flags."],
    ],
    commands: [
      { label: "Flags", code: "-e, --env", description: "Environment (dev, staging, or prod — defaults to development)." },
      { label: "Flags", code: "-p, --project", description: "Override the active project by slug." },
      { label: "Flags", code: "-v, --verbose", description: "Print injected secret keys before running (values are never shown)." },
    ],
    code: [{
      command: [
        "# Run with development secrets (default)",
        "windkeep run npm run dev",
        "",
        "# Run with production secrets",
        "windkeep run --env prod python app.py",
        "",
        "# Override project and environment",
        "windkeep run -p api-service -e staging node server.js",
        "",
        "# Pass through flags to the child command",
        "windkeep run -e prod -- node --inspect server.js",
      ].join("\n"),
    }],
  },
  {
    title: "Syncing with Local .env Files",
    paragraphs: [[
      "Prefer working with ",
      { code: ".env" },
      " files locally? Use ",
      { code: "pull" },
      " and ",
      { code: "push" },
      " to sync secrets between WindKeep and your filesystem.",
    ]],
  },
  {
    title: "Command: Pull Secrets",
    paragraphs: [["Export secrets from a project to a local ", { code: ".env" }, " file. Defaults to ", { code: ".env.{slug}.{env}" }, " if no output path is given."]],
    commands: [
      { label: "Arguments", code: "OUTPUT_FILE", description: "Output file path (optional)." },
      { label: "Flags", code: "-e, --env", description: "Environment to pull (defaults to development)." },
      { label: "Flags", code: "-p, --project", description: "Override the active project by slug." },
    ],
    code: [{
      command: [
        "# Pull development secrets to the default file",
        "windkeep pull",
        "",
        "# Pull production secrets to a specific file",
        "windkeep pull prod.env -e production",
        "",
        "# Pull from a different project",
        "windkeep pull .env.staging -e staging -p my-api",
      ].join("\n"),
    }],
  },
  {
    title: "Command: Push Secrets",
    paragraphs: [["Import secrets from a local ", { code: ".env" }, " file into the active project. Existing keys are skipped unless you pass ", { code: "--overwrite" }, "."]],
    commands: [
      { label: "Arguments", code: "INPUT_FILE", description: "Input file path (defaults to .env)." },
      { label: "Flags", code: "-e, --env", description: "Environment to push to (defaults to development)." },
      { label: "Flags", code: "--overwrite", description: "Update secrets that already exist." },
    ],
    code: [{
      command: [
        "# Push from the default .env file",
        "windkeep push",
        "",
        "# Push production secrets and overwrite existing keys",
        "windkeep push prod.env -e production --overwrite",
      ].join("\n"),
    }],
  },
]

const GUIDES_CONTENT: CliSection[] = [
  {
    title: "Workflow: New Project Setup",
    paragraphs: [[{ strong: "Scenario:" }, " You are starting a new application and want WindKeep to manage all secrets from day one."]],
    code: [{
      command: [
        "# Create your organization and project",
        "windkeep orgs create \"My Company\"",
        "windkeep projects create \"Backend API\" -d \"Main backend service\"",
        "",
        "# Add secrets for each environment",
        "windkeep secrets create DATABASE_URL \\",
        "  --description \"PostgreSQL connection\" \\",
        "  --dev \"postgres://localhost:5432/myapp_dev\" \\",
        "  --staging \"postgres://staging-db:5432/myapp\" \\",
        "  --prod \"postgres://prod-db:5432/myapp\"",
        "",
        "windkeep secrets create STRIPE_KEY \\",
        "  --description \"Stripe API key\" \\",
        "  --dev \"sk_test_abc123\" \\",
        "  --prod \"sk_live_xyz789\"",
        "",
        "# Verify secrets and start your app",
        "windkeep secrets list",
        "windkeep run npm run dev",
      ].join("\n"),
    }],
  },
  {
    title: "Workflow: Migrating from .env Files",
    paragraphs: [[{ strong: "Scenario:" }, " You have existing ", { code: ".env" }, " files and want to move secrets into WindKeep without rewriting your workflow overnight."]],
    code: [{
      command: [
        "# 1. Review keys in your local .env files (DATABASE_URL, API_KEY, etc.)",
        "",
        "# 2. Switch to the target project and create secrets",
        "windkeep projects switch my-app",
        "windkeep secrets create DATABASE_URL --dev \"postgres://localhost:5432/dev\"",
        "",
        "# 3. Add staging and production values",
        "windkeep secrets set DATABASE_URL --prod \"postgres://prod-db:5432/app\"",
        "",
        "# 4. Verify injection works, then remove local files",
        "windkeep run npm run dev",
        "rm .env.development .env.production",
        "",
        "# Alternative: bulk import from an existing .env file",
        "windkeep push .env --overwrite",
      ].join("\n"),
    }],
  },
  {
    title: "Workflow: Cross-Org Context Switching",
    paragraphs: [[{ strong: "Scenario:" }, " You work across personal and client organizations and need to switch contexts without mixing secrets."]],
    code: [{
      command: [
        "# Switch org and project, then run your app",
        "windkeep orgs switch cm123personal",
        "windkeep projects switch personal-blog",
        "windkeep run npm run dev",
        "",
        "# Create shell aliases for frequent context switches",
        "alias dev-backend='windkeep orgs switch cm123 && windkeep projects switch backend && windkeep run npm run dev'",
        "",
        "# Or override the project for a one-off command",
        "windkeep run -p other-project npm run task",
      ].join("\n"),
    }],
  },
  {
    title: "Workflow: CI/CD Pipeline Integration",
    paragraphs: [[{ strong: "Scenario:" }, " You want to inject secrets in GitHub Actions or GitLab CI without committing static config files."]],
    code: [
      {
        label: "GitHub Actions:",
        command: [
          "- name: Deploy with WindKeep secrets",
          "  env:",
          "    WINDKEEP_TOKEN: $" + "{{ secrets.WINDKEEP_TOKEN }}",
          "  run: |",
          "    windkeep login $WINDKEEP_TOKEN",
          "    windkeep projects switch my-app",
          "    windkeep run --env prod npm run build",
        ].join("\n"),
      },
      {
        label: "GitLab CI:",
        command: [
          "deploy:",
          "  stage: deploy",
          "  script:",
          "    - windkeep login $WINDKEEP_TOKEN",
          "    - windkeep projects switch my-app",
          "    - windkeep run --env prod npm run deploy",
        ].join("\n"),
      },
    ],
  },
  {
    title: "Workflow: Managing Microservices",
    paragraphs: [[{ strong: "Scenario:" }, " You run multiple services locally, each with its own project and secret set."]],
    code: [{
      command: [
        "# Terminal 1 — Auth service",
        "windkeep projects switch auth-service && windkeep run npm run dev",
        "",
        "# Terminal 2 — API gateway",
        "windkeep projects switch api-gateway && windkeep run npm run dev",
        "",
        "# Terminal 3 — Payment service",
        "windkeep projects switch payment-service && windkeep run npm run dev",
      ].join("\n"),
    }],
  },
  {
    title: "Benefits",
    paragraphs: [["Centralizing secrets in WindKeep reduces several common risks:"]],
    commands: [
      { label: "Zero disk drift", description: "No .env files to accidentally commit to version control." },
      { label: "Single source of truth", description: "Rotate keys in one place — CI/CD picks up changes on the next run." },
      { label: "Fast onboarding", description: "New developers log in, switch to the right project, and run immediately." },
      { label: "Reliable testing", description: "Run staging tests against real secrets, not stale local files." },
    ],
    code: [{ command: "windkeep run -e staging npm test" }],
  },
  {
    title: "Troubleshooting: Authentication & Context",
    code: [{
      command: [
        "# Config file not found — you are not logged in",
        "windkeep login YOUR_API_TOKEN",
        "",
        "# Token expired or invalid — re-authenticate",
        "windkeep logout",
        "windkeep login YOUR_API_TOKEN",
        "",
        "# No active organization or project — set your context",
        "windkeep orgs list",
        "windkeep orgs switch ORG_ID",
        "windkeep projects list",
        "windkeep projects switch PROJECT_SLUG",
      ].join("\n"),
    }],
  },
  {
    title: "Troubleshooting: Missing Runtime Variables",
    paragraphs: [["If ", { code: "windkeep run" }, " starts your process but environment variables are empty, work through these checks:"]],
    code: [{
      command: [
        "# Wrong environment? Defaults to development",
        "windkeep run -v -e prod npm start",
        "",
        "# Wrong project? Check context or override",
        "windkeep whoami",
        "windkeep run -p target-project-slug npm start",
        "",
        "# Missing value? Confirm the secret exists and has a value for that env",
        "windkeep secrets get DATABASE_URL",
      ].join("\n"),
    }],
  },
  {
    title: "Security & Collaboration",
    paragraphs: [["A few practices that keep secrets safe across teams:"]],
    commands: [
      { label: "Never log decrypted values", description: "Keep secrets out of logs, error reports, and metrics." },
      { label: "Least privilege", description: "Assign OWNER, ADMIN, and MEMBER roles based on what each person actually needs." },
      { label: "Verify safely", description: "Use -v/--verbose to confirm which keys are injected — values are never printed." },
    ],
  },
]

export const CLI_PAGES: Record<string, { title: string, description: string, content: CliSection[] }> = {
  "index": { title: "Command Line Interface", description: "WindKeep Command Line Interface.", content: INDEX_CONTENT },
  "orgs-projects": { title: "CLI: Organizations & Projects", description: "Manage organizations and projects with the WindKeep CLI.", content: ORGS_PROJECTS_CONTENT },
  "secrets": { title: "CLI: Secrets Management", description: "Manage secrets and run commands with the WindKeep CLI.", content: SECRETS_CONTENT },
  "guides": { title: "CLI: Guides & Troubleshooting", description: "Guides and troubleshooting for the WindKeep CLI.", content: GUIDES_CONTENT },
}

export const CLI_GUIDE_ROUTES = Object.entries(CLI_PAGES).map(([slug, page]) => ({
  slug,
  href: slug === "index" ? "/cli-guide" : `/cli-guide/${slug}`,
  label: slug === "index" ? "Overview" : page.title.replace(/^CLI: /, ""),
}))
