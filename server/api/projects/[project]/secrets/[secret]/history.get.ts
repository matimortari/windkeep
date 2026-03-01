export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `secret:history:${user.id}`, 100, 60 * 60 * 1000)

  const projectId = getRouterParam(event, "project")
  const secretId = getRouterParam(event, "secret")
  if (!projectId || !secretId) {
    throw createError({ status: 400, statusText: "Project ID and Secret ID are required" })
  }

  await requireRole(user.id, { type: "project", projectId }, ["OWNER", "ADMIN", "MEMBER"])

  const secret = await db.secret.findUnique({ where: { id: secretId }, select: { projectId: true, key: true } })
  if (!secret) {
    throw createError({ status: 404, statusText: "Secret not found" })
  }
  if (secret.projectId !== projectId) {
    throw createError({ status: 403, statusText: "Secret does not belong to this project" })
  }

  const secretValues = await db.secretValue.findMany({
    where: { secretId },
    include: {
      history: {
        include: {
          changedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  const history = secretValues.map(sv => ({
    environment: sv.environment,
    currentValue: decrypt(sv.value),
    history: sv.history.map(h => ({
      id: h.id,
      value: decrypt(h.value),
      changedBy: h.changedByUser,
      changedAt: h.createdAt,
    })),
  }))

  return { history }
})
