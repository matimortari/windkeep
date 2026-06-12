export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ status: 400, statusText: "Project ID is required" })
  }

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `service-tokens:list:${sessionUser.id}`, 100)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const project = await db.project.findUnique({ where: { id: projectId }, select: { orgId: true } })
  if (!project) {
    throw createError({ status: 404, statusText: "Project not found" })
  }

  const tokens = await db.serviceToken.findMany({
    where: { projectId },
    select: {
      id: true,
      name: true,
      environment: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return { tokens }
})
