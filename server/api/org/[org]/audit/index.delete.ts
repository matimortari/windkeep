import db from "#server/lib/db"
import { getUserFromSession, requireOrgRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  if (!org) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireOrgRole(user.id, org, ["OWNER"])

  const body = await readBody(event)
  const olderThan = body.olderThan as string | undefined
  const projectId = body.projectId as string | undefined
  const userId = body.userId as string | undefined
  const action = body.action as string | undefined

  // Build filter
  const where: any = {
    organizationId: org,
  }

  // Delete logs older than specified date
  if (olderThan) {
    const date = new Date(olderThan)
    if (Number.isNaN(date.getTime())) {
      throw createError({ statusCode: 400, statusMessage: "Invalid date format" })
    }
    where.createdAt = { lt: date }
  }

  // Delete logs for specific project
  if (projectId) {
    where.projectId = projectId
  }

  // Delete logs for specific user
  if (userId) {
    where.userId = userId
  }

  // Delete logs for specific action
  if (action) {
    where.action = { contains: action, mode: "insensitive" }
  }

  const result = await db.auditLog.deleteMany({ where })

  return {
    success: true,
    message: `Deleted ${result.count} audit log(s)`,
    deletedCount: result.count,
  }
})
