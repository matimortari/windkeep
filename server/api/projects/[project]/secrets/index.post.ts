import { createSecretSchema } from "#shared/schemas/secret-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `secret:create:${user.id}`, 100, 60 * 60 * 1000)

  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ status: 400, statusText: "Project ID is required" })
  }

  await requireRole(user.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = createSecretSchema.safeParse({ ...body, projectId })
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const existingSecret = await db.secret.findUnique({ where: { key_projectId: { key: result.data.key, projectId } } })
  if (existingSecret) {
    throw createError({ status: 409, statusText: "A secret with this key already exists in the project" })
  }

  const secretData: any = { key: result.data.key, description: result.data.description, projectId }
  if (result.data.values && Array.isArray(result.data.values)) {
    secretData.values = { create: result.data.values.map((val: any) => ({ environment: val.environment, value: encrypt(val.value) })) }
  }

  const secret = await db.secret.create({
    data: secretData,
    include: { values: true, project: { select: { id: true, name: true, org: { select: { id: true, name: true } } } } },
  })

  await createAuditLog({
    event,
    userId: user.id,
    orgId: secret.project.org.id,
    projectId,
    action: "CREATE.SECRET",
    resource: "secret",
    description: `Created secret "${secret.key}" in project "${secret.project.name}" with ${secret.values.length} environment(s)`,
    metadata: {
      secretId: secret.id,
      secretKey: secret.key,
      projectId: secret.project.id,
      projectName: secret.project.name,
      orgId: secret.project.org.id,
      orgName: secret.project.org.name,
      environments: secret.values.map(v => v.environment),
    },
  })

  // Invalidate cache for project secrets and user projects list
  await deleteCached(CacheKeys.projectSecrets(projectId))
  await deleteCached(CacheKeys.userProjects(user.id))

  return { ...secret, values: secret.values.map(val => ({ ...val, value: decrypt(val.value) })) }
})
