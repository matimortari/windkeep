export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  // Rate limit: 200 requests per hour per user
  await enforceRateLimit(event, `secrets:list:${user.id}`, 200)

  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ status: 400, statusText: "Project ID is required" })
  }

  await requireRole(user.id, { type: "project", projectId }, ["OWNER", "ADMIN", "MEMBER"])

  const cacheKey = CacheKeys.projectSecrets(projectId)
  const cached = await getCached<any>(cacheKey)
  if (cached) {
    if (typeof cached === "string") {
      try {
        return { decryptedSecrets: JSON.parse(decrypt(cached)) }
      }
      catch {
        await deleteCached(cacheKey)
      }
    }

    await deleteCached(cacheKey)
  }

  const secrets = await db.secret.findMany({
    where: { projectId },
    select: {
      id: true,
      key: true,
      description: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
      values: { select: { id: true, secretId: true, environment: true, value: true, createdAt: true, updatedAt: true }, orderBy: { environment: "asc" } },
    },
    orderBy: { key: "asc" },
  })

  const decryptedSecrets = secrets.map(secret => ({ ...secret, values: secret.values.map(val => ({ ...val, value: decrypt(val.value) })) }))
  await setCached(cacheKey, encrypt(JSON.stringify(decryptedSecrets)), CACHE_TTL.SHORT)

  return { decryptedSecrets }
})
