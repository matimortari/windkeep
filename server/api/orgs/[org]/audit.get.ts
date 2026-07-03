import { getAuditLogsSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
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
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? "Invalid query parameters" })
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

  await setCached(cacheKey, data, 60)

  return { data }
})

defineRouteMeta({
  openAPI: {
    summary: "Get audit logs",
    description: "Returns paginated audit logs for the organization with filter options. Requires organization OWNER or ADMIN role.",
    tags: ["Organizations"],
    parameters: [
      { in: "path", name: "org", required: true, schema: { type: "string" }, description: "Organization ID" },
      { in: "query", name: "page", schema: { type: "integer" }, description: "Page number" },
      { in: "query", name: "limit", schema: { type: "integer" }, description: "Items per page" },
      { in: "query", name: "projectId", schema: { type: "string" }, description: "Project ID" },
      { in: "query", name: "action", schema: { type: "string" }, description: "Action" },
      { in: "query", name: "userId", schema: { type: "string" }, description: "User ID" },
      { in: "query", name: "serviceTokenId", schema: { type: "string" }, description: "Service token ID" },
      { in: "query", name: "startDate", schema: { type: "string", format: "date-time" }, description: "Start date" },
      { in: "query", name: "endDate", schema: { type: "string", format: "date-time" }, description: "End date" },
    ],
    responses: {
      200: { description: "Paginated audit logs with available filter options" },
      400: { description: "Invalid query parameters" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
