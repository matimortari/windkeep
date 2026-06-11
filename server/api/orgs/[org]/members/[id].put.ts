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
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const targetRole = await db.orgMembership.findUnique({ where: { userId_orgId: { userId: memberId, orgId } } })
  if (!targetRole) {
    throw createError({ status: 404, statusText: "Member not found in organization" })
  }
  if (targetRole.role === "OWNER") {
    throw createError({ status: 403, statusText: "Cannot change the role of organization owners" })
  }
  if (memberId === sessionUser.id) {
    throw createError({ status: 400, statusText: "You cannot change your own role" })
  }

  const updatedRole = await db.orgMembership.update({
    where: { userId_orgId: { userId: memberId, orgId } },
    data: { role: result.data.role },
    include: {
      user: { select: { id: true, email: true, name: true, image: true } },
      org: { select: { id: true, name: true } },
    },
  })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId,
    action: "UPDATE.ORG_MEMBER_ROLE",
    resource: "organization_member",
    description: `Updated ${updatedRole.user.name} (${updatedRole.user.email}) role from ${targetRole.role} to ${updatedRole.role} in organization "${updatedRole.org.name}"`,
    metadata: {
      memberId: updatedRole.user.id,
      memberName: updatedRole.user.name,
      memberEmail: updatedRole.user.email,
      oldRole: targetRole.role,
      newRole: updatedRole.role,
      orgId: updatedRole.org.id,
      orgName: updatedRole.org.name,
    },
  })

  await deleteCached(CacheKeys.userData(memberId))

  return { updatedRole }
})
