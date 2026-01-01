import db from "#server/lib/db"
import { getUserFromSession, requireRole } from "#server/lib/utils"
import { deleteAuditLogsSchema } from "#shared/schemas/audit-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  if (!org) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "organization", orgId: org }, ["OWNER"])

  const body = await readBody(event)
  const result = deleteAuditLogsSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message || "Invalid input" })
  }

  const where: any = { orgId: org }

  if (result.data.olderThan) {
    where.createdAt = { lt: new Date(result.data.olderThan) }
  }
  if (result.data.projectId) {
    where.projectId = result.data.projectId
  }
  if (result.data.userId) {
    where.userId = result.data.userId
  }
  if (result.data.action) {
    where.action = { contains: result.data.action, mode: "insensitive" }
  }

  const deleteResult = await db.auditLog.deleteMany({ where })

  return { success: true, message: `Deleted ${deleteResult.count} audit log(s)` }
})
