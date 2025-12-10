import type { EventHandlerRequest, H3Event } from "h3"
import db from "#server/lib/db"
import { del, put } from "@vercel/blob"

export async function getUserFromSession(event: H3Event<EventHandlerRequest>) {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" })
  }

  return session.user
}

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
  const ip = event?.node?.req?.headers?.["x-forwarded-for"] || event?.node?.req?.socket?.remoteAddress || null
  const userAgent = event?.node?.req?.headers?.["user-agent"] || null

  const auditMetadata = { ip: ip || "unknown", userAgent: userAgent || "unknown", ...metadata }

  await db.auditLog.create({
    data: {
      userId,
      orgId,
      projectId,
      action,
      resource,
      metadata: auditMetadata,
      description: description || `${action} performed on ${resource || "resource"}`,
    },
  })
}

export function getInviteBaseUrl(event: any) {
  const protocol = event.req.headers["x-forwarded-proto"] || "http"
  const host = event.req.headers.host

  return `${protocol}://${host}`
}

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
