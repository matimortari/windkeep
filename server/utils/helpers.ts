import type { EventHandlerRequest, H3Event } from "h3"
import { randomBytes } from "node:crypto"

/**
 * Retrieves the authenticated user from the current session or API token.
 * Throws 401 if no valid session exists.
 */
export async function getUserFromSession(event: H3Event<EventHandlerRequest>) {
  const session = await getUserSession(event)
  if (session?.user?.id) {
    return session.user
  }

  // Fall back to API token auth (for CLI access)
  const authHeader = getHeader(event, "authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    const user = await db.user.findUnique({
      where: { apiToken: token },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        apiToken: true,
      },
    })

    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        apiToken: user.apiToken,
      }
    }
  }

  throw createError({ status: 401, statusText: "Unauthorized" })
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
    membership = await db.orgMembership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId: scope.orgId,
        },
      },
    })
  }
  else {
    membership = await db.projectMembership.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: scope.projectId,
        },
      },
    })
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
 * This helps maintain a record of significant events for security and compliance.
 */
export async function createAuditLog({ userId, orgId, projectId, action, resource, metadata, description, event }: {
  userId: string
  orgId?: string
  projectId?: string
  action: string
  resource?: string
  metadata?: Record<string, any>
  description?: string
  event?: H3Event<EventHandlerRequest>
}) {
  const forwarded = event?.node?.req?.headers?.["x-forwarded-for"]
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim()) || event?.node?.req?.socket?.remoteAddress || "unknown"
  const ua = event?.node?.req?.headers?.["user-agent"] || "unknown"

  await db.auditLog.create({ data: { userId, orgId, projectId, action, resource, metadata, ip, ua, description: description || `${action} performed on ${resource || "resource"}` } })
}

/**
 * Returns the base URL used for invite links.
 */
export function getInviteBaseUrl(event: any) {
  const protocol = event.req.headers["x-forwarded-proto"] || "http"
  const host = event.req.headers.host

  return `${protocol}://${host}`
}

export async function getBinaryBlobUrl(binaryKey: string) {
  const BINARIES: Record<string, string | undefined> = {
    "windkeep-darwin-amd64": `${process.env.R2_PUBLIC_URL}/binaries/windkeep-darwin-amd64`,
    "windkeep-darwin-arm64": `${process.env.R2_PUBLIC_URL}/binaries/windkeep-darwin-arm64`,
    "windkeep-linux-amd64": `${process.env.R2_PUBLIC_URL}/binaries/windkeep-linux-amd64`,
    "windkeep-windows-amd64.exe": `${process.env.R2_PUBLIC_URL}/binaries/windkeep-windows-amd64.exe`,
  }

  if (!BINARIES[binaryKey]) {
    throw createError({ status: 404, message: "Binary not found" })
  }

  return BINARIES[binaryKey]
}
