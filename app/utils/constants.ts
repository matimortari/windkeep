import SymbolMonoDark from "~/assets/symbol-mono-dark.png"
import SymbolMonoLight from "~/assets/symbol-mono-light.png"
import Symbol from "~/assets/symbol.png"
import WordmarkDark from "~/assets/wordmark-dark.png"
import WordmarkLight from "~/assets/wordmark-light.png"

// Landing page data
export const HIGHLIGHTS: { title: string, icon: string }[] = [
  { title: "Encrypted & Safe", icon: "ph:lock-key-bold" },
  { title: "Rapid Onboarding", icon: "ph:users-three-bold" },
  { title: "Free & Open Source", icon: "ph:code-bold" },
]

export const CLI_BULLETS: { description: string }[] = [
  { description: "Scriptable Workflows" },
  { description: "No Hardcoded .env Files" },
  { description: "Lightweight & Fast" },
]

export const FEATURES: { title: string, description: string, icon: string }[] = [
  {
    title: "Controlled Access",
    description: "Role-based permissions allow you to control who can manage secrets at both the organization and project levels.",
    icon: "ph:user-check-bold",
  },
  {
    title: "Audit Logs",
    description: "Sensitive operations, from secret changes to role updates, are logged for full traceability and accountability.",
    icon: "ph:list-magnifying-glass-bold",
  },
  {
    title: "Secure Encryption",
    description: "Secrets are encrypted from end to end using AES-256-GCM, keeping your data safe and private.",
    icon: "ph:shield-star-bold",
  },
  {
    title: "Command-Line Tool",
    description: "Securely access and manage secrets programmatically, integrating seamlessly into scripts or pipelines.",
    icon: "ph:terminal-bold",
  },
]

export const FAQS: { question: string, answer: string }[] = [
  {
    question: "How does role-based access control work for organizations?",
    answer: "Each organization has a single Owner, who can manage its projects and members, and configure org-wide settings. Admins can invite and manage members, but they don't have full control over organization settings. Members can access the data for the organization and the projects they belong to, but they cannot modify settings or manage other users. This structure keeps sensitive operations secure while allowing teams to collaborate effectively.",
  },
  {
    question: "How does role-based access control work for projects?",
    answer: "Projects follow a similar structure to organizations. The Project Owner has full control over the project, its secrets and members. Admins can add or remove members, update roles, and manage secrets, but they cannot change project ownership. Members can view secrets, but cannot modify them or adjust project settings. This ensures that project-level operations are handled securely.",
  },
  {
    question: "What is audit logging and why is it important?",
    answer: "Audit logs record actions performed within the workspace – such as updating secrets, changing roles, or modifying projects. Each log entry captures who performed the action, timestamps, and additional metadata. Audit logs help teams stay transparent, investigate issues, and maintain accountability. All members in the organization can view the logs, and the Owner can clear them if desired.",
  },
  {
    question: "What is the WindKeep CLI and how can i use it?",
    answer: "The WindKeep CLI allows you to interact with secrets and projects directly from your terminal, eliminating the need for hardcoded .env files and making it easy to integrate secrets into scripts and automated workflows. Whether you're retrieving secrets, updating them, or managing project settings, the CLI makes these tasks faster, more consistent, and scriptable.",
  },
]

export const CLI_TABS: { key: string, label: string, description: string, code: string[] }[] = [
  {
    key: "install",
    label: "Installation",
    description: "Run the following command from your terminal:",
    code: [
      " # Windows (PowerShell)",
      "irm https://windkeep.up.railway.app/install/install.ps1 | iex",
      "",
      " # Linux (Bash)",
      "curl -sSL https://windkeep.up.railway.app/install/install.sh | bash",
    ],
  },
  {
    key: "commands",
    label: "Getting Started",
    description: "Authenticate and set up your workspace:",
    code: [
      "# authenticate with your API token",
      "windkeep login <your-api-token>",
      "",
      "# verify your session and active context",
      "windkeep whoami",
      "",
      "# list and switch to an organization",
      "windkeep orgs list",
      "windkeep orgs switch <org-id>",
      "",
      "# list and switch to a project",
      "windkeep projects list",
      "windkeep projects switch <project-slug>",
    ],
  },
  {
    key: "run",
    label: "Run",
    description: "Inject secrets as env vars and run any command:",
    code: [
      "# inject dev secrets and run",
      "windkeep run npm run dev",
      "",
      "# use a specific environment",
      "windkeep run --env prod node server.js",
      "",
      "# show injected keys (not values)",
      "windkeep run -v npm start",
    ],
  },
]

// Admin dashboard navigation tabs
export const ORGANIZATION_TABS: { key: string, label: string, icon: string }[] = [
  { key: "projects", label: "Projects", icon: "ph:folder-open-bold" },
  { key: "members", label: "Members", icon: "ph:users-bold" },
  { key: "audit-logs", label: "Audit Logs", icon: "ph:clipboard-text-bold" },
  { key: "settings", label: "Settings", icon: "ph:gear-six-bold" },
]

export const PROJECT_TABS: { key: string, label: string, icon: string }[] = [
  { key: "secrets", label: "Secrets", icon: "ph:stack-bold" },
  { key: "members", label: "Members", icon: "ph:users-bold" },
  { key: "service-tokens", label: "Service Tokens", icon: "ph:key-bold" },
  { key: "settings", label: "Settings", icon: "ph:gear-six-bold" },
]

// Organization and project roles
export const ROLES: { value: Role, label: string }[] = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "MEMBER", label: "Member" },
]

// Environment options for secrets
export const ENVIRONMENTS: { value: Environment, label: string }[] = [
  { value: "DEVELOPMENT", label: "Development" },
  { value: "STAGING", label: "Staging" },
  { value: "PRODUCTION", label: "Production" },
]

// OAuth providers
export const OAUTH_PROVIDERS: { name: string, label: string, icon: string }[] = [
  { name: "google", label: "Sign In With Google", icon: "simple-icons:google" },
  { name: "github", label: "Sign In With GitHub", icon: "simple-icons:github" },
  { name: "gitlab", label: "Sign In With GitLab", icon: "simple-icons:gitlab" },
]

// Brand assets
export const SYMBOLS: { name: string, image: any, bgClass: string }[] = [
  { name: "Symbol", image: Symbol, bgClass: "bg-neutral-100" },
  { name: "Symbol Mono (dark)", image: SymbolMonoDark, bgClass: "bg-neutral-100" },
  { name: "Symbol Mono (light)", image: SymbolMonoLight, bgClass: "bg-neutral-900" },
]

export const WORDMARKS: { name: string, image: any, bgClass: string }[] = [
  { name: "Wordmark (dark)", image: WordmarkDark, bgClass: "bg-neutral-100" },
  { name: "Wordmark (light)", image: WordmarkLight, bgClass: "bg-neutral-900" },
]

export const NEUTRAL_SCALE: { name: string, var: string, value: string }[] = [
  { name: "Neutral/100", var: "--neutral-100", value: "#fafafa" },
  { name: "Neutral/200", var: "--neutral-200", value: "#f5f5f5" },
  { name: "Neutral/300", var: "--neutral-300", value: "#d4d4d4" },
  { name: "Neutral/400", var: "--neutral-400", value: "#a3a3a3" },
  { name: "Neutral/500", var: "--neutral-500", value: "#737373" },
  { name: "Neutral/600", var: "--neutral-600", value: "#525252" },
  { name: "Neutral/700", var: "--neutral-700", value: "#404040" },
  { name: "Neutral/800", var: "--neutral-800", value: "#171717" },
  { name: "Neutral/900", var: "--neutral-900", value: "#0a0a0a" },
]

export const BRAND_COLORS: { name: string, var: string, value: string }[] = [
  { name: "Primary", var: "--brand-primary", value: "#3d536d" },
  { name: "Secondary", var: "--brand-secondary", value: "#597c8b" },
]

export const STATUS_COLORS: { name: string, darkVar: string, darkVal: string, lightVar: string, lightVal: string }[] = [
  { name: "Danger", darkVar: "--red-dark", darkVal: "#811919", lightVar: "--red-light", lightVal: "#c12525" },
  { name: "Success", darkVar: "--green-dark", darkVal: "#005e3b", lightVar: "--green-light", lightVal: "#008c59" },
  { name: "Warning", darkVar: "--orange-dark", darkVal: "#ae5f05", lightVar: "--orange-light", lightVal: "#f88e13" },
  { name: "Info", darkVar: "--blue-dark", darkVal: "#2c5c95", lightVar: "--blue-light", lightVal: "#558ccd" },
]
