import db from "#server/lib/db"
import { getUserFromSession, requireOrgRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  if (!org) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireOrgRole(user.id, org, ["OWNER", "ADMIN"])

  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 20
  const offset = (page - 1) * limit
  const projectId = query.projectId as string | undefined
  const action = query.action as string | undefined
  const userId = query.userId as string | undefined
  const startDate = query.startDate as string | undefined
  const endDate = query.endDate as string | undefined

  const where: any = {
    organizationId: org,
  }

  if (projectId) {
    where.projectId = projectId
  }

  if (action) {
    where.action = { contains: action, mode: "insensitive" }
  }

  if (userId) {
    where.userId = userId
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = new Date(startDate)
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate)
    }
  }

  // Get total count for pagination
  const totalItems = await db.auditLog.count({ where })
  const totalPages = Math.ceil(totalItems / limit)

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

  // Get unique users who have audit logs in this organization
  const users = await db.user.findMany({
    where: {
      auditLogs: {
        some: {
          organizationId: org,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  // Get projects in this organization
  const projects = await db.project.findMany({
    where: {
      organizationId: org,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  // Get unique actions
  const actionsResult = await db.auditLog.findMany({
    where: {
      organizationId: org,
    },
    select: {
      action: true,
    },
    distinct: ["action"],
    orderBy: {
      action: "asc",
    },
  })

  const actions = actionsResult.map(log => log.action)

  return {
    auditLogs,
    pagination: {
      page,
      limit,
      totalPages,
      totalItems,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    filters: {
      users,
      projects,
      actions,
    },
  }
})
