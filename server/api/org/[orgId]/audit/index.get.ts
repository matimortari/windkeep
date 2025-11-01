import db from "#server/lib/db"
import { getUserFromSession, requireOrgRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "orgId")
  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireOrgRole(user.id, orgId, ["OWNER", "ADMIN"])

  const query = getQuery(event)
  const limit = Number(query.limit) || 50
  const offset = Number(query.offset) || 0
  const projectId = query.projectId as string | undefined
  const action = query.action as string | undefined

  const where: any = {
    organizationId: orgId,
  }
  if (projectId) {
    where.projectId = projectId
  }
  if (action) {
    where.action = { contains: action, mode: "insensitive" }
  }

  // Get total count for pagination
  const total = await db.auditLog.count({ where })

  const auditLogs = await db.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: offset,
  })

  return {
    data: auditLogs,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  }
})
