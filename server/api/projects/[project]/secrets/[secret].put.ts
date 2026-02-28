import { updateSecretSchema } from "#shared/schemas/secret-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const secretId = getRouterParam(event, "secret")
  if (!projectId || !secretId) {
    throw createError({ status: 400, statusText: "Project ID and Secret ID are required" })
  }

  await requireRole(user.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateSecretSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const existingSecret = await db.secret.findUnique({ where: { id: secretId }, select: { projectId: true, key: true, description: true } })
  if (!existingSecret) {
    throw createError({ status: 404, statusText: "Secret not found" })
  }
  if (existingSecret.projectId !== projectId) {
    throw createError({ status: 403, statusText: "Secret does not belong to this project" })
  }

  const updateData: any = {}
  if (result.data.description !== undefined) {
    updateData.description = result.data.description
  }

  if (result.data.values && Array.isArray(result.data.values)) {
    for (const val of result.data.values) {
      if (!val.environment || !val.value) {
        continue
      }

      await db.secretValue.upsert({
        where: { secretId_environment: { secretId, environment: val.environment } },
        update: { value: encrypt(val.value) },
        create: { secretId, environment: val.environment, value: encrypt(val.value) },
      })
    }
  }

  const updatedSecret = await db.secret.update({
    where: { id: secretId },
    data: updateData,
    include: { values: true, project: { select: { id: true, name: true, org: { select: { id: true, name: true } } } } },
  })

  const updatedEnvironments = result.data.values?.map(v => v.environment) || []
  const changes = []
  if (updatedEnvironments.length > 0) {
    changes.push(`${updatedEnvironments.length} environment value(s)`)
  }

  await createAuditLog({
    event,
    userId: user.id,
    orgId: updatedSecret.project.org.id,
    projectId,
    action: "UPDATE.SECRET",
    resource: "secret",
    description: `Updated secret "${updatedSecret.key}" in project "${updatedSecret.project.name}" (${changes.join(", ")})`,
    metadata: {
      secretId: updatedSecret.id,
      secretKey: updatedSecret.key,
      projectId: updatedSecret.project.id,
      projectName: updatedSecret.project.name,
      orgId: updatedSecret.project.org.id,
      orgName: updatedSecret.project.org.name,
      descriptionChanged: result.data.description !== undefined && result.data.description !== existingSecret.description,
      environments: updatedEnvironments,
    },
  })

  // Invalidate cache for project secrets and user projects list
  await deleteCached(CacheKeys.projectSecrets(projectId))
  await deleteCached(CacheKeys.userProjects(user.id))

  return { ...updatedSecret, values: updatedSecret.values.map(val => ({ ...val, value: decrypt(val.value) })) }
})
