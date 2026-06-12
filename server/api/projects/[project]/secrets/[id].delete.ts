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

  // Create audit log before deletion
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

  await db.secret.delete({ where: { id: secretId } })

  await deleteCached(CacheKeys.projectSecrets(projectId))
  await deleteCached(CacheKeys.userProjects(sessionUser.id, existingSecret.project.org.id))

  return { success: true, message: `Secret deleted successfully` }
})
