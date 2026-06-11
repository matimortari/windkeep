import { addProjectMemberSchema } from "#shared/schemas/project-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ status: 400, statusText: "Project ID is required" })
  }

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `project:member:add:${sessionUser.id}`, 30)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = addProjectMemberSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message ?? "Invalid input" })
  }

  const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true, name: true, orgId: true, org: { select: { id: true, name: true } } } })
  if (!project) {
    throw createError({ status: 404, statusText: "Project not found" })
  }

  const targetUser = await db.user.findUnique({ where: { id: result.data.userId }, select: { id: true, email: true, name: true, image: true } })
  if (!targetUser) {
    throw createError({ status: 404, statusText: "User not found" })
  }

  const orgMembership = await db.orgMembership.findUnique({ where: { userId_orgId: { userId: result.data.userId, orgId: project.orgId } } })
  if (!orgMembership) {
    throw createError({ status: 403, statusText: "User must be a member of the organization first" })
  }

  const existingMembership = await db.projectMembership.findUnique({ where: { userId_projectId: { userId: result.data.userId, projectId } } })
  if (existingMembership) {
    throw createError({ status: 409, statusText: "User is already a member of this project" })
  }

  const newMembership = await db.projectMembership.create({
    data: { userId: result.data.userId, projectId, role: result.data.role },
    select: {
      role: true,
      user: { select: { id: true, email: true, name: true, image: true } },
      project: { select: { id: true, name: true } },
    },
  })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: project.org.id,
    projectId,
    action: "ADD.PROJECT_MEMBER",
    resource: "project_member",
    description: `Added ${newMembership.user.name} (${newMembership.user.email}) as ${newMembership.role} to project "${newMembership.project.name}"`,
    metadata: {
      memberId: newMembership.user.id,
      memberName: newMembership.user.name,
      memberEmail: newMembership.user.email,
      memberRole: newMembership.role,
      projectId: newMembership.project.id,
      projectName: newMembership.project.name,
      orgId: project.org.id,
      orgName: project.org.name,
    },
  })

  await deleteCached(CacheKeys.userData(result.data.userId), CacheKeys.userProjects(result.data.userId, project.orgId))

  return { membership: newMembership }
})
