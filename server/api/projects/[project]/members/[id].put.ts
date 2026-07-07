import { updateProjectMemberSchema } from "#shared/schemas/project-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const memberId = getRouterParam(event, "id")
  if (!projectId || !memberId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Member ID are required" })
  }

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `project:member:update:${sessionUser.id}`, 30)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateProjectMemberSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? "Invalid input" })
  }

  const targetMembership = await db.projectMembership.findUnique({ where: { userId_projectId: { userId: memberId, projectId } } })
  if (!targetMembership) {
    throw createError({ statusCode: 404, statusMessage: "Member not found in project" })
  }
  if (targetMembership.role === "OWNER") {
    throw createError({ statusCode: 403, statusMessage: "Cannot change the role of project owners" })
  }
  if (memberId === sessionUser.id) {
    throw createError({ statusCode: 400, statusMessage: "You cannot change your own role" })
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
    },
  })

  await deleteCached(CacheKeys.userData(memberId), CacheKeys.userProjects(memberId))

  return { membership: updatedMembership }
})

defineRouteMeta({
  openAPI: {
    summary: "Update project member role",
    description: "Updates a project member's role. Cannot change owner roles or your own role. Requires project OWNER or ADMIN role.",
    tags: ["Projects"],
    parameters: [
      { in: "path", name: "project", required: true, schema: { type: "string" }, description: "Project ID" },
      { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Member user ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["role"],
            properties: {
              role: { type: "string", enum: ["ADMIN", "MEMBER"] },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Updated membership" },
      400: { description: "Validation error or attempting to change own role" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role or attempting to change an owner's role" },
      404: { description: "Member not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
