import SymbolMonoDark from "~/assets/symbol-mono-dark.png"
import SymbolMonoLight from "~/assets/symbol-mono-light.png"
import Symbol from "~/assets/symbol.png"
import WordmarkDark from "~/assets/wordmark-dark.png"
import WordmarkLight from "~/assets/wordmark-light.png"

// Landing page data
export const HIGHLIGHTS: { title: string, icon: string }[] = [
  { title: "Rapid Onboarding", icon: "ph:users-three-bold" },
  { title: "Free & Open Source", icon: "ph:code-bold" },
  { title: "Encrypted & Safe", icon: "ph:lock-key-bold" },
]

export const CLI_BULLETS: { description: string }[] = [
  { description: "Runtime Variable Injection" },
  { description: "Secret Pull/Push Operations" },
  { description: "Organization & Project Management" },
]

export const FEATURES: { title: string, description: string, icon: string }[] = [
  {
    title: "Role-Based Access Control",
    description: "Manage who can view, edit, or manage secrets with granular permissions at the organization and project level.",
    icon: "ph:user-check-bold",
  },
  {
    title: "Encrypted Secret Storage",
    description: "Every secret is encrypted at rest with AES-256-GCM and scoped to a specific environment, keeping sensitive data isolated and protected.",
    icon: "ph:shield-star-bold",
  },
  {
    title: "Audit Logs",
    description: "Keep track of sensitive operations, like secret and role changes, so you always know what happened and when.",
    icon: "ph:list-magnifying-glass-bold",
  },
  {
    title: "Scriptable Workflows",
    description: "Manage secrets directly from the terminal and inject them automatically into your local dev setup or CI/CD pipeline.",
    icon: "ph:terminal-bold",
  },
]

export const FAQS: { question: string, answer: string }[] = [
  {
    question: "How does role-based access control work?",
    answer: "The project and organization owner has full control, including managing settings, members, and (for projects) secrets. Admins can invite and manage members and, at the project level, manage secrets, but they can't change organization settings. Members can access data for the organization and its projects, but can't modify settings, secrets, or manage other users. This structure keeps sensitive operations secure while allowing teams to collaborate effectively.",
  },
  {
    question: "What are service tokens and how do they work?",
    answer: "Service tokens let you access secrets programmatically, without a user session. This allows you to automate secret management in your applications and CI/CD pipelines. Each token is scoped to one or more environments (Development, Staging, or Production) and can optionally be set to expire after a chosen number of days.",
  },
  {
    question: "How are audit logs used and who can see them?",
    answer: "Audit logs record sensitive actions across your organization, like secret changes, role updates, and service token creation, capturing who did it, when, and relevant metadata. They're visible to the organization Owner and Admins, providing a clear operational history for security and compliance purposes.",
  },
  {
    question: "What is the WindKeep CLI and how can I use it?",
    answer: "The WindKeep CLI allows you to interact with secrets and projects directly from your terminal, eliminating the need for hardcoded .env files and making it easy to integrate secrets into scripts and automated workflows. Whether you're retrieving secrets, updating them, or managing project/organizations, the CLI provides a secure and developer-friendly experience.",
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
      "# Authenticate with your API token",
      "windkeep login <your-api-token>",
      "",
      "# Verify your session and active context",
      "windkeep whoami",
      "",
      "# List and switch to an organization",
      "windkeep orgs list",
      "windkeep orgs switch <org-id>",
      "",
      "# List and switch to a project",
      "windkeep projects list",
      "windkeep projects switch <project-slug>",
    ],
  },
  {
    key: "run",
    label: "Run",
    description: "Inject secrets as environment variables and run any command:",
    code: [
      "# Inject dev secrets and run",
      "windkeep run npm run dev",
      "",
      "# Use a specific environment",
      "windkeep run --env prod node server.js",
      "",
      "# Show injected keys (not values)",
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
  { key: "access-control", label: "Access Control", icon: "ph:shield-check-bold" },
  { key: "settings", label: "Settings", icon: "ph:gear-six-bold" },
]

// Organization and project invitation status
export const INVITE_STATUS: { pending: string, accepted: string, expired: string } = {
  pending: "Pending",
  accepted: "Accepted",
  expired: "Expired",
}

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

// Toast icons
export const TOAST_ICONS: { danger: string, success: string, warning: string, info: string } = {
  danger: "ph:x-circle-bold",
  success: "ph:check-circle-bold",
  warning: "ph:warning-circle-bold",
  info: "ph:info-bold",
}

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
  { name: "Neutral/100", var: "--neutral-100", value: "#f5f5f5" },
  { name: "Neutral/200", var: "--neutral-200", value: "#e5e5e5" },
  { name: "Neutral/300", var: "--neutral-300", value: "#d4d4d4" },
  { name: "Neutral/400", var: "--neutral-400", value: "#a3a3a3" },
  { name: "Neutral/500", var: "--neutral-500", value: "#737373" },
  { name: "Neutral/600", var: "--neutral-600", value: "#525252" },
  { name: "Neutral/700", var: "--neutral-700", value: "#404040" },
  { name: "Neutral/800", var: "--neutral-800", value: "#171717" },
  { name: "Neutral/900", var: "--neutral-900", value: "#0a0a0a" },
]

export const BRAND_COLORS: { name: string, var: string, value: string }[] = [
  { name: "Primary", var: "--brand-primary", value: "#244664" },
  { name: "Secondary", var: "--brand-secondary", value: "#5a89a8" },
]

export const STATUS_COLORS: { name: string, darkVar: string, darkVal: string, lightVar: string, lightVal: string }[] = [
  { name: "Danger", darkVar: "--red-dark", darkVal: "#811919", lightVar: "--red-light", lightVal: "#c12525" },
  { name: "Success", darkVar: "--green-dark", darkVal: "#005e3b", lightVar: "--green-light", lightVal: "#008c59" },
  { name: "Warning", darkVar: "--orange-dark", darkVal: "#ae5f05", lightVar: "--orange-light", lightVal: "#f88e13" },
  { name: "Info", darkVar: "--blue-dark", darkVal: "#2c5c95", lightVar: "--blue-light", lightVal: "#558ccd" },
]
