import { createSecretSchema } from "#shared/schemas/secret-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `secret:create:${sessionUser.id}`, 100)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = createSecretSchema.safeParse({ ...body, projectId })
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message || "Invalid input" })
  }

  const existingSecret = await db.secret.findUnique({ where: { key_projectId: { key: result.data.key, projectId } } })
  if (existingSecret) {
    throw createError({ statusCode: 409, statusMessage: "A secret with this key already exists in the project" })
  }

  const project = await db.project.findUnique({ where: { id: projectId }, select: { orgId: true } })
  if (!project?.orgId) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
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
      environments: secret.values.map(v => v.environment),
    },
  })

  await deleteCached(CacheKeys.userProjects(sessionUser.id, secret.project.org.id))

  const decryptedSecret = {
    ...secret,
    values: await Promise.all(secret.values.map(async val => ({ ...val, value: await decrypt(project.orgId, val.value) }))),
  }

  return { decryptedSecret }
})

defineRouteMeta({
  openAPI: {
    summary: "Create secret",
    description: "Creates a new secret with optional per-environment values. Values are encrypted at rest. Seeds initial history for each value. Requires project OWNER or ADMIN role.",
    tags: ["Secrets"],
    parameters: [
      { in: "path", name: "project", required: true, schema: { type: "string" }, description: "Project ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["key"],
            properties: {
              key: { type: "string", description: "Secret key" },
              description: { type: "string", description: "Secret description (optional)" },
              tags: { type: "array", items: { type: "string" }, description: "Secret tags (optional)" },
              values: {
                type: "array",
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
      200: { description: "Created secret with decrypted values" },
      400: { description: "Validation error" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role" },
      404: { description: "Project not found" },
      409: { description: "A secret with this key already exists in the project" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
