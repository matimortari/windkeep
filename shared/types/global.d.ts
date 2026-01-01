type Environment = "DEVELOPMENT" | "STAGING" | "PRODUCTION"
type Role = "OWNER" | "ADMIN" | "MEMBER"

interface User {
  id: string
  email: string
  name: string
  image: string | null
  apiToken: string | null
  orgMemberships?: OrgMembership[]
  projectMemberships?: ProjectMembership[]
  invitations?: Invitation[]
  auditLogs?: AuditLog[]
  createdAt?: Date | string
  updatedAt?: Date | string
}

interface Organization {
  id: string
  name: string
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
  orgId: string
  org: Organization
  secrets?: Secret[]
  memberships?: ProjectMembership[]
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

interface Invitation {
  id: string
  orgId: string
  token: string
  org: Organization
  invitedById: string
  invitedBy: User
  expiresAt: Date | string
  createdAt?: Date | string
}

interface AuditLog {
  id: string
  userId: string
  orgId?: string
  projectId?: string
  action: string
  resource?: string | null
  description?: string | null
  metadata?: Record<string, any> | null
  ip: string
  ua: string
  user?: User
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
  projects: Array<{ id: string, name: string }>
  actions: string[]
}
