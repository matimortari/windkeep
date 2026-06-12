import { createHash, randomBytes } from "node:crypto"
import { createServiceTokenSchema } from "#shared/schemas/service-token-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ status: 400, statusText: "Project ID is required" })
  }

  // Rate limit: 20 token creations per hour per user
  await enforceRateLimit(event, `service-tokens:create:${sessionUser.id}`, 20)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = createServiceTokenSchema.safeParse({ ...body, projectId })
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true, name: true, org: { select: { id: true, name: true } } } })
  if (!project) {
    throw createError({ status: 404, statusText: "Project not found" })
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
