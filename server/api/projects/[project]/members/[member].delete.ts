export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const memberId = getRouterParam(event, "member")
  if (!projectId || !memberId) {
    throw createError({ status: 400, statusText: "Project ID and Member ID are required" })
  }

  const targetRole = await db.projectMembership.findUnique({
    where: { userId_projectId: { userId: memberId, projectId } },
    include: {
      user: { select: { id: true, email: true, name: true } },
      project: { select: { id: true, name: true, org: { select: { id: true, name: true } } } },
    },
  })
  if (!targetRole) {
    throw createError({ status: 404, statusText: "Member not found in project" })
  }

  // Prevent removing OWNER users
  if (targetRole.role === "OWNER") {
    if (memberId === user.id) {
      throw createError({ status: 400, statusText: "Cannot leave project as owner. Please transfer ownership to another member first, or delete the project." })
    }
    else {
      throw createError({ status: 403, statusText: "Cannot remove project owners." })
    }
  }

  // Check permissions for non-self removal
  if (memberId !== user.id) {
    await requireRole(user.id, { type: "project", projectId }, ["OWNER", "ADMIN"])
  }

  await db.projectMembership.delete({ where: { userId_projectId: { userId: memberId, projectId } } })

  await createAuditLog({
    event,
    userId: user.id,
    orgId: targetRole.project.org.id,
    projectId,
    action: "REMOVE.PROJECT_MEMBER",
    resource: "project_member",
    description: memberId === user.id ? `${targetRole.user.name} (${targetRole.user.email}) left project "${targetRole.project.name}"` : `Removed ${targetRole.user.name} (${targetRole.user.email}) from project "${targetRole.project.name}"`,
    metadata: {
      memberId: targetRole.user.id,
      memberName: targetRole.user.name,
      memberEmail: targetRole.user.email,
      memberRole: targetRole.role,
      projectId: targetRole.project.id,
      projectName: targetRole.project.name,
      orgId: targetRole.project.org.id,
      orgName: targetRole.project.org.name,
    },
  })

  // Invalidate cache for removed user's data and projects
  await deleteCached(CacheKeys.userData(memberId), CacheKeys.userProjects(memberId))

  return { success: true, message: "Member removed successfully" }
})
