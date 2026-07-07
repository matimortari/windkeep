<template>
  <h1>
    {{ CLI_PAGES[slug]?.title }}
  </h1>

  <div v-for="(section, index) in CLI_PAGES[slug]?.content" :key="index">
    <h2 :id="slugify(section.title)">
      {{ section.title }}
    </h2>

    <p v-for="(para, pIdx) in section.paragraphs" :key="`p-${pIdx}`">
      <template v-for="(part, partIdx) in para" :key="partIdx">
        <span v-if="typeof part === 'string'">{{ part }}</span>
        <code v-else-if="'code' in part">{{ part.code }}</code>
        <strong v-else-if="'strong' in part">{{ part.strong }}</strong>
        <em v-else-if="'em' in part">{{ part.em }}</em>
        <a v-else-if="'link' in part" :href="part.link.href" :target="part.link.external ? '_blank' : undefined" :rel="part.link.external ? 'noopener noreferrer' : undefined">{{ part.link.text }}</a>
      </template>
    </p>

    <p v-if="section.note">
      <em>
        <template v-for="(part, partIdx) in section.note" :key="partIdx">
          <span v-if="typeof part === 'string'">{{ part }}</span>
          <code v-else-if="'code' in part">{{ part.code }}</code>
        </template>
      </em>
    </p>

    <div v-for="(item, iIdx) in section.install" :key="`install-${iIdx}`">
      <p>
        <strong>{{ item.label }}:</strong><br>
        <code>{{ item.command }}</code>
      </p>
    </div>

    <div v-for="(example, eIdx) in section.examples" :key="`ex-${eIdx}`">
      <p v-if="example.label">
        <strong>{{ example.label }}</strong>
      </p>
      <pre v-if="example.command"><code>{{ example.command }}</code></pre>
      <pre v-if="example.output"><code>{{ example.output }}</code></pre>
    </div>

    <p v-for="(item, aIdx) in section.args" :key="`arg-${aIdx}`">
      <strong>{{ item.label }}:</strong> <code>{{ item.code }}</code> &mdash; {{ item.description }}
    </p>

    <p v-if="section.flags?.length">
      <strong>Flags:</strong>
      <template v-for="(item, fIdx) in section.flags" :key="`flag-${fIdx}`">
        <code>{{ item.code }}</code> &mdash; {{ item.description }}<span v-if="fIdx < section.flags.length - 1">; </span>
      </template>
    </p>

    <ul v-if="section.list">
      <li v-for="(item, lIdx) in section.list" :key="lIdx">
        <strong v-if="item.label">{{ item.label }}</strong>
        <template v-if="item.description">
          &mdash; {{ item.description }}
        </template>
        <template v-for="(cmd, cIdx) in item.commands" :key="cIdx">
          <br><code>{{ cmd }}</code>
        </template>
      </li>
    </ul>

    <ul v-if="section.links">
      <li v-for="(link, lIdx) in section.links" :key="lIdx">
        <NuxtLink :to="link.href">
          <strong>{{ link.label }}</strong>
        </NuxtLink>
        &mdash; {{ link.description }}
      </li>
    </ul>

    <ul v-if="section.downloads">
      <li v-for="(item, dIdx) in section.downloads" :key="dIdx">
        <a :href="item.href"><strong>{{ item.label }}</strong></a> &mdash; {{ item.description }}
      </li>
    </ul>

    <ol v-if="section.steps">
      <li v-for="(step, sIdx) in section.steps" :key="sIdx">
        {{ step }}
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const route = useRoute()
const param = route.params.slug as string | string[]
const slug = (Array.isArray(param) ? param.join("/") : param) || "index"

const INDEX_CONTENT: CliSection[] = [
  {
    title: "Overview",
    paragraphs: [["The WindKeep CLI manages secrets, organizations, and projects from your terminal — fast, secure, and built for developers."]],
  },
  {
    title: "Quick Installation",
    install: [
      { label: "Linux", command: "curl -sSL https://windkeep.up.railway.app/install/install.sh | bash" },
      { label: "Windows (PowerShell)", command: "irm https://windkeep.up.railway.app/install/install.ps1 | iex" },
    ],
  },
  {
    title: "Manual Downloads",
    downloads: [
      { href: "https://windkeep.up.railway.app/api/downloads/windkeep-linux-amd64", label: "Linux (x64)", description: "Ubuntu, Debian, Fedora, and other Linux distros." },
      { href: "https://windkeep.up.railway.app/api/downloads/windkeep-windows-amd64.exe", label: "Windows (x64)", description: "Windows 10/11." },
    ],
  },
  {
    title: "Manual Setup: Linux",
    paragraphs: [["After downloading the binary, run:"]],
    list: [
      { description: "Navigate to downloads:", commands: ["cd ~/Downloads"] },
      { description: "Make it executable:", commands: ["chmod +x windkeep-*"] },
      { description: "Move to PATH:", commands: ["mv windkeep-* ~/.local/bin/windkeep"] },
      { description: "Export PATH:", commands: ["export PATH=\"$HOME/.local/bin:$PATH\""] },
      { description: "Verify:", commands: ["windkeep --version"] },
    ],
  },
  {
    title: "Manual Setup: Windows",
    paragraphs: [["After downloading the ", { code: ".exe" }, ", open PowerShell:"]],
    list: [
      { commands: ["Move-Item windkeep-windows-amd64.exe $env:LOCALAPPDATA\\Programs\\windkeep\\windkeep.exe"] },
      { description: "Add %LOCALAPPDATA%\\Programs\\windkeep to PATH, restart the terminal, then verify:", commands: ["windkeep --version"] },
    ],
  },
  {
    title: "Authentication",
    paragraphs: [["Sign in to WindKeep and copy your API token from the ", { link: { href: "https://windkeep.com/admin/preferences", text: "preferences page", external: true } }, "."]],
    note: ["Logging in validates your token and saves config to ", { code: "~/.windkeep/config.yaml" }, "."],
    list: [
      { description: "Authenticate with a token:", commands: ["windkeep login YOUR_API_TOKEN"] },
      { description: "Interactive login (hidden input):", commands: ["windkeep login"] },
      { description: "Show active context:", commands: ["windkeep whoami"] },
      { description: "Clear stored credentials:", commands: ["windkeep logout"] },
    ],
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
    paragraphs: [["Organizations are team workspaces; projects are secret containers inside them. You can belong to multiple orgs, each with its own projects and roles."]],
  },
  {
    title: "Context & Roles",
    paragraphs: [[{ strong: "Active organization" }, " sets where new projects are created. ", { strong: "Active project" }, " is the default target for secret commands (override with flags)."], ["Organization roles:"]],
    list: [
      { label: "OWNER", description: "Full control over the org, projects, and members." },
      { label: "ADMIN", description: "Manage projects and secrets; cannot delete the org." },
      { label: "MEMBER", description: "View and use secrets in assigned projects." },
    ],
  },
  {
    title: "Organizations: List",
    paragraphs: [["List orgs you belong to, with role and active status."]],
    examples: [{
      label: "Example & Output:",
      command: "windkeep orgs list",
      output: "ID             NAME              ROLE    ACTIVE\ncm123abc456    My Organization   OWNER   ✓\ncm789def012    Team Workspace    ADMIN\ncm456ghi789    Client Project    MEMBER",
    }],
  },
  {
    title: "Organizations: Create",
    paragraphs: [["Create an org. You become owner and it becomes active."]],
    args: [{ label: "Arguments", code: "NAME", description: "Organization name (required)." }],
    examples: [{ command: "windkeep orgs create \"My Company\"" }],
  },
  {
    title: "Organizations: Switch",
    paragraphs: [["Switch active org. Clears the active project because projects are org-scoped."]],
    args: [{ label: "Arguments", code: "ORG_ID", description: "Target org ID (optional — opens interactive selector)." }],
    examples: [{
      label: "Example & Output:",
      command: "windkeep orgs switch cm789def012",
      output: "✓ Switched to organization 'Team Workspace'\nℹ Active project cleared (projects are organization-specific)",
    }],
    note: ["Tip: run ", { code: "windkeep orgs list" }, " to see org IDs."],
  },
  {
    title: "Organizations: Update",
    paragraphs: [["Rename your active org. Requires OWNER or ADMIN."]],
    args: [{ label: "Arguments", code: "NAME", description: "New organization name (required)." }],
    examples: [{
      command: "# Switch first, then update\nwindkeep orgs switch cm123abc456\nwindkeep orgs update \"New Company Name\"",
    }],
  },
  {
    title: "Projects: List",
    paragraphs: [["List projects in your active organization."]],
    examples: [{
      label: "Example & Output:",
      command: "windkeep projects list",
      output: "ID             NAME           SLUG           ORGANIZATION    SECRETS\ncm111aaa111    My Project     my-project     My Organization 5\ncm222bbb222    API Service    api-service    Team Workspace  12",
    }],
  },
  {
    title: "Projects: Create",
    paragraphs: [["Create a project in the active org. Slug is generated from the name."]],
    args: [{ label: "Arguments", code: "NAME", description: "Project name (required)." }],
    flags: [{ code: "-d, --description", description: "Optional description." }],
    examples: [{
      command: "windkeep projects create \"My Project\"\nwindkeep projects create \"API Service\" -d \"Backend API\"",
    }],
  },
  {
    title: "Projects: Switch",
    paragraphs: [["Set the active project for future commands."]],
    args: [{ label: "Arguments", code: "PROJECT_SLUG", description: "Target slug (optional — opens interactive selector)." }],
    examples: [{
      label: "Example & Output:",
      command: "windkeep projects switch api-service",
      output: "✓ Switched to project 'API Service' (slug: api-service)",
    }],
    note: ["Tip: run ", { code: "windkeep projects list" }, " to see slugs."],
  },
  {
    title: "Projects: Update",
    paragraphs: [["Update name, slug, or description."]],
    args: [{ label: "Arguments", code: "PROJECT_SLUG", description: "Project to update (required)." }],
    flags: [
      { code: "-n, --name", description: "New name." },
      { code: "-s, --slug", description: "New slug." },
      { code: "-d, --description", description: "New description." },
    ],
    examples: [{
      command: "windkeep projects update my-project \\\n  --name \"API Service v2\" \\\n  --slug api-service-v2 \\\n  --description \"Updated backend API\"",
    }],
  },
  {
    title: "Projects: Delete",
    paragraphs: [["Delete a project and all its secrets. ", { strong: "This cannot be undone." }]],
    args: [{ label: "Arguments", code: "PROJECT_SLUG", description: "Project to delete (required)." }],
    flags: [{ code: "--confirm", description: "Skip confirmation prompt." }],
    examples: [{ command: "windkeep projects delete old-project --confirm" }],
  },
  {
    title: "Common Workflows",
    list: [
      {
        label: "New org and project:",
        commands: [
          "windkeep orgs create \"My Startup\"",
          "windkeep whoami",
          "windkeep projects create \"Backend API\"",
        ],
      },
      {
        label: "Switch orgs and projects:",
        commands: [
          "windkeep orgs list",
          "windkeep orgs switch cm789def012",
          "windkeep projects list",
          "windkeep projects switch my-project",
        ],
      },
      {
        label: "Cross-org work:",
        commands: [
          "windkeep orgs switch cm123abc456 && windkeep projects switch personal-app && windkeep run npm run dev",
          "windkeep orgs switch cm789def012 && windkeep projects switch work-api && windkeep run --env prod npm start",
        ],
      },
      {
        label: "First project with secrets:",
        commands: [
          "windkeep whoami",
          "windkeep projects create \"My App\" -d \"My application\"",
          "windkeep secrets create DATABASE_URL --dev \"postgres://localhost:5432/dev\"",
        ],
      },
    ],
  },
  {
    title: "Migrating Projects Between Orgs",
    note: ["Projects cannot move between orgs via the CLI."],
    steps: [
      "Export secrets from the old project.",
      "Create a new project in the target org.",
      "Import secrets to the new project.",
      "Delete the old project when done.",
    ],
    examples: [{
      label: "Example sequence:",
      command: "windkeep orgs switch cm123old && windkeep projects switch old-project\n# Export secrets via dashboard\nwindkeep orgs switch cm456new && windkeep projects create \"Migrated Project\"\n# Import secrets via dashboard\nwindkeep orgs switch cm123old && windkeep projects delete old-project --confirm",
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
    paragraphs: [["Secrets are environment variables stored in WindKeep. Each secret can hold different values per environment (development, staging, production)."]],
  },
  {
    title: "Understanding Secrets",
    paragraphs: [
      ["Store connection strings, API tokens, OAuth credentials, and encryption keys."],
      ["Each secret supports per-environment values:"],
      [{ strong: "Important:" }, " Secret commands need an active project. Run ", { code: "windkeep projects switch" }, " first."],
    ],
    list: [
      { label: "DEVELOPMENT", description: "Local development values." },
      { label: "STAGING", description: "Test and QA environments." },
      { label: "PRODUCTION", description: "Live application values." },
    ],
  },
  {
    title: "Command: List Secrets",
    paragraphs: [["List secrets in the active project with environments and metadata."]],
    examples: [{
      label: "Example & Output:",
      command: "windkeep secrets list",
      output: "KEY            ENVIRONMENTS                     DESCRIPTION          UPDATED\nDATABASE_URL   DEVELOPMENT, STAGING, PRODUCTION  Database connection  2d ago\nAPI_KEY        PRODUCTION                        Third-party API key  5m ago",
    }],
  },
  {
    title: "Command: Get Secret",
    paragraphs: [["Show decrypted values and metadata for a key."]],
    args: [{ label: "Arguments", code: "KEY", description: "Secret key name (required)." }],
    examples: [{
      label: "Example & Output:",
      command: "windkeep secrets get DATABASE_URL",
      output: "Key:     DATABASE_URL\nDesc:    Database connection string\nUpdated: 2d ago\n\nENVIRONMENT  VALUE\nDEVELOPMENT  postgres://localhost:5432/dev\nSTAGING      postgres://staging-db:5432/app\nPRODUCTION   postgres://prod-db:5432/app",
    }],
  },
  {
    title: "Command: Create Secret",
    paragraphs: [["Create a secret in the active project. Set values per environment with flags."]],
    args: [{ label: "Arguments", code: "KEY", description: "Secret key (required; uppercase recommended)." }],
    flags: [
      { code: "-d, --description", description: "Optional description." },
      { code: "--dev, --staging, --prod", description: "Environment values." },
    ],
    examples: [{
      command: "windkeep secrets create DATABASE_URL \\\n  --description \"Database connection string\" \\\n  --dev \"postgres://localhost:5432/dev\" \\\n  --staging \"postgres://staging-db:5432/app\" \\\n  --prod \"postgres://prod-db:5432/app\"\n\nwindkeep secrets create API_KEY --description \"Production API key\" --prod \"sk_live_abc123\"",
    }],
  },
  {
    title: "Command: Set Secret",
    paragraphs: [["Update values for an existing secret. Only specified environments change."]],
    args: [{ label: "Arguments", code: "KEY", description: "Secret key (required)." }],
    examples: [{
      command: "windkeep secrets set DATABASE_URL --prod \"postgres://new-prod-db:5432/app\"\nwindkeep secrets set API_KEY --staging \"sk_test_xyz789\" --prod \"sk_live_xyz789\"",
    }],
  },
  {
    title: "Command: Secret History",
    paragraphs: [["Audit changes with user and timestamp details."]],
    flags: [{ code: "-e, --env", description: "Filter by environment (dev/staging/prod)." }],
    examples: [{
      label: "Example & Output:",
      command: "windkeep secrets history DATABASE_URL -e prod",
      output: "History for: DATABASE_URL\n\n[PRODUCTION] current: postgres://prod-db:5432/app\nVALUE                          CHANGED BY  WHEN\npostgres://old-prod-db:5432/app  Alice Smith  3d ago",
    }],
  },
  {
    title: "Command: Delete Secret",
    paragraphs: [["Permanently delete a secret across all environments. ", { strong: "This cannot be undone." }]],
    flags: [{ code: "--confirm", description: "Skip confirmation prompt." }],
    examples: [{ command: "windkeep secrets delete OLD_API_KEY --confirm" }],
  },
  {
    title: "Injecting Secrets at Runtime",
    paragraphs: [
      [{ code: "windkeep run" }, " injects secrets into a process without writing ", { code: ".env" }, " files."],
      [{ strong: "Format:" }, " ", { code: "windkeep run [command] [args...]" }],
    ],
    flags: [
      { code: "-e, --env", description: "Environment (defaults to development)." },
      { code: "-p, --project", description: "Override active project." },
      { code: "-v, --verbose", description: "Show injected keys." },
    ],
    examples: [{
      command: "windkeep run npm run dev\nwindkeep run --env prod python app.py\nwindkeep run -p api-service -e staging node server.js",
    }],
  },
]

const GUIDES_CONTENT: CliSection[] = [
  {
    title: "Workflow: New Project Setup",
    paragraphs: [[{ strong: "Scenario:" }, " Bootstrap a new app with WindKeep from scratch."]],
    list: [
      { commands: ["windkeep orgs create \"My Company\""], description: "Create org." },
      { commands: ["windkeep projects create \"Backend API\" -d \"Main backend service\""], description: "Create project." },
      { commands: ["windkeep secrets create DATABASE_URL --description \"PostgreSQL connection\" --dev \"postgres://localhost:5432/myapp_dev\" --staging \"postgres://staging-db:5432/myapp\" --prod \"postgres://prod-db:5432/myapp\""] },
      { commands: ["windkeep secrets create STRIPE_KEY --description \"Stripe API key\" --dev \"sk_test_abc123\" --prod \"sk_live_xyz789\""] },
      { commands: ["windkeep secrets list && windkeep run npm run dev"], description: "Verify and run." },
    ],
  },
  {
    title: "Workflow: Migrating from .env Files",
    paragraphs: [[{ strong: "Scenario:" }, " Replace local ", { code: ".env" }, " files with WindKeep secrets."]],
    list: [
      { label: "1. Audit keys", description: "Review DATABASE_URL, API_KEY, etc. in local files." },
      {
        label: "2. Create secrets",
        commands: [
          "windkeep projects switch my-app",
          "windkeep secrets create DATABASE_URL --dev \"postgres://localhost:5432/dev\"",
        ],
      },
      { label: "3. Add prod/staging", commands: ["windkeep secrets set DATABASE_URL --prod \"postgres://prod-db:5432/app\""] },
      { label: "4. Verify and clean up", commands: ["windkeep run npm run dev && rm .env.development .env.production"] },
    ],
  },
  {
    title: "Workflow: Cross-Org Context Switching",
    paragraphs: [[{ strong: "Scenario:" }, " Work across personal and client orgs without mixing contexts."]],
    list: [
      {
        label: "Switch contexts:",
        commands: ["windkeep orgs switch cm123personal && windkeep projects switch personal-blog && windkeep run npm run dev"],
      },
      {
        label: "Shell aliases:",
        commands: ["alias dev-backend='windkeep orgs switch cm123 && windkeep projects switch backend && windkeep run npm run dev'"],
      },
      {
        label: "One-off override:",
        commands: ["windkeep run -p other-project npm run task"],
      },
    ],
  },
  {
    title: "Workflow: CI/CD Pipeline Integration",
    paragraphs: [[{ strong: "Scenario:" }, " Inject secrets in GitHub Actions or GitLab CI without static config files."]],
    examples: [{
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
    }, {
      label: "GitLab CI:",
      command: "deploy:\n  stage: deploy\n  script:\n    - windkeep login $WINDKEEP_TOKEN\n    - windkeep run --env prod npm run deploy",
    }],
  },
  {
    title: "Workflow: Managing Microservices",
    paragraphs: [[{ strong: "Scenario:" }, " Run multiple services locally, each with its own project context."]],
    list: [
      { label: "Terminal 1 (Auth)", commands: ["windkeep projects switch auth-service && windkeep run npm run dev"] },
      { label: "Terminal 2 (Gateway)", commands: ["windkeep projects switch api-gateway && windkeep run npm run dev"] },
      { label: "Terminal 3 (Payments)", commands: ["windkeep projects switch payment-service && windkeep run npm run dev"] },
    ],
  },
  {
    title: "Benefits",
    paragraphs: [["Centralized secrets reduce common risks:"]],
    list: [
      { label: "Zero disk drift", description: "No .env files to commit by accident." },
      { label: "Single source of truth", description: "Rotate keys in CI/CD without redeploying env files." },
      { label: "Fast onboarding", description: "New devs log in and run immediately." },
      { label: "Reliable testing", description: "Run staging tests with:", commands: ["windkeep run -e staging npm test"] },
    ],
  },
  {
    title: "Troubleshooting: Authentication & Context",
    list: [
      { label: "Config file not found", description: "Not logged in. Run ", commands: ["windkeep login YOUR_API_TOKEN"] },
      { label: "Not authenticated", description: "Token expired. Run ", commands: ["windkeep logout", "windkeep login YOUR_API_TOKEN"] },
      {
        label: "No active organization / project",
        description: "Set context:",
        commands: [
          "windkeep orgs list && windkeep orgs switch [ORG_ID]",
          "windkeep projects list && windkeep projects switch [PROJECT_SLUG]",
        ],
      },
    ],
  },
  {
    title: "Troubleshooting: Missing Runtime Variables",
    paragraphs: [["If ", { code: "windkeep run" }, " starts but env vars are empty, check:"]],
    list: [
      { label: "Environment mismatch", description: "Defaults to development. Try:", commands: ["windkeep run -v -e prod npm start"] },
      { label: "Wrong project", description: "Check context or override the project:", commands: ["windkeep whoami", "windkeep run -p target-project-slug npm start"] },
      { label: "Missing value", description: "Confirm the key exists:", commands: ["windkeep secrets get [KEY]"] },
    ],
  },
  {
    title: "Security & Collaboration",
    list: [
      { label: "Never log decrypted values", description: "Keep secrets out of logs and metrics." },
      { label: "Least privilege", description: "Use OWNER, ADMIN, and MEMBER roles appropriately." },
      { label: "Verify safely", description: "Use -v/--verbose to confirm key names without exposing values." },
    ],
  },
]

const CLI_PAGES: Record<string, { title: string, description: string, content: CliSection[] }> = {
  "index": { title: "Command Line Interface", description: "WindKeep Command Line Interface.", content: INDEX_CONTENT },
  "orgs-projects": { title: "CLI: Organizations & Projects", description: "Manage organizations and projects with the WindKeep CLI.", content: ORGS_PROJECTS_CONTENT },
  "secrets": { title: "CLI: Secrets Management", description: "Manage secrets and run commands with the WindKeep CLI.", content: SECRETS_CONTENT },
  "guides": { title: "CLI: Guides & Troubleshooting", description: "Guides and troubleshooting for the WindKeep CLI.", content: GUIDES_CONTENT },
}

useHead({
  title: CLI_PAGES[slug]?.title,
  link: [{ rel: "canonical", href: `${baseURL}/cli-guide/${slug === "index" ? "" : slug}` }],
  meta: [{ name: "description", content: CLI_PAGES[slug]?.description }],
})

definePageMeta({ layout: "content" })
</script>
