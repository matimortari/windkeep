export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const secretId = getRouterParam(event, "id")
  if (!projectId || !secretId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Secret ID are required" })
  }

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `secret:history:${sessionUser.id}`, 100)
  const membership = await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN", "MEMBER"])

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

  const allowedEnvironments = membership.role === "MEMBER" ? (("environment" in membership ? membership.environment : []) as Environment[]) : null
  const secretValues = await db.secretValue.findMany({
    where: { secretId, ...(allowedEnvironments ? { environment: { in: allowedEnvironments } } : {}) },
    select: { id: true, environment: true, value: true },
  })
  const historyRecords = await db.secretValueHistory.findMany({
    where: { secretValueId: { in: secretValues.map(sv => sv.id) } },
    include: { changedByUser: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "desc" },
  })

  const key = await getOrgDataKey(secret.project.orgId)
  const history = secretValues.map(sv => ({
    environment: sv.environment,
    currentValue: decryptWithKey(sv.value, key),
    history: historyRecords.filter(log => log.secretValueId === sv.id).map(h => ({
      id: h.id,
      value: decryptWithKey(h.value, key),
      changedBy: h.changedByUser ?? { id: "deleted", name: "Deleted User", email: "noreply@system.local", image: null },
      changedAt: h.createdAt,
    })),
  }))

  return { history }
})

defineRouteMeta({
  openAPI: {
    summary: "Get secret value history",
    description: "Returns the value history for each environment of a secret the caller can read, including who made each change. MEMBERs only see history for their allowed environments.",
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
