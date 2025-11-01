import db from "#server/lib/db"
import { getUserFromSession, requireOrgRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  if (!org) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireOrgRole(user.id, org, ["OWNER"])

  const query = getQuery(event)
  const olderThan = query.olderThan as string | undefined
  const projectId = query.projectId as string | undefined

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

  const result = await db.auditLog.deleteMany({ where })

  return {
    success: true,
    message: `Deleted ${result.count} audit log(s)`,
    deletedCount: result.count,
  }
})
