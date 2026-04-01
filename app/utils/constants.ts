import SymbolMonoDark from "~/assets/symbol-mono-dark.png"
import SymbolMonoLight from "~/assets/symbol-mono-light.png"
import Symbol from "~/assets/symbol.png"
import WordmarkDark from "~/assets/wordmark-dark.png"
import WordmarkLight from "~/assets/wordmark-light.png"

// Landing page constants
export const HIGHLIGHTS = [
  { title: "Encrypted & Safe", icon: "ph:lock-key-bold" },
  { title: "Rapid Onboarding", icon: "ph:users-three-bold" },
  { title: "Free & Open Source", icon: "ph:code-bold" },
]

export const CLI_BULLETS = [
  { description: "Scriptable Workflows" },
  { description: "No Hardcoded .env Files" },
  { description: "Lightweight & Fast" },
]

export const FEATURES = [
  {
    title: "Controlled Access",
    description: "Role-based permissions allow you to control who can manage secrets at both the organization and project levels.",
    icon: "ph:user-check-bold",
  },
  {
    title: "Audit Logs",
    description: "Every sensitive operation, from secret changes to role updates, is logged for full traceability and accountability.",
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

export const FAQS = [
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

export const CLI_TABS = [
  {
    key: "install",
    label: "Installation",
    description: "Run the following command from your terminal:",
    code: [
      " # Windows (PowerShell)",
      "irm https://windkeep.up.railway.app/install/install.ps1 | iex",
      "",
      " # macOS/Linux (Bash)",
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

// Admin dashboard constants
export const SIDEBAR_NAV_LINKS = [
  { url: "/admin/projects", icon: "ph:folder-open-bold", label: "Projects" },
  { url: "/admin/organization", icon: "ph:building-office-bold", label: "Organization" },
  { url: "/admin/audit-logs", icon: "ph:clipboard-text-bold", label: "Audit Logs" },
  { url: "/admin/preferences", icon: "ph:user-gear-bold", label: "Preferences" },
]

// Organization and project roles
export const ROLES = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "MEMBER", label: "Member" },
]

// Environment options for secrets
export const ENVIRONMENTS = [
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
]

// REST method label styles for documentation display
export const REST_METHOD_LABELS = {
  GET: "text-xs font-semibold text-[#0ec187]",
  POST: "text-xs font-semibold text-[#74a2e7]",
  PUT: "text-xs font-semibold text-[#cef1a7]",
  DELETE: "text-xs font-semibold text-[#e99795]",
}

// OAuth providers
export const OAUTH_PROVIDERS = [
  { name: "github", label: "Sign In With GitHub", icon: "simple-icons:github" },
  { name: "google", label: "Sign In With Google", icon: "simple-icons:google" },
  { name: "gitlab", label: "Sign In With GitLab", icon: "simple-icons:gitlab" },
]

// Brand constants
export const BRAND_SECTIONS = [
  { id: "wordmarks", label: "Wordmarks" },
  { id: "symbols", label: "Symbols" },
  { id: "brand", label: "Brand Colors" },
  { id: "neutral", label: "Neutral Colors" },
  { id: "status", label: "Status Colors" },
]

export const SYMBOLS = [
  { name: "Symbol", image: Symbol, bgClass: "bg-background!" },
  { name: "Symbol Mono (dark)", image: SymbolMonoDark, bgClass: "bg-[#fafafa]!" },
  { name: "Symbol Mono (light)", image: SymbolMonoLight, bgClass: "bg-[#0a0a0a]!" },
]

export const WORDMARKS = [
  { name: "Wordmark (dark)", image: WordmarkDark, bgClass: "bg-[#fafafa]!" },
  { name: "Wordmark (light)", image: WordmarkLight, bgClass: "bg-[#0a0a0a]!" },
]

export const BRAND_COLORS = [
  { name: "Primary", var: "--primary" },
  { name: "Secondary", var: "--secondary" },
]

export const NEUTRAL_COLORS = [
  { name: "Background", var: "--background" },
  { name: "Foreground", var: "--foreground" },
  { name: "Card", var: "--card" },
  { name: "Input", var: "--input" },
  { name: "Muted", var: "--muted" },
  { name: "Muted Foreground", var: "--muted-foreground" },
]

export const STATUS_COLORS = [
  { name: "Danger", var: "--danger" },
  { name: "Success", var: "--success" },
  { name: "Warning", var: "--warning" },
  { name: "Info", var: "--info" },
]
