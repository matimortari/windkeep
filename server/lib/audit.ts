import type { EventHandlerRequest, H3Event } from "h3"
import db from "#server/lib/db"

export default async function createAuditLog({
  userId,
  orgId,
  projectId,
  action,
  resource,
  metadata,
  description,
  event,
}: {
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
