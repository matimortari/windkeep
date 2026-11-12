import { createError } from "h3"
import { vi } from "vitest"

export { createError }

export const getHeader = vi.fn()
export const getUserSession = vi.fn()
export const setUserSession = vi.fn()
export const clearUserSession = vi.fn()
export const deleteCached = vi.fn()
export const setCached = vi.fn()
export const getRedisClient = vi.fn()
export const generateToken = vi.fn()
export const assertValidUserSession = vi.fn()
export const createAuthenticatedSession = vi.fn()
export const destroyAuthenticatedSession = vi.fn()

export const CacheKeys = {
  userData: (userId: string) => `user:data:${userId}`,
  userProjects: (userId: string, orgId: string) => `user:projects:${userId}:${orgId}`,
  orgAuditLogs: (orgId: string, page: number, filters: string) => `org:audit:${orgId}:p${page}:${filters}`,
  rateLimit: (identifier: string) => `ratelimit:${identifier}`,
  session: (sessionId: string) => `session:${sessionId}`,
}

export const db = {
  user: { findFirst: vi.fn() },
  project: { findUnique: vi.fn() },
  orgMembership: { findUnique: vi.fn(), findMany: vi.fn() },
  projectMembership: { findUnique: vi.fn() },
  auditLog: { create: vi.fn() },
  serviceToken: { findUnique: vi.fn(), update: vi.fn() },
}

export function resetNitroMocks() {
  getHeader.mockReset()
  getUserSession.mockReset()
  setUserSession.mockReset()
  clearUserSession.mockReset()
  deleteCached.mockReset()
  setCached.mockReset()
  getRedisClient.mockReset()
  generateToken.mockReset()
  assertValidUserSession.mockReset()
  createAuthenticatedSession.mockReset()
  destroyAuthenticatedSession.mockReset()
  db.user.findFirst.mockReset()
  db.project.findUnique.mockReset()
  db.orgMembership.findUnique.mockReset()
  db.orgMembership.findMany.mockReset()
  db.projectMembership.findUnique.mockReset()
  db.auditLog.create.mockReset()
  db.serviceToken.findUnique.mockReset()
  db.serviceToken.update.mockReset()
  deleteCached.mockResolvedValue(undefined)
  setCached.mockResolvedValue(true)
  setUserSession.mockResolvedValue(undefined)
  clearUserSession.mockResolvedValue(undefined)
  generateToken.mockReturnValue("session-token")
  db.auditLog.create.mockResolvedValue({})
  db.serviceToken.update.mockResolvedValue({})
}
