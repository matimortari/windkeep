export const BASE_URL = "https://windkeep.vercel.app"

export const DEFAULT_AVATAR = "/assets/default-avatar.svg"

export const HIGHLIGHTS = [
  {
    title: "Rapid Onboarding",
    description: "Connect with your team or get your workspace up and running in seconds, so you don't miss a beat.",
    icon: "ph:users-three-bold",
  },
  {
    title: "Free & Open Source",
    description: "WindKeep is completely free to use and open source, giving you full transparency and control.",
    icon: "ph:code-bold",
  },
  {
    title: "Encrypted & Safe",
    description: "Your secrets are protected with industry-standard encryption protocols, ensuring they remain secure.",
    icon: "ph:lock-key-bold",
  },
]

export const CLI_BULLETS = [
  {
    description: "Scriptable Workflows",
  },
  {
    description: "No Hardcoded .env Files",
  },
  {
    description: "Lightweight & Fast",
  },
]

export const FEATURES = [
  {
    title: "Controlled Access",
    description: "Role-based permissions allow you to control who can manage secrets at both the organization and project levels.",
    icon: "ph:user-check",
  },
  {
    title: "Audit Logs",
    description: "Every sensitive operation, from secret changes to role updates, is logged for full traceability and accountability.",
    icon: "ph:list-magnifying-glass",
  },
  {
    title: "Secure Encryption",
    description: "Secrets are encrypted from end to end using AES-256-CBC, keeping your data safe and private.",
    icon: "ph:shield-star",
  },
  {
    title: "Command-Line Tool",
    description: "Securely access and manage secrets programmatically, integrating seamlessly into scripts or pipelines.",
    icon: "ph:terminal",
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

export const INSTALL_COMMAND = [
  " # Windows (PowerShell)",
  "irm https://windkeep.vercel.app/install/install.ps1 | iex",
  "",
  " # macOS/Linux (Bash)",
  "curl -sSL https://windkeep.vercel.app/install/install.sh | bash",
]

export const CLI_COMMANDS = [
  "windkeep login",
  "windkeep whoami",
  "windkeep projects list",
]

export const SIDEBAR_NAV_LINKS = [
  { url: "/admin/projects", icon: "ph:folder-open", label: "Projects" },
  { url: "/admin/organization", icon: "ph:building-office", label: "Organization" },
  { url: "/admin/audit-logs", icon: "ph:clipboard-text", label: "Audit Logs" },
  { url: "/admin/preferences", icon: "ph:user-gear", label: "Preferences" },
]

export const ROLES = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "MEMBER", label: "Member" },
]

export const ENVIRONMENTS = [
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
]

export const REST_METHOD_LABELS = {
  GET: "text-xs font-semibold text-[#0ec187]",
  POST: "text-xs font-semibold text-[#74a2e7]",
  PUT: "text-xs font-semibold text-[#cef1a7]",
  DELETE: "text-xs font-semibold text-[#e99795]",
}

export const OAUTH_PROVIDERS = [
  { name: "github", label: "Sign In With GitHub", icon: "simple-icons:github" },
  { name: "google", label: "Sign In With Google", icon: "simple-icons:google" },
  { name: "gitlab", label: "Sign In With GitLab", icon: "simple-icons:gitlab" },
]
