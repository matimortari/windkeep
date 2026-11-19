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
  const actorMembership = await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateProjectMemberSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? "Invalid input" })
  }

  const targetMembership = await db.projectMembership.findUnique({ where: { userId_projectId: { userId: memberId, projectId } } })
  if (!targetMembership) {
    throw createError({ statusCode: 404, statusMessage: "Member not found in project" })
  }
  if (memberId === sessionUser.id) {
    throw createError({ statusCode: 400, statusMessage: "You cannot change your own role" })
  }
  const rank = { OWNER: 2, ADMIN: 1, MEMBER: 0 } as const
  if (rank[actorMembership.role] <= rank[targetMembership.role]) {
    throw createError({ statusCode: 403, statusMessage: "Cannot change this member's role" })
  }

  const nextRole = result.data.role ?? targetMembership.role
  if (nextRole === "OWNER") {
    throw createError({ statusCode: 400, statusMessage: "Cannot assign OWNER role via member update" })
  }

  const data: { role?: "ADMIN" | "MEMBER", environment?: Environment[] } = {}
  if (result.data.role) {
    data.role = result.data.role
  }
  if (nextRole === "ADMIN") {
    data.environment = ["DEVELOPMENT", "STAGING", "PRODUCTION"]
  }
  else if (result.data.environment) {
    data.environment = result.data.environment
  }

  const updatedMembership = await db.projectMembership.update({
    where: { userId_projectId: { userId: memberId, projectId } },
    data,
    select: {
      role: true,
      environment: true,
      user: { select: { id: true, email: true, name: true, image: true } },
      project: { select: { id: true, name: true, orgId: true, org: { select: { id: true, name: true } } } },
    },
  })

  const changes: string[] = []
  const metadata: Record<string, unknown> = {
    memberId: updatedMembership.user.id,
    memberName: updatedMembership.user.name,
    memberEmail: updatedMembership.user.email,
  }
  if (targetMembership.role !== updatedMembership.role) {
    changes.push(`role from ${targetMembership.role} to ${updatedMembership.role}`)
    metadata.oldRole = targetMembership.role
    metadata.newRole = updatedMembership.role
  }
  if (JSON.stringify(targetMembership.environment) !== JSON.stringify(updatedMembership.environment)) {
    changes.push(`environments to ${updatedMembership.environment.join(", ")}`)
    metadata.oldEnvironments = targetMembership.environment
    metadata.newEnvironments = updatedMembership.environment
  }

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: updatedMembership.project.org.id,
    projectId,
    action: "UPDATE.PROJECT_MEMBER",
    resource: "project_member",
    description: `Updated ${updatedMembership.user.name} (${updatedMembership.user.email}) in project "${updatedMembership.project.name}": ${changes.join("; ") || "no changes"}`,
    metadata,
  })

  await deleteCached(CacheKeys.userData(memberId))
  await invalidateProjectMembershipCaches(projectId, updatedMembership.project.orgId, sessionUser.id, memberId)

  return { membership: updatedMembership }
})

defineRouteMeta({
  openAPI: {
    summary: "Update project member",
    description: "Updates a project member's role and/or readable environments. Cannot change owner roles or your own role. ADMINs always get all environments. Requires project OWNER or ADMIN role.",
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
            properties: {
              role: { type: "string", enum: ["ADMIN", "MEMBER"] },
              environment: { type: "array", items: { type: "string", enum: ["DEVELOPMENT", "STAGING", "PRODUCTION"] } },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Updated membership" },
      400: { description: "Validation error or attempting to change own role" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role to change this member" },
      404: { description: "Member not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
