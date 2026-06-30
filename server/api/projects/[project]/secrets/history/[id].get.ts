export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const secretId = getRouterParam(event, "id")
  if (!projectId || !secretId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Secret ID are required" })
  }

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `secret:history:${sessionUser.id}`, 100)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN", "MEMBER"])

  const secret = await db.secret.findUnique({
    where: { id: secretId },
    select: { projectId: true, key: true, project: { select: { orgId: true } } },
  })
  if (!secret) {
    throw createError({ statusCode: 404, statusMessage: "Secret not found" })
  }
  if (secret.projectId !== projectId) {
    throw createError({ statusCode: 403, statusMessage: "Secret does not belong to this project" })
  }

  const secretValues = await db.secretValue.findMany({ where: { secretId }, select: { id: true, environment: true, value: true } })
  const historyRecords = await db.secretValueHistory.findMany({
    where: { secretValueId: { in: secretValues.map(sv => sv.id) } },
    include: { changedByUser: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "desc" },
  })

  const history = await Promise.all(
    secretValues.map(async (sv) => {
      return { environment: sv.environment, currentValue: await decrypt(secret.project.orgId, sv.value), history: await Promise.all(
        historyRecords.filter(log => log.secretValueId === sv.id).map(async h => ({
          id: h.id,
          value: await decrypt(secret.project.orgId, h.value),
          changedBy: h.changedByUser ?? { id: "deleted", name: "Deleted User", email: "noreply@system.local", image: null },
          changedAt: h.createdAt,
        })),
      ) }
    }),
  )

  return { history }
})

defineRouteMeta({
  openAPI: {
    summary: "Get secret value history",
    description: "Returns the full value history for each environment of a secret, including who made each change.",
    tags: ["Secrets"],
    parameters: [
      { in: "path", name: "project", required: true, schema: { type: "string" }, description: "Project ID" },
      { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Secret ID" },
    ],
    responses: {
      200: { description: "Per-environment history with decrypted values and change attribution" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role or secret belongs to a different project" },
      404: { description: "Secret not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
