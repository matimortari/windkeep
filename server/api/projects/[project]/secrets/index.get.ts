export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  // Rate limit: 200 requests per hour per user
  await enforceRateLimit(event, `secrets:list:${user.id}`, 200)

  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ status: 400, statusText: "Project ID is required" })
  }

  await requireRole(user.id, { type: "project", projectId }, ["OWNER", "ADMIN", "MEMBER"])

  const project = await db.project.findUnique({ where: { id: projectId }, select: { orgId: true } })
  if (!project?.orgId) {
    throw createError({ status: 404, statusText: "Project not found" })
  }

  const cacheKey = CacheKeys.projectSecrets(projectId)
  const cached = await getCached<any>(cacheKey)
  if (cached) {
    if (typeof cached === "string") {
      return { decryptedSecrets: JSON.parse(await decrypt(project.orgId, cached)) }
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

  const decryptedSecrets = await Promise.all(secrets.map(async secret => ({ ...secret, values: await Promise.all(secret.values.map(async val => ({ ...val, value: await decrypt(project.orgId, val.value) }))) })))
  await setCached(cacheKey, await encrypt(project.orgId, JSON.stringify(decryptedSecrets)), CACHE_TTL.SHORT)

  return { decryptedSecrets }
})
