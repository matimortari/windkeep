export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const secretId = getRouterParam(event, "id")
  if (!projectId || !secretId) {
    throw createError({ status: 400, statusText: "Project ID and Secret ID are required" })
  }

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `secret:delete:${sessionUser.id}`, 100)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const existingSecret = await db.secret.findUnique({
    where: { id: secretId },
    select: { id: true, key: true, projectId: true, project: { select: { id: true, name: true, org: { select: { id: true, name: true } } } }, _count: { select: { values: true } } },
  })
  if (!existingSecret) {
    throw createError({ status: 404, statusText: "Secret not found" })
  }
  if (existingSecret.projectId !== projectId) {
    throw createError({ status: 403, statusText: "Secret does not belong to this project" })
  }

  await db.secret.delete({ where: { id: secretId } })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: existingSecret.project.org.id,
    projectId,
    action: "DELETE.SECRET",
    resource: "secret",
    description: `Deleted secret "${existingSecret.key}" from project "${existingSecret.project.name}" (${existingSecret._count.values} value(s) deleted)`,
    metadata: {
      secretId: existingSecret.id,
      secretKey: existingSecret.key,
      projectId: existingSecret.project.id,
      projectName: existingSecret.project.name,
      orgId: existingSecret.project.org.id,
      orgName: existingSecret.project.org.name,
      valuesDeleted: existingSecret._count.values,
    },
  })

  await deleteCached(CacheKeys.userProjects(sessionUser.id, existingSecret.project.org.id))

  return { success: true, message: `Secret deleted successfully` }
})

defineRouteMeta({
  openAPI: {
    summary: "Delete secret",
    description: "Permanently deletes a secret and all its environment values and history. Requires project OWNER or ADMIN role.",
    tags: ["Secrets"],
    parameters: [
      { in: "path", name: "project", required: true, schema: { type: "string" }, description: "Project ID" },
      { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Secret ID" },
    ],
    responses: {
      200: { description: "Secret deleted" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role or secret belongs to a different project" },
      404: { description: "Secret not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
