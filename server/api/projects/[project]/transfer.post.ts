import { transferProjectOwnershipSchema } from "#shared/schemas/project-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  // Rate limit: 5 requests per hour per user
  await enforceRateLimit(event, `project:transfer:${sessionUser.id}`, 5)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER"])

  const body = await readBody(event)
  const result = transferProjectOwnershipSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message || "Invalid input" })
  }
  if (result.data.newOwnerId === sessionUser.id) {
    throw createError({ statusCode: 400, statusMessage: "Cannot transfer ownership to yourself" })
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, orgId: true, memberships: { where: { role: "OWNER" }, select: { userId: true } } },
  })
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
  }

  const newOwnerMembership = await db.projectMembership.findUnique({
    where: { userId_projectId: { userId: result.data.newOwnerId, projectId } },
    include: { user: { select: { id: true, email: true, name: true } } },
  })
  if (!newOwnerMembership) {
    throw createError({ statusCode: 404, statusMessage: "New owner is not a member of this project" })
  }
  if (newOwnerMembership.role === "OWNER") {
    throw createError({ statusCode: 400, statusMessage: "User is already an owner of this project" })
  }

  const orgMembership = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: result.data.newOwnerId, orgId: project.orgId } },
  })
  if (!orgMembership) {
    throw createError({ statusCode: 403, statusMessage: "New owner must be a member of the organization" })
  }

  const currentOwner = await db.user.findUnique({ where: { id: sessionUser.id }, select: { name: true, email: true } })
  const previousOwnerIds = project.memberships.map(m => m.userId)

  await db.$transaction([...previousOwnerIds.map(userId => db.projectMembership.update({
    where: { userId_projectId: { userId, projectId } },
    data: { role: "ADMIN" },
  })), db.projectMembership.update({
    where: { userId_projectId: { userId: result.data.newOwnerId, projectId } },
    data: { role: "OWNER" },
  })])

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: project.orgId,
    projectId,
    action: "TRANSFER.PROJECT_OWNERSHIP",
    resource: "project",
    description: `${currentOwner?.name} (${currentOwner?.email}) transferred ownership of project "${project.name}" to ${newOwnerMembership.user.name} (${newOwnerMembership.user.email})`,
    metadata: {
      fromUserId: sessionUser.id,
      fromUserName: currentOwner?.name,
      fromUserEmail: currentOwner?.email,
      toUserId: result.data.newOwnerId,
      toUserName: newOwnerMembership.user.name,
      toUserEmail: newOwnerMembership.user.email,
      previousOwnerIds,
    },
  })

  await invalidateOrgProjectCaches(project.orgId, sessionUser.id, result.data.newOwnerId, ...previousOwnerIds)
  await deleteCached(CacheKeys.userData(sessionUser.id), CacheKeys.userData(result.data.newOwnerId))

  return {
    success: true,
    message: `Ownership transferred to ${newOwnerMembership.user.name}`,
    newOwner: { id: newOwnerMembership.user.id, name: newOwnerMembership.user.name, email: newOwnerMembership.user.email },
  }
})

defineRouteMeta({
  openAPI: {
    summary: "Transfer project ownership",
    description: "Transfers OWNER role to another project member. Previous project owners are demoted to ADMIN. Requires project OWNER role.",
    tags: ["Projects"],
    parameters: [{ in: "path", name: "project", required: true, schema: { type: "string" }, description: "Project ID" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["newOwnerId"],
            properties: {
              newOwnerId: { type: "string", description: "New owner user ID (must already be a project member)" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Ownership transferred, returns new owner details" },
      400: { description: "Invalid input or cannot transfer to self" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role" },
      404: { description: "Project or new owner membership not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
