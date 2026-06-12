import { createSecretSchema } from "#shared/schemas/secret-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ status: 400, statusText: "Project ID is required" })
  }

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `secret:create:${sessionUser.id}`, 100)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = createSecretSchema.safeParse({ ...body, projectId })
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const existingSecret = await db.secret.findUnique({ where: { key_projectId: { key: result.data.key, projectId } } })
  if (existingSecret) {
    throw createError({ status: 409, statusText: "A secret with this key already exists in the project" })
  }

  const project = await db.project.findUnique({ where: { id: projectId }, select: { orgId: true } })
  if (!project?.orgId) {
    throw createError({ status: 404, statusText: "Project not found" })
  }

  const secretData: any = {
    key: result.data.key,
    description: result.data.description,
    tags: result.data.tags || [],
    projectId,
  }

  // Create secret and associated values within a transaction to ensure atomicity and proper history tracking
  const secret = await db.$transaction(async (tx) => {
    if (result.data.values && Array.isArray(result.data.values)) {
      secretData.values = { create: await Promise.all(result.data.values.map(async (val: any) => {
        const encryptedValue = await encrypt(project.orgId, val.value)
        return {
          environment: val.environment,
          value: encryptedValue,
          history: { create: { value: encryptedValue, changedBy: sessionUser.id } }, // Seed initial history record tracking point directly upon entity creation
        }
      })) }
    }

    return await tx.secret.create({
      data: secretData,
      include: { values: true, project: { select: { id: true, name: true, org: { select: { id: true, name: true } } } } },
    })
  })

  await createAuditLog({
    event,
    userId: sessionUser.id,
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

  await deleteCached(CacheKeys.projectSecrets(projectId))
  await deleteCached(CacheKeys.userProjects(sessionUser.id, secret.project.org.id))

  const decryptedSecret = {
    ...secret,
    values: await Promise.all(secret.values.map(async val => ({ ...val, value: await decrypt(project.orgId, val.value) }))),
  }

  return { decryptedSecret }
})
