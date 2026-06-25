import { updateOrgMemberRoleSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  const memberId = getRouterParam(event, "id")
  if (!orgId || !memberId) {
    throw createError({ status: 400, statusText: "Organization ID and Member ID are required" })
  }

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `org:member:update:${sessionUser.id}`, 30)
  await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateOrgMemberRoleSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message ?? "Invalid input" })
  }

  const targetMembership = await db.orgMembership.findUnique({ where: { userId_orgId: { userId: memberId, orgId } } })
  if (!targetMembership) {
    throw createError({ status: 404, statusText: "Member not found in organization" })
  }
  if (targetMembership.role === "OWNER") {
    throw createError({ status: 403, statusText: "Cannot change the role of organization owners" })
  }
  if (memberId === sessionUser.id) {
    throw createError({ status: 400, statusText: "You cannot change your own role" })
  }

  const updatedMembership = await db.orgMembership.update({
    where: { userId_orgId: { userId: memberId, orgId } },
    data: { role: result.data.role },
    select: {
      role: true,
      user: { select: { id: true, email: true, name: true, image: true } },
      org: { select: { id: true, name: true } },
    },
  })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: updatedMembership.org.id,
    action: "UPDATE.ORG_MEMBER_ROLE",
    resource: "org_member",
    description: `Updated ${updatedMembership.user.name} (${updatedMembership.user.email}) role from ${targetMembership.role} to ${updatedMembership.role} in organization "${updatedMembership.org.name}"`,
    metadata: {
      memberId: updatedMembership.user.id,
      memberName: updatedMembership.user.name,
      memberEmail: updatedMembership.user.email,
      oldRole: targetMembership.role,
      newRole: updatedMembership.role,
      orgId: updatedMembership.org.id,
      orgName: updatedMembership.org.name,
    },
  })

  await deleteCached(CacheKeys.userData(memberId), CacheKeys.userProjects(memberId, updatedMembership.org.id))

  return { membership: updatedMembership }
})

defineRouteMeta({
  openAPI: {
    summary: "Update organization member role",
    description: "Updates a organization member's role. Cannot change owner roles or your own role. Requires organization OWNER or ADMIN role.",
    tags: ["Organizations"],
    parameters: [
      { in: "path", name: "org", required: true, schema: { type: "string" }, description: "Organization ID" },
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
              role: { type: "string", enum: ["ADMIN", "MEMBER"], description: "Member role" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Updated membership with user details" },
      400: { description: "Validation error or attempting to change own role" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role or attempting to change an owner's role" },
      404: { description: "Member not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
