export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  const memberId = getRouterParam(event, "id")
  if (!orgId || !memberId) {
    throw createError({ status: 400, statusText: "Organization ID and Member ID are required" })
  }

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `org:member:delete:${sessionUser.id}`, 30)

  const targetMembership = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: memberId, orgId } },
    select: {
      role: true,
      user: { select: { id: true, email: true, name: true } },
      org: { select: { id: true, name: true } },
    },
  })
  if (!targetMembership) {
    throw createError({ status: 404, statusText: "Member not found in organization" })
  }
  if (targetMembership.role === "OWNER") {
    throw createError({ status: memberId === sessionUser.id ? 400 : 403, statusText: memberId === sessionUser.id ? "Cannot leave organization as owner. Transfer ownership or delete the organization first." : "Cannot remove organization owners." })
  }
  if (memberId !== sessionUser.id) {
    await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER", "ADMIN"])
  }

  await db.orgMembership.delete({ where: { userId_orgId: { userId: memberId, orgId } } })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: targetMembership.org.id,
    action: "REMOVE.ORG_MEMBER",
    resource: "org_member",
    description: memberId === sessionUser.id ? `${targetMembership.user.name} (${targetMembership.user.email}) left organization "${targetMembership.org.name}"` : `Removed ${targetMembership.user.name} (${targetMembership.user.email}) from organization "${targetMembership.org.name}"`,
    metadata: {
      memberId: targetMembership.user.id,
      memberName: targetMembership.user.name,
      memberEmail: targetMembership.user.email,
      memberRole: targetMembership.role,
      orgId: targetMembership.org.id,
      orgName: targetMembership.org.name,
    },
  })

  await deleteCached(CacheKeys.userData(memberId), CacheKeys.userProjects(memberId, orgId))

  return { success: true, message: "Member removed successfully" }
})

defineRouteMeta({
  openAPI: {
    summary: "Remove or leave organization",
    description: "Removes a member from the org. Members can remove themselves (leave). Admins can remove members. Owners cannot be removed — transfer ownership first.",
    tags: ["Organizations"],
    parameters: [
      { in: "path", name: "org", required: true, schema: { type: "string" }, description: "Organization ID" },
      { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Member user ID" },
    ],
    responses: {
      200: { description: "Member removed" },
      400: { description: "Cannot remove owner — transfer ownership first" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role or attempting to remove an owner" },
      404: { description: "Member not found in organization" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
