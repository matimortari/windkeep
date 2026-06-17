import { createHash } from "node:crypto"

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ status: 400, statusText: "Project ID is required" })
  }

  const project = await db.project.findUnique({ where: { id: projectId }, select: { orgId: true } })
  if (!project?.orgId) {
    throw createError({ status: 404, statusText: "Project not found" })
  }

  // Determine auth method — service token (st_ prefix) or session user
  let allowedEnvironments: Environment[] | null = null
  const authHeader = getHeader(event, "authorization")
  const rawToken = authHeader?.startsWith("Bearer st_") ? authHeader.slice(7) : null

  if (rawToken) {
    const tokenHash = createHash("sha256").update(rawToken).digest("hex")
    const serviceToken = await db.serviceToken.findUnique({
      where: { tokenHash },
      select: { id: true, projectId: true, environment: true, expiresAt: true },
    })

    if (!serviceToken || serviceToken.projectId !== projectId) {
      throw createError({ status: 401, statusText: "Invalid service token" })
    }
    if (serviceToken.expiresAt && serviceToken.expiresAt < new Date()) {
      throw createError({ status: 401, statusText: "Service token has expired" })
    }

    await db.serviceToken.update({ where: { id: serviceToken.id }, data: { lastUsedAt: new Date() } })
    // Rate limit: 200 requests per hour per token
    await enforceRateLimit(event, `secrets:list:token:${serviceToken.id}`, 200)
    allowedEnvironments = serviceToken.environment as Environment[]
  }
  else {
    const sessionUser = await getUserFromSession(event)
    // Rate limit: 200 requests per hour per user
    await enforceRateLimit(event, `secrets:list:${sessionUser.id}`, 200)
    await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN", "MEMBER"])
  }

  // Only use cache for full session responses since token responses are environment-scoped
  if (!allowedEnvironments) {
    const cacheKey = CacheKeys.projectSecrets(projectId)
    const cached = await getCached<any>(cacheKey)
    if (cached) {
      if (typeof cached === "string") {
        return { decryptedSecrets: JSON.parse(await decrypt(project.orgId, cached)) }
      }
      await deleteCached(cacheKey)
    }
  }

  const secrets = await db.secret.findMany({
    where: { projectId },
    select: {
      id: true,
      key: true,
      description: true,
      tags: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
      values: {
        select: { id: true, secretId: true, environment: true, value: true, createdAt: true, updatedAt: true },
        ...(allowedEnvironments ? { where: { environment: { in: allowedEnvironments } } } : {}), // Filter values by allowed environments for token auth
        orderBy: { environment: "asc" },
      },
    },
    orderBy: { key: "asc" },
  })

  const decryptedSecrets = await Promise.all(secrets.map(async secret => ({
    ...secret,
    values: await Promise.all(secret.values.map(async val => ({ ...val, value: await decrypt(project.orgId, val.value) }))),
  })))
  if (!allowedEnvironments) {
    const cacheKey = CacheKeys.projectSecrets(projectId)
    await setCached(cacheKey, await encrypt(project.orgId, JSON.stringify(decryptedSecrets)), CACHE_TTL.SHORT)
  }

  return { decryptedSecrets }
})
