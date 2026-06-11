import { updateProjectMemberSchema } from "#shared/schemas/project-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const memberId = getRouterParam(event, "id")
  if (!projectId || !memberId) {
    throw createError({ status: 400, statusText: "Project ID and Member ID are required" })
  }

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `project:member:update:${sessionUser.id}`, 30)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateProjectMemberSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message ?? "Invalid input" })
  }

  const targetMembership = await db.projectMembership.findUnique({ where: { userId_projectId: { userId: memberId, projectId } } })
  if (!targetMembership) {
    throw createError({ status: 404, statusText: "Member not found in project" })
  }
  if (targetMembership.role === "OWNER") {
    throw createError({ status: 403, statusText: "Cannot change the role of project owners" })
  }
  if (memberId === sessionUser.id) {
    throw createError({ status: 400, statusText: "You cannot change your own role" })
  }

  const updatedMembership = await db.projectMembership.update({
    where: { userId_projectId: { userId: memberId, projectId } },
    data: { role: result.data.role },
    select: {
      role: true,
      user: { select: { id: true, email: true, name: true, image: true } },
      project: { select: { id: true, name: true, orgId: true, org: { select: { id: true, name: true } } } },
    },
  })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: updatedMembership.project.org.id,
    projectId,
    action: "UPDATE.PROJECT_MEMBER_ROLE",
    resource: "project_member",
    description: `Updated ${updatedMembership.user.name} (${updatedMembership.user.email}) role from ${targetMembership.role} to ${updatedMembership.role} in project "${updatedMembership.project.name}"`,
    metadata: {
      memberId: updatedMembership.user.id,
      memberName: updatedMembership.user.name,
      memberEmail: updatedMembership.user.email,
      oldRole: targetMembership.role,
      newRole: updatedMembership.role,
      projectId: updatedMembership.project.id,
      projectName: updatedMembership.project.name,
      orgId: updatedMembership.project.org.id,
      orgName: updatedMembership.project.org.name,
    },
  })

  await deleteCached(CacheKeys.userData(memberId), CacheKeys.userProjects(memberId, updatedMembership.project.orgId))

  return { membership: updatedMembership }
})
