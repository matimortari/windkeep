type Environment = "DEVELOPMENT" | "STAGING" | "PRODUCTION"
type Role = "OWNER" | "ADMIN" | "MEMBER"

interface User {
  id: string
  email: string
  name: string | null
  image?: string | null
  apiToken?: string | null
  activeOrgId?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  accounts?: Account[]
  memberships?: OrganizationMembership[]
  projectRoles?: ProjectRole[]
  invitations?: Invitation[]
  auditLogs?: AuditLog[]
}

interface Organization {
  id: string
  name: string
  createdAt: Date | string
  updatedAt: Date | string
  memberships?: OrganizationMembership[]
  projects?: Project[]
  invitations?: Invitation[]
  auditLogs?: AuditLog[]
}

interface OrganizationMembership {
  userId: string
  organizationId: string
  role: Role
  createdAt: Date | string
  updatedAt: Date | string
  user?: User
  organization?: Organization | Pick<Organization, "id" | "name">
}

interface Project {
  id: string
  name: string
  slug: string
  description?: string | null
  organizationId: string
  createdAt: Date | string
  updatedAt: Date | string
  organization?: Organization
  secrets?: Secret[]
  roles?: ProjectRole[]
  auditLogs?: AuditLog[]
}

interface ProjectRole {
  userId: string
  projectId: string
  role: Role
  createdAt: Date | string
  updatedAt: Date | string
  user?: User
  project?: Project
}

interface Secret {
  id: string
  key: string
  description?: string | null
  projectId: string
  createdAt: Date | string
  updatedAt: Date | string
  project?: Project
  values?: SecretValue[]
}

interface SecretValue {
  id: string
  secretId: string
  environment: Environment
  value: string
  createdAt: Date | string
  updatedAt: Date | string
  secret?: Secret
}

interface Invitation {
  id: string
  email: string
  organizationId: string
  role: Role
  token: string
  expiresAt: Date | string
  createdAt: Date | string
  organization?: Organization
  invitedById: string
  invitedBy?: User
}

interface AuditLog {
  id: string
  userId: string
  organizationId?: string | null
  projectId?: string | null
  action: string
  description?: string | null
  createdAt: Date | string
  user?: User
  organization?: Organization | null
  project?: Project | null
}
