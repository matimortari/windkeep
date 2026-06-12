import { updateSecretSchema } from "#shared/schemas/secret-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const secretId = getRouterParam(event, "id")
  if (!projectId || !secretId) {
    throw createError({ status: 400, statusText: "Project ID and Secret ID are required" })
  }

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `secret:update:${sessionUser.id}`, 100)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateSecretSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const existingSecret = await db.secret.findUnique({ where: { id: secretId }, select: { projectId: true, key: true, description: true, project: { select: { orgId: true } } } })
  if (!existingSecret) {
    throw createError({ status: 404, statusText: "Secret not found" })
  }
  if (existingSecret.projectId !== projectId) {
    throw createError({ status: 403, statusText: "Secret does not belong to this project" })
  }

  const orgId = existingSecret.project.orgId
  const updateData: any = {}
  if (result.data.description !== undefined) {
    updateData.description = result.data.description
  }
  if (result.data.tags !== undefined && Array.isArray(result.data.tags)) {
    updateData.tags = result.data.tags
  }

  // Update secret values within a transaction to ensure atomicity and proper history tracking
  const updatedSecret = await db.$transaction(async (tx) => {
    if (result.data.values && Array.isArray(result.data.values)) {
      for (const val of result.data.values) {
        if (!val.environment || val.value === undefined) {
          continue
        }

        // If the secret value hasn't changed, skip mutating history or running updates
        const encryptedNewValue = await encrypt(orgId, val.value)
        const existingValue = await tx.secretValue.findUnique({ where: { secretId_environment: { secretId, environment: val.environment } } })
        if (existingValue) {
          if (existingValue.value === encryptedNewValue) {
            continue
          }

          await tx.secretValueHistory.create({ data: { secretValueId: existingValue.id, value: existingValue.value, changedBy: sessionUser.id } })
          await tx.secretValue.update({ where: { id: existingValue.id }, data: { value: encryptedNewValue } })
        }
        else {
          await tx.secretValue.create({
            data: {
              secretId,
              environment: val.environment,
              value: encryptedNewValue,
              history: { create: { value: encryptedNewValue, changedBy: sessionUser.id } },
            },
          })
        }
      }
    }

    return await tx.secret.update({
      where: { id: secretId },
      data: updateData,
      include: { values: true, project: { select: { id: true, name: true, org: { select: { id: true, name: true } } } } },
    })
  })

  const updatedEnvironments = result.data.values?.map(v => v.environment) || []
  const changes = []
  if (updatedEnvironments.length > 0) {
    changes.push(`${updatedEnvironments.length} environment value(s)`)
  }
  if (result.data.tags !== undefined) {
    changes.push(`tags updated`)
  }

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: updatedSecret.project.org.id,
    projectId,
    action: "UPDATE.SECRET",
    resource: "secret",
    description: `Updated secret "${updatedSecret.key}" in project "${updatedSecret.project.name}" (${changes.join(", ") || "no-op metadata changes"})`,
    metadata: {
      secretId: updatedSecret.id,
      secretKey: updatedSecret.key,
      projectId: updatedSecret.project.id,
      projectName: updatedSecret.project.name,
      orgId: updatedSecret.project.org.id,
      orgName: updatedSecret.project.org.name,
      environments: updatedEnvironments,
    },
  })

  await deleteCached(CacheKeys.projectSecrets(projectId))
  await deleteCached(CacheKeys.userProjects(sessionUser.id, updatedSecret.project.org.id))

  const decryptedSecret = {
    ...updatedSecret,
    values: await Promise.all(updatedSecret.values.map(async val => ({ ...val, value: await decrypt(orgId, val.value) }))),
  }

  return { decryptedSecret }
})
