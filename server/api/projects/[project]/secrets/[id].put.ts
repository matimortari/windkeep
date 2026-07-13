import { updateSecretSchema } from "#shared/schemas/secret-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const secretId = getRouterParam(event, "id")
  if (!projectId || !secretId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Secret ID are required" })
  }

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `secret:update:${sessionUser.id}`, 100)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateSecretSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message || "Invalid input" })
  }

  const existingSecret = await db.secret.findUnique({ where: { id: secretId }, select: { projectId: true, key: true, description: true, tags: true, project: { select: { orgId: true } } } })
  if (!existingSecret) {
    throw createError({ statusCode: 404, statusMessage: "Secret not found" })
  }
  if (existingSecret.projectId !== projectId) {
    throw createError({ statusCode: 403, statusMessage: "Secret does not belong to this project" })
  }

  const orgId = existingSecret.project.orgId
  const updateData: any = {}
  if (result.data.description !== undefined) {
    updateData.description = result.data.description
  }
  if (result.data.tags !== undefined && Array.isArray(result.data.tags)) {
    updateData.tags = result.data.tags
  }

  const valueChanges: string[] = []

  // Update secret values within a transaction to ensure atomicity and proper history tracking
  const updatedSecret = await db.$transaction(async (tx) => {
    if (result.data.values && Array.isArray(result.data.values)) {
      const incomingEnvironments = result.data.values.map(val => val.environment)
      const valuesToDelete = await tx.secretValue.findMany({ where: { secretId, environment: { notIn: incomingEnvironments } } })
      for (const valToDelete of valuesToDelete) {
        valueChanges.push(valToDelete.environment)
        await tx.secretValueHistory.deleteMany({ where: { secretValueId: valToDelete.id } })
        await tx.secretValue.delete({ where: { id: valToDelete.id } })
      }

      for (const val of result.data.values) {
        if (!val.environment || val.value === undefined) {
          continue
        }

        const existingValue = await tx.secretValue.findUnique({ where: { secretId_environment: { secretId, environment: val.environment } } })
        if (existingValue) {
          const currentPlaintext = await decrypt(orgId, existingValue.value)
          if (currentPlaintext === val.value) {
            continue
          }

          const encryptedNewValue = await encrypt(orgId, val.value)
          valueChanges.push(val.environment)
          await tx.secretValueHistory.create({ data: { secretValueId: existingValue.id, value: existingValue.value, changedBy: sessionUser.id } })
          await tx.secretValue.update({ where: { id: existingValue.id }, data: { value: encryptedNewValue } })
        }
        else {
          const encryptedNewValue = await encrypt(orgId, val.value)
          valueChanges.push(val.environment)
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

  const metadata: Record<string, unknown> = { secretId: updatedSecret.id, secretKey: updatedSecret.key }
  const changes: string[] = []
  if (valueChanges.length) {
    metadata.environments = valueChanges
    changes.push(`${valueChanges.length} environment value(s)`)
  }
  if (existingSecret.description !== updatedSecret.description) {
    metadata.oldDescription = existingSecret.description
    metadata.newDescription = updatedSecret.description
    changes.push("description")
  }
  if (result.data.tags !== undefined && JSON.stringify(existingSecret.tags) !== JSON.stringify(updatedSecret.tags)) {
    metadata.oldTags = existingSecret.tags
    metadata.newTags = updatedSecret.tags
    changes.push("tags")
  }

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: updatedSecret.project.org.id,
    projectId,
    action: "UPDATE.SECRET",
    resource: "secret",
    description: `Updated secret "${updatedSecret.key}" in project "${updatedSecret.project.name}"${changes.length ? ` (${changes.join(", ")})` : ""}`,
    metadata,
  })

  await deleteCached(CacheKeys.userProjects(sessionUser.id))

  const decryptedSecret = {
    ...updatedSecret,
    values: await Promise.all(updatedSecret.values.map(async val => ({ ...val, value: await decrypt(orgId, val.value) }))),
  }

  return { decryptedSecret }
})

defineRouteMeta({
  openAPI: {
    summary: "Update secret",
    description: "Updates a secret's metadata and/or per-environment values. Requires project OWNER or ADMIN role.",
    tags: ["Secrets"],
    parameters: [
      { in: "path", name: "project", required: true, schema: { type: "string" }, description: "Project ID" },
      { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Secret ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              description: { type: "string", description: "Secret description (optional)" },
              tags: { type: "array", items: { type: "string" }, description: "Secret tags (optional)" },
              values: {
                type: "array",
                description: "Full desired state. Environments omitted from this array will be deleted",
                items: {
                  type: "object",
                  required: ["environment", "value"],
                  properties: {
                    environment: { type: "string", enum: ["DEVELOPMENT", "STAGING", "PRODUCTION"], description: "Secret environment(s)" },
                    value: { type: "string", description: "Secret value(s)" },
                  },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Updated secret with decrypted values" },
      400: { description: "Validation error" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role or secret belongs to a different project" },
      404: { description: "Secret not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
