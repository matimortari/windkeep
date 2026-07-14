export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  // Rate limit: 10 requests per hour per user
  await enforceRateLimit(event, `project:delete:${sessionUser.id}`, 10)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER"])

  const projectData = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      slug: true,
      orgId: true,
      org: { select: { name: true } },
      _count: { select: { secrets: true, memberships: true } },
    },
  })
  if (!projectData) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
  }

  await db.project.delete({ where: { id: projectId } })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: projectData.orgId,
    projectId,
    action: "DELETE.PROJECT",
    resource: "project",
    description: `Deleted project "${projectData.name}" from organization "${projectData.org.name}" (${projectData._count.secrets} secret(s), ${projectData._count.memberships} member(s))`,
    metadata: {
      projectName: projectData.name,
      secretsDeleted: projectData._count.secrets,
      membersRemoved: projectData._count.memberships,
    },
  })

  await deleteCached(CacheKeys.userProjects(sessionUser.id, projectData.orgId))

  return { success: true, message: "Project deleted successfully" }
})

defineRouteMeta({
  openAPI: {
    summary: "Delete project",
    description: "Permanently deletes the project and all related data. Requires project OWNER role.",
    tags: ["Projects"],
    parameters: [
      { in: "path", name: "project", required: true, schema: { type: "string" }, description: "Project ID" },
    ],
    responses: {
      200: { description: "Project deleted" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role" },
      404: { description: "Project not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
