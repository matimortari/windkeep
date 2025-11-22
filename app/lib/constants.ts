export const BASE_URL = "https://secretkeepr.vercel.app"

export const API_URL = "/api"

export const HIGHLIGHTS = [
  {
    title: "Rapid Onboarding",
    description: "Get your workspace up and running in seconds with a minimal setup, so you can quickly start managing your secrets.",
  },
  {
    title: "Free & Open Source",
    description: "SecretkeepR is a fully open-source project, giving you full visibility into the codebase and the flexibility to extend it as needed.",
  },
  {
    title: "Encrypted & Safe",
    description: "Every secret is securely encrypted from end to end using AES-256-CBC with a unique key for each secret, keeping your data safe and private.",
  },
]

export const FEATURES = [
  {
    title: "Controlled Access",
    description: "Role-based permissions allow you to control who can view, edit, or manage secrets at both the organization and project levels.",
    icon: "dinkie-icons:entry",
  },
  {
    title: "Audit Logs",
    description: "Every sensitive operation, from secret changes to role updates, is logged with timestamps for full traceability and accountability.",
    icon: "dinkie-icons:right-magnifying-glass",
  },
  {
    title: "Secure Encryption",
    description: "Secrets are encrypted both in transit and at rest, keeping your data secure and ensuring that only authorized users can access them.",
    icon: "dinkie-icons:lock",
  },
  {
    title: "Command-Line Tool",
    description: "Use the open-source CLI to securely access and manage secrets programmatically, integrating seamlessly into scripts or pipelines.",
    icon: "dinkie-icons:code",
  },
]

export const FAQS = [
  {
    question: "How does role-based access control work for organizations?",
    answer: "Each organization has a single Owner, who can manage projects, add or remove members, and configure organization-wide settings. Organization Admins can invite and manage members, but they don't have full control over organization settings. Members can access the data for the organization and the projects they belong to, but they cannot modify settings or manage other users. This structure keeps sensitive operations secure while allowing teams to collaborate effectively.",
  },
  {
    question: "How does role-based access control work for projects?",
    answer: "Projects follow a similar structure to organizations. The Project Owner has full control over the project and its secrets, including managing members and permissions. Admins can add or remove members, update roles, and manage secrets, but they cannot change project ownership. Members can view secrets, but cannot change them or adjust project settings. This ensures that project-level operations are handled securely.",
  },
  {
    question: "What is audit logging and why is it important?",
    answer: "Audit logs record every sensitive action performed within the system — such as updating secrets, changing roles, or modifying projects. Each log entry captures who performed the action, timestamps, and additional metadata, providing a complete history for reference. Audit logs help teams stay transparent, investigate issues, and maintain accountability. All members in the organization can view the logs, but only the Owner can delete entries if necessary.",
  },
  {
    question: "What is the SecretkeepR CLI and how can i use it?",
    answer: "The SecretkeepR CLI allows you to interact with secrets and projects directly from your terminal, eliminating the need for hardcoded .env files and making it easy to integrate secrets into scripts and automated workflows. Whether you're retrieving secrets, updating them, or managing project settings, the CLI makes these tasks faster, more consistent, and scriptable.",
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
  { name: "github", label: "Sign In With Github", icon: "simple-icons:github" },
  { name: "google", label: "Sign In With Google", icon: "simple-icons:google" },
  { name: "gitlab", label: "Sign In With GitLab", icon: "simple-icons:gitlab" },
]
