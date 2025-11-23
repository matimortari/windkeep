type Environment = "DEVELOPMENT" | "STAGING" | "PRODUCTION"
type Role = "OWNER" | "ADMIN" | "MEMBER"

interface User {
  id: string
  email: string
  name: string
  image?: string
  apiToken?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  orgMemberships?: OrgMembership[]
  projectMemberships?: ProjectMembership[]
  invitations?: Invitation[]
  auditLogs?: AuditLog[]
}

interface Organization {
  id: string
  name: string
  createdAt?: Date | string
  updatedAt?: Date | string
  memberships?: OrgMembership[]
  projects?: Project[]
  invitations?: Invitation[]
  auditLogs?: AuditLog[]
}

interface OrgMembership {
  userId: string
  orgId: string
  role: Role
  isActive: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
  user: User
  org: Organization
}

interface Project {
  id: string
  name: string
  slug: string
  description?: string
  orgId: string
  createdAt?: Date | string
  updatedAt?: Date | string
  org: Organization
  secrets?: Secret[]
  memberships?: ProjectMembership[]
  auditLogs?: AuditLog[]
}

interface ProjectMembership {
  userId: string
  projectId: string
  role: Role
  createdAt?: Date | string
  updatedAt?: Date | string
  user: User
  project: Project
}

interface Secret {
  id: string
  key: string
  description?: string
  projectId: string
  createdAt?: Date | string
  updatedAt?: Date | string
  project: Project
  values?: SecretValue[]
}

interface SecretValue {
  id: string
  secretId: string
  environment: Environment
  value: string
  createdAt?: Date | string
  updatedAt?: Date | string
  secret: Secret
}

interface Invitation {
  id: string
  orgId: string
  token: string
  expiresAt: Date | string
  createdAt?: Date | string
  org: Organization
  invitedById: string
  invitedBy: User
}

interface AuditLog {
  id: string
  userId: string
  orgId?: string
  projectId?: string
  action: string
  resource?: string | null
  metadata?: Record<string, any> | null
  description?: string | null
  createdAt?: Date | string
  user?: User
  org?: Organization
  project?: Project
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
  projects: Array<{ id: string, name: string }>
  actions: string[]
}
