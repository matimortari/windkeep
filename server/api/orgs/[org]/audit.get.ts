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

  const filterHash = JSON.stringify({ projectId: result.data.projectId, action: result.data.action, userId: result.data.userId, serviceTokenId: result.data.serviceTokenId, startDate: result.data.startDate, endDate: result.data.endDate })
  const cacheKey = CacheKeys.orgAuditLogs(orgId, result.data.page, filterHash)
  const cached = await getCached<any>(cacheKey)
  if (cached) {
    return { data: cached }
  }

  const where: Record<string, unknown> = { orgId }
  if (result.data.projectId) {
    where.projectId = result.data.projectId
  }
  if (result.data.action) {
    where.action = result.data.action
  }
  if (result.data.userId) {
    where.userId = result.data.userId
  }
  if (result.data.serviceTokenId) {
    where.serviceTokenId = result.data.serviceTokenId
  }
  if (result.data.startDate || result.data.endDate) {
    where.createdAt = { ...(result.data.startDate && { gte: new Date(result.data.startDate) }), ...(result.data.endDate && { lte: new Date(result.data.endDate) }) }
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
      take: result.data.limit,
      skip: (result.data.page - 1) * result.data.limit,
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

  const totalPages = Math.ceil(totalItems / result.data.limit)
  const data = {
    auditLogs,
    filters: { users, projects, actions: actionsResult.map(l => l.action) },
    pagination: { page: result.data.page, limit: result.data.limit, totalPages, totalItems, hasNext: result.data.page < totalPages, hasPrev: result.data.page > 1 },
  }

  await setCached(cacheKey, data, CACHE_TTL.SHORT)

  return { data }
})
