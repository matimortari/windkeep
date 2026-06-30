export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const memberId = getRouterParam(event, "id")
  if (!projectId || !memberId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Member ID are required" })
  }

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `project:member:delete:${sessionUser.id}`, 30)

  const targetMembership = await db.projectMembership.findUnique({
    where: { userId_projectId: { userId: memberId, projectId } },
    select: {
      role: true,
      user: { select: { id: true, email: true, name: true } },
      project: { select: { id: true, name: true, orgId: true, org: { select: { id: true, name: true } } } },
    },
  })
  if (!targetMembership) {
    throw createError({ statusCode: 404, statusMessage: "Member not found in project" })
  }
  if (targetMembership.role === "OWNER") {
    throw createError({ statusCode: memberId === sessionUser.id ? 400 : 403, statusMessage: memberId === sessionUser.id ? "Cannot leave project as owner. Transfer ownership or delete the project first." : "Cannot remove project owners." })
  }
  if (memberId !== sessionUser.id) {
    await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])
  }

  await db.projectMembership.delete({ where: { userId_projectId: { userId: memberId, projectId } } })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: targetMembership.project.org.id,
    projectId,
    action: "REMOVE.PROJECT_MEMBER",
    resource: "project_member",
    description: memberId === sessionUser.id ? `${targetMembership.user.name} (${targetMembership.user.email}) left project "${targetMembership.project.name}"` : `Removed ${targetMembership.user.name} (${targetMembership.user.email}) from project "${targetMembership.project.name}"`,
    metadata: {
      memberId: targetMembership.user.id,
      memberName: targetMembership.user.name,
      memberEmail: targetMembership.user.email,
      memberRole: targetMembership.role,
      projectId: targetMembership.project.id,
      projectName: targetMembership.project.name,
      orgId: targetMembership.project.org.id,
      orgName: targetMembership.project.org.name,
    },
  })

  await deleteCached(CacheKeys.userData(memberId), CacheKeys.userProjects(memberId, targetMembership.project.orgId))

  return { success: true, message: "Member removed successfully" }
})

defineRouteMeta({
  openAPI: {
    summary: "Remove or leave project",
    description: "Removes a project member from the project. Members can remove themselves (leave). Owners cannot be removed, transfer ownership or delete the project first. Requires project OWNER or ADMIN role.",
    tags: ["Projects"],
    parameters: [
      { in: "path", name: "project", required: true, schema: { type: "string" }, description: "Project ID" },
      { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Member user ID" },
    ],
    responses: {
      200: { description: "Member removed" },
      400: { description: "Cannot remove owner, transfer ownership or delete the project first" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role or attempting to remove an owner" },
      404: { description: "Member not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
