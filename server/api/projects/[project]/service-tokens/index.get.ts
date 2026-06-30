export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `service-tokens:list:${sessionUser.id}`, 100)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const project = await db.project.findUnique({ where: { id: projectId }, select: { orgId: true } })
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
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

defineRouteMeta({
  openAPI: {
    summary: "Get service tokens",
    description: "Returns all service tokens for the project. Requires project OWNER or ADMIN role.",
    tags: ["Service Tokens"],
    parameters: [
      { in: "path", name: "project", required: true, schema: { type: "string" }, description: "Project ID" },
    ],
    responses: {
      200: { description: "List of service tokens" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role" },
      404: { description: "Project not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
