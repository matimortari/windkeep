import { createHash, randomBytes } from "node:crypto"
import { createServiceTokenSchema } from "#shared/schemas/service-token-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  // Rate limit: 20 token creations per hour per user
  await enforceRateLimit(event, `service-tokens:create:${sessionUser.id}`, 20)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = createServiceTokenSchema.safeParse({ ...body, projectId })
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message || "Invalid input" })
  }

  const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true, name: true, org: { select: { id: true, name: true } } } })
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
  }

  // Calculate Expiration Date
  let expiresAt: Date | null = null
  if (result.data.expiresInDays) {
    expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + result.data.expiresInDays)
  }

  const rawToken = `st_${randomBytes(24).toString("hex")}`
  const serviceToken = await db.serviceToken.create({
    data: {
      name: result.data.name,
      tokenHash: createHash("sha256").update(rawToken).digest("hex"),
      environment: result.data.environment,
      projectId,
      createdBy: sessionUser.id,
      expiresAt,
    },
    select: { id: true, name: true, environment: true, expiresAt: true, createdAt: true },
  })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: project.org.id,
    projectId: project.id,
    action: "CREATE.SERVICE_TOKEN",
    resource: "service_token",
    description: `Created service token "${serviceToken.name}" for environment(s): ${serviceToken.environment.join(", ")}`,
    metadata: {
      serviceTokenId: serviceToken.id,
      tokenName: serviceToken.name,
      environments: serviceToken.environment,
      projectId: project.id,
      projectName: project.name,
    },
  })

  return { serviceToken, rawToken, message: "Store this token securely. You will not be able to see it again." }
})

defineRouteMeta({
  openAPI: {
    summary: "Create service token",
    description: "Creates a new service token scoped to one or more environments. The raw token is returned only once — store it securely. Requires project OWNER or ADMIN.",
    tags: ["Service Tokens"],
    parameters: [
      { in: "path", name: "project", required: true, schema: { type: "string" }, description: "Project ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name", "environment"],
            properties: {
              name: { type: "string", description: "Service token name" },
              environment: { type: "array", items: { type: "string", enum: ["DEVELOPMENT", "STAGING", "PRODUCTION"] }, description: "Service token environments" },
              expiresInDays: { type: "integer", description: "Expiration days (optional)" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Service token created" },
      400: { description: "Validation error" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role" },
      404: { description: "Project not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
