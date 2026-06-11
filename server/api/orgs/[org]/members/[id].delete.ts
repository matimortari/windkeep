export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  const memberId = getRouterParam(event, "id")
  if (!orgId || !memberId) {
    throw createError({ status: 400, statusText: "Organization ID and Member ID are required" })
  }

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `org:member:delete:${sessionUser.id}`, 30)

  const targetRole = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: memberId, orgId } },
    include: { user: { select: { id: true, email: true, name: true } }, org: { select: { id: true, name: true } } },
  })
  if (!targetRole) {
    throw createError({ status: 404, statusText: "Member not found in organization" })
  }

  // Check permissions for non-self removal
  if (memberId !== sessionUser.id) {
    await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER", "ADMIN"])
    if (targetRole.role === "OWNER") {
      throw createError({ status: 403, statusText: "Cannot remove organization owners." })
    }
  }
  else if (targetRole.role === "OWNER") {
    const otherMembers = await db.orgMembership.findMany({ where: { orgId, userId: { not: memberId } } })
    if (otherMembers.length === 0) {
      await db.organization.delete({ where: { id: orgId } })
      await deleteCached(CacheKeys.userData(memberId))
      return { success: true, message: "Left organization. Organization was deleted as you were the last member" }
    }

    throw createError({ status: 400, statusText: "Cannot leave organization as owner. Please transfer ownership to another member first, or delete the organization." })
  }

  // Ensure no dangling active org
  if (targetRole.isActive) {
    await db.orgMembership.update({ where: { userId_orgId: { userId: memberId, orgId } }, data: { isActive: false } })

    // Switch to another org if possible
    const next = await db.orgMembership.findFirst({
      where: { userId: memberId, orgId: { not: orgId } },
      orderBy: { createdAt: "asc" },
    })
    if (next) {
      await db.orgMembership.update({
        where: { userId_orgId: { userId: memberId, orgId: next.orgId } },
        data: { isActive: true },
      })
    }
  }

  // Remove user from all projects in this organization
  const projectsInOrg = await db.project.findMany({ where: { orgId }, select: { id: true } })
  if (projectsInOrg.length > 0) {
    await db.projectMembership.deleteMany({ where: { userId: memberId, projectId: { in: projectsInOrg.map(p => p.id) } } })
  }

  await db.orgMembership.delete({ where: { userId_orgId: { userId: memberId, orgId } } })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId,
    action: "REMOVE.ORG_MEMBER",
    resource: "organization_member",
    description: memberId === sessionUser.id ? `${targetRole.user.name} left organization "${targetRole.org.name}"` : `Removed ${targetRole.user.name} from organization "${targetRole.org.name}"`,
    metadata: {
      memberId: targetRole.user.id,
      memberName: targetRole.user.name,
      memberEmail: targetRole.user.email,
      memberRole: targetRole.role,
      orgId: targetRole.org.id,
      orgName: targetRole.org.name,
    },
  })

  await deleteCached(CacheKeys.userData(memberId))

  return { success: true, message: "Member removed successfully" }
})
