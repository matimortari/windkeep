import db from "#server/lib/db"
import { getUserFromSession, requireRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  if (!org) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "organization", orgId: org }, ["OWNER"])

  const body = (await readBody(event).catch(() => ({}))) || {}

  const { olderThan, projectId, userId, action } = body as Record<string, string | undefined>

  const where: any = { orgId: org }

  if (olderThan) {
    const date = new Date(olderThan)
    if (Number.isNaN(date.getTime())) {
      throw createError({ statusCode: 400, statusMessage: "Invalid date format" })
    }
    where.createdAt = { lt: date }
  }

  if (projectId)
    where.projectId = projectId
  if (userId)
    where.userId = userId
  if (action)
    where.action = { contains: action, mode: "insensitive" }

  const result = await db.auditLog.deleteMany({ where })

  return {
    success: true,
    message: `Deleted ${result.count} audit log(s)`,
    deletedCount: result.count,
  }
})
