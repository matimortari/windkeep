export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const tokenId = getRouterParam(event, "id")
  if (!projectId || !tokenId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Token ID are required" })
  }

  // Rate limit: 50 token deletions per hour per user
  await enforceRateLimit(event, `service-tokens:delete:${sessionUser.id}`, 50)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const serviceToken = await db.serviceToken.findUnique({
    where: { id: tokenId },
    select: { id: true, name: true, projectId: true, project: { select: { id: true, name: true, org: { select: { id: true, name: true } } } } },
  })
  if (!serviceToken) {
    throw createError({ statusCode: 404, statusMessage: "Service token not found" })
  }
  if (serviceToken.projectId !== projectId) {
    throw createError({ statusCode: 403, statusMessage: "Service token does not belong to this project" })
  }

  await db.serviceToken.delete({ where: { id: tokenId } })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: serviceToken.project.org.id,
    projectId: serviceToken.project.id,
    action: "REVOKE.SERVICE_TOKEN",
    resource: "service_token",
    description: `Revoked service token "${serviceToken.name}" in project "${serviceToken.project.name}"`,
    metadata: {
      serviceTokenId: serviceToken.id,
      tokenName: serviceToken.name,
    },
  })

  return { success: true, message: "Service token revoked successfully" }
})

defineRouteMeta({
  openAPI: {
    summary: "Revoke service token",
    description: "Permanently revokes a service token. Requires project OWNER or ADMIN role.",
    tags: ["Service Tokens"],
    parameters: [
      { in: "path", name: "project", required: true, schema: { type: "string" }, description: "Project ID" },
      { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Service token ID" },
    ],
    responses: {
      200: { description: "Service token revoked" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role or token belongs to a different project" },
      404: { description: "Service token not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
