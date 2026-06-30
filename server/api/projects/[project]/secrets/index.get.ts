import { createHash } from "node:crypto"

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  const project = await db.project.findUnique({ where: { id: projectId }, select: { orgId: true } })
  if (!project?.orgId) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
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
      throw createError({ statusCode: 401, statusMessage: "Invalid service token" })
    }
    if (serviceToken.expiresAt && serviceToken.expiresAt < new Date()) {
      throw createError({ statusCode: 401, statusMessage: "Service token has expired" })
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

  return { decryptedSecrets }
})

defineRouteMeta({
  openAPI: {
    summary: "Get secrets",
    description: "Returns all decrypted secrets for the project.Can be authenticated with a service token or session cookie. Service tokens only return values for their allowed environments.",
    tags: ["Secrets"],
    parameters: [
      { in: "path", name: "project", required: true, schema: { type: "string" }, description: "Project ID" },
      { in: "header", name: "Authorization", required: false, schema: { type: "string" }, description: "Bearer token — service token auth (e.g. `Bearer st_...`). Falls back to session if omitted." },
    ],
    responses: {
      200: { description: "Decrypted secrets, filtered by environment if using a service token" },
      401: { description: "Unauthenticated or invalid/expired service token" },
      403: { description: "Insufficient role" },
      404: { description: "Project not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
