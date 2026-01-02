import type { EventHandlerRequest, H3Event } from "h3"
import db from "#server/lib/db"
import { del, put } from "@vercel/blob"

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

  throw createError({ statusCode: 401, statusMessage: "Unauthorized" })
}

/**
 * Ensures a user has the required role for an organization or project.
 * Throws 401 if not authenticated, 403 if insufficient permissions.
 */
export async function requireRole(userId: string, scope: { type: "organization", orgId: string } | { type: "project", projectId: string }, roles: Role[]) {
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" })
  }

  let membership
  if (scope.type === "organization") {
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
    throw createError({ statusCode: 403, statusMessage: "Forbidden: insufficient permissions" })
  }

  return membership
}

/**
 * Creates an audit log entry for a user action, capturing relevant metadata.
 * This helps maintain a record of significant events for security and compliance.
 */
export async function createAuditLog({ userId, orgId, projectId, action, resource, metadata, description, event}: {
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
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim() ?? event?.node?.req?.socket?.remoteAddress
  const ua = event?.node?.req?.headers?.["user-agent"] ?? undefined

  await db.auditLog.create({
    data: {
      userId,
      orgId,
      projectId,
      action,
      resource,
      metadata,
      ip: ip ?? "",
      ua: ua ?? "",
      description: description || `${action} performed on ${resource || "resource"}`,
    },
  })
}

/**
 * Returns the base URL used for invite links.
 */
export function getInviteBaseUrl(event: any) {
  const protocol = event.req.headers["x-forwarded-proto"] || "http"
  const host = event.req.headers.host

  return `${protocol}://${host}`
}

/**
 * Uploads a file to Blob storage and removes the previous file if provided.
 * Validates file size and MIME type before upload.
 */
export async function uploadFile({ path, file, maxSize, allowedMimeTypes, oldFileUrl }: {
  path: string
  file: File
  maxSize: number
  allowedMimeTypes: string[]
  oldFileUrl?: string
}) {
  if (!file || !(file instanceof File)) {
    throw createError({ statusCode: 400, statusMessage: "No file uploaded" })
  }
  if (allowedMimeTypes.length && !allowedMimeTypes.includes(file.type)) {
    throw createError({ statusCode: 415, statusMessage: `Unsupported file type: ${file.type}` })
  }
  if (file.size > maxSize) {
    throw createError({ statusCode: 413, statusMessage: "File too large" })
  }

  const ext = file.name.split(".").pop()?.toLowerCase()
  const blob = await put(`${path}/${Date.now()}.${ext}`, file, { access: "public" })
  if (oldFileUrl?.includes("blob.vercel-storage.com")) {
    await del(oldFileUrl).catch(err => console.error("Failed to delete old file:", err))
  }

  return blob.url
}
