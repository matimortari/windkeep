import { createError } from "h3"
import { vi } from "vitest"

export { createError }

export const getHeader = vi.fn()
export const getUserSession = vi.fn()
export const deleteCached = vi.fn()

export const CacheKeys = {
  userData: (userId: string) => `user:data:${userId}`,
  userProjects: (userId: string, orgId: string) => `user:projects:${userId}:${orgId}`,
  orgAuditLogs: (orgId: string, page: number, filters: string) => `org:audit:${orgId}:p${page}:${filters}`,
  rateLimit: (identifier: string) => `ratelimit:${identifier}`,
}

export const db = {
  user: { findFirst: vi.fn() },
  project: { findUnique: vi.fn() },
  orgMembership: { findUnique: vi.fn(), findMany: vi.fn() },
  projectMembership: { findUnique: vi.fn() },
  auditLog: { create: vi.fn() },
}

export function resetNitroMocks() {
  getHeader.mockReset()
  getUserSession.mockReset()
  deleteCached.mockReset()
  db.user.findFirst.mockReset()
  db.project.findUnique.mockReset()
  db.orgMembership.findUnique.mockReset()
  db.orgMembership.findMany.mockReset()
  db.projectMembership.findUnique.mockReset()
  db.auditLog.create.mockReset()
  deleteCached.mockResolvedValue(undefined)
  db.auditLog.create.mockResolvedValue({})
}
