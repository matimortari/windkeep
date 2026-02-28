import { updateProjectMemberSchema } from "#shared/schemas/project-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const memberId = getRouterParam(event, "member")
  if (!projectId || !memberId) {
    throw createError({ status: 400, statusText: "Project ID and Member ID are required" })
  }

  await requireRole(user.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateProjectMemberSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const targetRole = await db.projectMembership.findUnique({ where: { userId_projectId: { userId: memberId, projectId } } })
  if (!targetRole) {
    throw createError({ status: 404, statusText: "Member not found in project" })
  }
  if (targetRole.role === "OWNER") {
    throw createError({ status: 403, statusText: "Cannot change the role of project owners" })
  }
  if (memberId === user.id) {
    throw createError({ status: 400, statusText: "You cannot change your own role" })
  }

  const updatedRole = await db.projectMembership.update({
    where: { userId_projectId: { userId: memberId, projectId } },
    data: { role: result.data.role },
    include: {
      user: { select: { id: true, email: true, name: true, image: true } },
      project: { select: { id: true, name: true, org: { select: { id: true, name: true } } } },
    },
  })

  await createAuditLog({
    event,
    userId: user.id,
    orgId: updatedRole.project.org.id,
    projectId,
    action: "UPDATE.PROJECT_MEMBER_ROLE",
    resource: "project_member",
    description: `Updated ${updatedRole.user.name} (${updatedRole.user.email}) role from ${targetRole.role} to ${updatedRole.role} in project "${updatedRole.project.name}"`,
    metadata: {
      memberId: updatedRole.user.id,
      memberName: updatedRole.user.name,
      memberEmail: updatedRole.user.email,
      oldRole: targetRole.role,
      newRole: updatedRole.role,
      projectId: updatedRole.project.id,
      projectName: updatedRole.project.name,
      orgId: updatedRole.project.org.id,
      orgName: updatedRole.project.org.name,
    },
  })

  // Invalidate cache for affected user's data and projects
  await deleteCached(CacheKeys.userData(memberId), CacheKeys.userProjects(memberId))

  return { updatedRole }
})
