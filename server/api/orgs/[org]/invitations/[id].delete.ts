export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  const inviteId = getRouterParam(event, "id")
  if (!orgId || !inviteId) {
    throw createError({ status: 400, statusText: "Organization ID and Invitation ID are required" })
  }

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `org:invite:delete:${sessionUser.id}`, 30)
  await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER", "ADMIN"])

  const invitation = await db.invitation.findUnique({ where: { id: inviteId }, include: { org: { select: { id: true, name: true } } } })
  if (!invitation || invitation.orgId !== orgId) {
    throw createError({ status: 404, statusText: "Invitation not found in this organization" })
  }

  // Prevent deleting historical markers for members who accepted their invitations
  if (invitation.acceptedAt) {
    throw createError({ status: 400, statusText: "Cannot revoke an invitation that has already been accepted" })
  }

  await db.invitation.delete({ where: { id: inviteId } })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: invitation.org.id,
    action: "REVOKE.ORG_INVITE",
    resource: "org_invite",
    description: `Revoked pending invite sent to ${invitation.email} for organization "${invitation.org.name}"`,
    metadata: {
      inviteId: invitation.id,
      inviteeEmail: invitation.email,
      inviteeRole: invitation.role,
      orgId: invitation.org.id,
      orgName: invitation.org.name,
    },
  })

  return { success: true, message: "Invitation revoked successfully" }
})
