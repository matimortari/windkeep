import { getAuditLogsSchema } from "#shared/schemas/audit-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `audit:list:${user.id}`, 100, 60 * 60 * 1000)

  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "org", orgId }, ["OWNER", "ADMIN"])

  const query = getQuery(event)
  const parsedQuery = {
    page: query.page ? Number(query.page) : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
    projectId: query.projectId as string | undefined,
    action: query.action as string | undefined,
    userId: query.userId as string | undefined,
    startDate: query.startDate as string | undefined,
    endDate: query.endDate as string | undefined,
  }

  const result = getAuditLogsSchema.safeParse(parsedQuery)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid query parameters" })
  }

  const page = result.data.page
  const limit = result.data.limit
  const offset = (page - 1) * limit
  const where: any = { orgId }

  const filterHash = JSON.stringify({
    projectId: result.data.projectId,
    action: result.data.action,
    userId: result.data.userId,
    startDate: result.data.startDate,
    endDate: result.data.endDate,
  })
  const cacheKey = CacheKeys.orgAuditLogs(orgId, page, filterHash)
  const cached = await getCached<any>(cacheKey)
  if (cached) {
    return cached
  }

  if (result.data.projectId) {
    where.projectId = result.data.projectId
  }
  if (result.data.action) {
    where.action = result.data.action
  }
  if (result.data.userId) {
    where.userId = result.data.userId
  }
  if (result.data.startDate || result.data.endDate) {
    where.createdAt = {}
    if (result.data.startDate) {
      where.createdAt.gte = new Date(result.data.startDate)
    }
    if (result.data.endDate) {
      where.createdAt.lte = new Date(result.data.endDate)
    }
  }

  // Get total count for pagination
  const totalItems = await db.auditLog.count({ where })
  const totalPages = Math.ceil(totalItems / limit)

  const auditLogs = await db.auditLog.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      user: { select: { id: true, email: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  })

  // Get unique users who have audit logs in this organization
  const users = await db.user.findMany({
    where: { auditLogs: { some: { orgId } } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  })

  // Get projects in this organization
  const projects = await db.project.findMany({
    where: { orgId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  // Get unique actions
  const actionsResult = await db.auditLog.findMany({
    where: { orgId },
    select: { action: true },
    distinct: ["action"],
    orderBy: { action: "asc" },
  })

  const response = {
    auditLogs,
    filters: { users, projects, actions: actionsResult.map(log => log.action) },
    pagination: { page, limit, totalPages, totalItems, hasNext: page < totalPages, hasPrev: page > 1 },
  }

  await setCached(cacheKey, response, CACHE_TTL.SHORT)

  return response
})
