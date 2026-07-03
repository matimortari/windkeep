type Environment = "DEVELOPMENT" | "STAGING" | "PRODUCTION"
type Role = "OWNER" | "ADMIN" | "MEMBER"

interface User {
  id: string
  email: string
  name: string
  image: string
  apiToken?: string | null
  apiTokenExpiresAt?: Date | string | null
  orgMemberships?: OrgMembership[]
  projectMemberships?: ProjectMembership[]
  serviceTokens?: ServiceToken[]
  invitations?: Invitation[]
  auditLogs?: AuditLog[]
  createdAt?: Date | string
  updatedAt?: Date | string
}

interface Organization {
  id: string
  name: string
  description: string | null
  website: string | null
  encryptionKeyVersion?: number
  encryptionKeyUpdatedAt?: Date | string
  memberships?: OrgMembership[]
  projects?: Project[]
  invitations?: Invitation[]
  auditLogs?: AuditLog[]
  createdAt?: Date | string
  updatedAt?: Date | string
}

interface OrgMembership {
  userId: string
  orgId: string
  role: Role
  isActive: boolean
  user: User
  org: Organization
  createdAt?: Date | string
  updatedAt?: Date | string
}

interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  website: string | null
  orgId: string
  org: Organization
  secrets?: Secret[]
  memberships?: ProjectMembership[]
  serviceTokens?: ServiceToken[]
  auditLogs?: AuditLog[]
  createdAt?: Date | string
  updatedAt?: Date | string
}

interface ProjectMembership {
  userId: string
  projectId: string
  role: Role
  user: User
  project: Project
  createdAt?: Date | string
  updatedAt?: Date | string
}

interface Secret {
  id: string
  key: string
  description: string | null
  tags: string[]
  projectId: string
  project: Project
  values?: SecretValue[]
  createdAt?: Date | string
  updatedAt?: Date | string
}

interface SecretValue {
  id: string
  secretId: string
  environment: Environment
  value: string
  secret: Secret
  createdAt?: Date | string
  updatedAt?: Date | string
}

interface SecretValueHistory {
  id: string
  secretValueId: string
  value: string
  changedBy: string | null
  changedByUser?: User | null
  createdAt?: Date | string
}

interface ServiceToken {
  id: string
  name: string
  tokenHash: string
  environment: Environment[]
  projectId: string
  project: Project
  createdBy: string
  user: User
  auditLogs?: AuditLog[]
  expiresAt: Date | string | null
  lastUsedAt: Date | string | null
  createdAt?: Date | string
  updatedAt?: Date | string
}

interface Invitation {
  id: string
  email: string
  role: Role
  orgId: string
  token: string
  org: Organization
  invitedById: string
  invitedBy: User
  acceptedAt?: Date | string
  expiresAt: Date | string
  createdAt?: Date | string
}

interface AuditLog {
  id: string
  userId: string | null
  serviceTokenId?: string | null
  serviceToken?: ServiceToken | null
  orgId?: string
  projectId?: string
  action: string
  resource?: string | null
  description?: string | null
  metadata?: Record<string, unknown> | null
  ip: string
  ua: string
  user?: User | null
  org?: Organization
  project?: Project
  createdAt?: Date | string
}

interface AuditLogsPagination {
  page: number
  limit: number
  totalPages: number
  totalItems: number
  hasNext: boolean
  hasPrev: boolean
}

interface AuditFilters {
  users: Array<{ id: string, name: string | null, email: string }>
  serviceTokens?: Array<{ id: string, name: string }>
  projects: Array<{ id: string, name: string }>
  actions: string[]
}

interface DiffItem {
  key: string
  type: "added" | "updated" | "removed"
  value?: string
  icon: string
  class: string
}

interface PendingChange {
  type: "create" | "update" | "delete"
  secret: Secret
  originalSecret?: Secret
}

interface HistoryItem {
  id: string
  value: string
  changedBy: {
    id: string
    name: string
    email: string
    image: string | null
  } | null
  changedAt: Date | string
}

interface EnvironmentHistory {
  environment: Environment
  currentValue: string
  history: HistoryItem[]
}

interface CalendarDay {
  date: Date
  day: number
  isCurrentMonth: boolean
  isSelected: boolean
  isToday: boolean
}

interface CliSection {
  title: string
  paragraphs?: string | { code: string } | { strong: string } | { em: string } | { link: { href: string, text: string, external?: boolean } }[][]
  note?: string | { code: string } | { strong: string } | { em: string } | { link: { href: string, text: string, external?: boolean } }[]
  install?: { label: string, command: string }[]
  examples?: { label?: string, command?: string, output?: string }[]
  args?: { label: string, code: string, description: string }[]
  flags?: { code: string, description: string }[]
  list?: { label?: string, description?: string, commands?: string[] }[]
  links?: { href: string, label: string, description: string }[]
  downloads?: { href: string, label: string, description: string }[]
  steps?: string[]
}

interface UIState {
  sidebar: boolean
  dialogs: {
    projects: boolean
    secrets: {
      isOpen: boolean
      selectedSecret: Secret | null
    }
    history: boolean
    raw: boolean
  }
  adminTabs: {
    organization: string
    project: string
    projectSlug: string | null
  }
}

interface Toast {
  id: string
  message: string
  type: "danger" | "success" | "warning" | "info"
  duration?: number
}
