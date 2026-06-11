import { getAuditLogsSchema } from "#shared/schemas/audit-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `audit:list:${sessionUser.id}`, 100)
  await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER", "ADMIN"])

  const query = getQuery(event)
  const result = getAuditLogsSchema.safeParse({
    page: query.page ? Number(query.page) : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
    projectId: query.projectId,
    action: query.action,
    userId: query.userId,
    serviceTokenId: query.serviceTokenId,
    startDate: query.startDate,
    endDate: query.endDate,
  })
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message ?? "Invalid query parameters" })
  }

  const { page, limit, projectId, action, userId, serviceTokenId, startDate, endDate } = result.data
  const filterHash = JSON.stringify({ projectId, action, userId, serviceTokenId, startDate, endDate })
  const cacheKey = CacheKeys.orgAuditLogs(orgId, page, filterHash)
  const cached = await getCached<any>(cacheKey)
  if (cached) {
    return cached
  }

  const where: Record<string, unknown> = { orgId }
  if (projectId) {
    where.projectId = projectId
  }
  if (action) {
    where.action = action
  }
  if (userId) {
    where.userId = userId
  }
  if (serviceTokenId) {
    where.serviceTokenId = serviceTokenId
  }
  if (startDate || endDate) {
    where.createdAt = { ...(startDate && { gte: new Date(startDate) }), ...(endDate && { lte: new Date(endDate) }) }
  }

  const [totalItems, auditLogs, users, projects, actionsResult] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        resource: true,
        description: true,
        metadata: true,
        ip: true,
        ua: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true, image: true } },
        serviceToken: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    db.user.findMany({
      where: { auditLogs: { some: { orgId } } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    db.project.findMany({
      where: { orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.auditLog.findMany({
      where: { orgId },
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    }),
  ])

  const totalPages = Math.ceil(totalItems / limit)
  const logs = {
    auditLogs,
    filters: { users, projects, actions: actionsResult.map(l => l.action) },
    pagination: { page, limit, totalPages, totalItems, hasNext: page < totalPages, hasPrev: page > 1 },
  }

  await setCached(cacheKey, logs, CACHE_TTL.SHORT)

  return { logs }
})
