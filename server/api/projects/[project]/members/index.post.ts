import { addProjectMemberSchema } from "#shared/schemas/project-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `project:member:add:${sessionUser.id}`, 30)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = addProjectMemberSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? "Invalid input" })
  }

  const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true, name: true, orgId: true, org: { select: { id: true, name: true } } } })
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
  }

  const targetUser = await db.user.findUnique({ where: { id: result.data.userId }, select: { id: true, email: true, name: true, image: true } })
  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: "User not found" })
  }

  const orgMembership = await db.orgMembership.findUnique({ where: { userId_orgId: { userId: result.data.userId, orgId: project.orgId } } })
  if (!orgMembership) {
    throw createError({ statusCode: 403, statusMessage: "User must be a member of the organization first" })
  }

  const existingMembership = await db.projectMembership.findUnique({ where: { userId_projectId: { userId: result.data.userId, projectId } } })
  if (existingMembership) {
    throw createError({ statusCode: 409, statusMessage: "User is already a member of this project" })
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
    },
  })

  await deleteCached(CacheKeys.userData(result.data.userId), CacheKeys.userProjects(result.data.userId, project.orgId))

  return { membership: newMembership }
})

defineRouteMeta({
  openAPI: {
    summary: "Add project member",
    description: "Adds an existing organization member to the project. Requires project OWNER or ADMIN role.",
    tags: ["Projects"],
    parameters: [
      { in: "path", name: "project", required: true, schema: { type: "string" }, description: "Project ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["userId", "role"],
            properties: {
              userId: { type: "string" },
              role: { type: "string", enum: ["ADMIN", "MEMBER"] },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Member added" },
      400: { description: "Validation error" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role or user not in org" },
      404: { description: "Project or user not found" },
      409: { description: "User is already a project member" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
