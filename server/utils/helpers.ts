import type { EventHandlerRequest, H3Event } from "h3"
import { createHmac, randomBytes } from "node:crypto"

/**
 * Ensure required environment variables are set, throwing an error if missing.
 */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

/**
 * Retrieves the authenticated user from the current session or API token.
 * Throws 401 if no valid session exists.
 */
export async function getUserFromSession(event: H3Event<EventHandlerRequest>): Promise<User> {
  const session = await getUserSession(event)
  if (session?.user?.id) {
    const { id, email, name, image } = session.user
    return { id, email, name, image: image ?? "" }
  }

  // Fall back to API token auth (for CLI access)
  const authHeader = getHeader(event, "authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const user = await db.user.findFirst({
      where: { apiToken: hashToken(authHeader.substring(7)) },
      select: { id: true, email: true, name: true, image: true, apiTokenExpiresAt: true },
    })
    if (user && user.apiTokenExpiresAt && user.apiTokenExpiresAt > new Date()) {
      return { id: user.id, email: user.email, name: user.name, image: user.image ?? "" }
    }
  }

  throw createError({ status: 401, statusText: "Unauthorized" })
}

/**
 * Hashes tokens before persistence/comparison to avoid storing raw bearer credentials.
 */
export function hashToken(token: string): string {
  return createHmac("sha256", requireEnv("ENCRYPTION_KEY")).update(token).digest("hex")
}

/**
 * Generates a unique slug based on the provided base string.
 */
export async function generateSlug(base: string, orgId: string): Promise<string> {
  const cleaned = base.normalize("NFKD").replace(/[\u0300-\u036F]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").replace(/-+$/, "").substring(0, 50)
  for (let attempt = 0; attempt < 10; attempt++) {
    const slug = attempt === 0 ? cleaned : `${cleaned}-${crypto.randomUUID().slice(0, 6)}`
    const exists = await db.project.findUnique({ where: { slug_orgId: { slug, orgId } }, select: { id: true } })
    if (!exists) {
      return slug
    }
  }

  return crypto.randomUUID().replaceAll("-", "").slice(0, 12)
}

/**
 * Ensures a user has the required role for an organization or project.
 * Throws 401 if not authenticated, 403 if insufficient permissions.
 */
export async function requireRole(userId: string, scope: { type: "org", orgId: string } | { type: "project", projectId: string }, roles: Role[]) {
  if (!userId) {
    throw createError({ status: 401, statusText: "Unauthorized" })
  }

  let membership
  if (scope.type === "org") {
    membership = await db.orgMembership.findUnique({ where: { userId_orgId: { userId, orgId: scope.orgId } } })
  }
  else {
    const project = await db.project.findUnique({ where: { id: scope.projectId }, select: { orgId: true } })
    if (!project) {
      throw createError({ status: 404, statusText: "Project not found" })
    }

    const orgMembership = await db.orgMembership.findUnique({ where: { userId_orgId: { userId, orgId: project.orgId } } })
    if (!orgMembership) {
      throw createError({ status: 403, statusText: "Forbidden: insufficient permissions" })
    }

    membership = await db.projectMembership.findUnique({ where: { userId_projectId: { userId, projectId: scope.projectId } } })
  }
  if (!membership || !roles.includes(membership.role)) {
    throw createError({ status: 403, statusText: "Forbidden: insufficient permissions" })
  }

  return membership
}

/**
 * Generates a secure random token as a hexadecimal string.
 * Default length is 12 bytes (24 hex characters).
 */
export function generateToken(byteLength: number = 12): string {
  return randomBytes(byteLength).toString("hex")
}

/**
 * Creates an audit log entry for a user action, capturing relevant metadata.
 */
export async function createAuditLog({ userId, orgId, projectId, action, resource, metadata, description, event }: {
  userId: string
  orgId?: string
  projectId?: string
  action: string
  resource?: string
  metadata?: Record<string, unknown>
  description?: string
  event?: H3Event<EventHandlerRequest>
}) {
  const forwarded = event?.node?.req?.headers?.["x-forwarded-for"]
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim()) || event?.node?.req?.socket?.remoteAddress || "unknown"
  const ua = event?.node?.req?.headers?.["user-agent"] || "unknown"

  await db.auditLog.create({
    data: {
      userId,
      orgId,
      projectId,
      action,
      resource,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      ip,
      ua,
      description: description || `${action} performed on ${resource || "resource"}`,
    },
  })
}

/**
 * Returns the base URL used for invite links.
 */
export function getInviteBaseUrl(_event: H3Event<EventHandlerRequest>): string {
  return requireEnv("NUXT_PUBLIC_BASE_URL").trim().replace(/\/+$/, "")
}

/**
 * Returns the public URL for a given binary key.
 * Throws 404 if the binary key is not recognized.
 */
export async function getBinaryBlobUrl(binaryKey: string): Promise<string> {
  const baseUrl = requireEnv("R2_PUBLIC_URL")
  const BINARIES: Record<string, string> = {
    "windkeep-darwin-amd64": `${baseUrl}/binaries/windkeep-darwin-amd64`,
    "windkeep-darwin-arm64": `${baseUrl}/binaries/windkeep-darwin-arm64`,
    "windkeep-linux-amd64": `${baseUrl}/binaries/windkeep-linux-amd64`,
    "windkeep-windows-amd64.exe": `${baseUrl}/binaries/windkeep-windows-amd64.exe`,
  }

  const url = BINARIES[binaryKey]
  if (!url) {
    throw createError({ status: 404, message: "Binary not found" })
  }

  return url
}
