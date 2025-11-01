export const BASE_URL = "https://secretkeepr.vercel.app"

export const API_URL = "/api"

export const HIGHLIGHTS = [
  {
    title: "Rapid Onboarding",
    description: "Provision your workspace and start managing secrets in seconds with minimal configuration.",
  },
  {
    title: "Open Source Transparency",
    description: "All code is open-source and free to use, ensuring trust and extensibility.",
  },
  {
    title: "Security-First Architecture",
    description: "Secrets are encrypted end-to-end using AES-256-CBC with per-secret random IVs.",
  },
]

export const FEATURES = [
  {
    title: "End-to-End Encryption",
    description: "Secrets remain encrypted at rest and in transit, via AES-256 encryption.",
    icon: "dinkie-icons:lock",
  },
  {
    title: "Access Control",
    description: "Role-based permissions allow fine-grained control over who can view, edit, or manage secrets at organization and project level.",
    icon: "dinkie-icons:entry",
  },
  {
    title: "Audit Logging",
    description: "All sensitive operations, including secret modifications and organization changes, are logged and timestamped.",
    icon: "dinkie-icons:right-magnifying-glass",
  },
  {
    title: "Command Line Interface",
    description: "Interact with secrets programmatically via the open-source command-line interface, powered by Go.",
    icon: "dinkie-icons:code",
  },
]

export const FAQS = [
  {
    question: "How does role-based access control work for organizations?",
    answer: "Organizations have three roles: Owner, Admin, and Member. Owners have full control over the organization, its projects, and members. Admins can invite and manage members. Members don't have any administrative privileges, but can access the secrets of projects they are part of.",
  },
  {
    question: "How does role-based access control work for projects?",
    answer: "Projects have three roles: Owner, Admin, and Member. Owners have full control over the project and its secrets. Admins can add and remove members, update roles, and handle secrets. Members can only view secrets within the project.",
  },
  {
    question: "How does audit logging work?",
    answer: "All actions within an organization are logged with timestamps and metadata, providing a clear history for transparency and accountability. Audit logs are visible to all members, but only the organization Owner can selectively delete entries.",
  },
  {
    question: "What are the benefits of using the CLI?",
    answer: "The CLI tool allows users to retrieve secrets for a project directly from their IDE or terminal, eliminating the need for a hardcoded .env file. It also enables the automation of project/organization management tasks via scripts.",
  },
]

export const INSTALL_COMMAND = "go install github.com/matimortari/secretkeepr/cli@latest"

export const CLI_COMMANDS = [
  "secretkeepr login",
  "secretkeepr whoami",
  "secretkeepr project list-all",
]

export const SIDEBAR_NAV_LINKS = [
  { url: "/admin/projects", icon: "ph:folder-open", label: "Projects" },
  { url: "/admin/organization", icon: "ph:building-office", label: "Organization" },
  { url: "/admin/audit-logs", icon: "ph:clipboard-text", label: "Audit Logs" },
  { url: "/admin/preferences", icon: "ph:user-gear", label: "Preferences" },
]

export const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
]

export const ENVIRONMENTS = [
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
]

export const REST_METHOD_COLORS = {
  GET: "bg-[#123733] border-[#0ec187] text-[#0ec187]",
  POST: "bg-[#202f46] border-[#74a2e7] text-[#74a2e7]",
  PUT: "bg-[#37413b] border-[#cef1a7] text-[#cef1a7]",
  DELETE: "bg-[#3b3138] border-[#e99795] text-[#e99795]",
}

export const OAUTH_PROVIDERS = [
  { name: "github", label: "Sign In With Github", icon: "simple-icons:github" },
  { name: "google", label: "Sign In With Google", icon: "simple-icons:google" },
  { name: "gitlab", label: "Sign In With GitLab", icon: "simple-icons:gitlab" },
]
