export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  const inviteId = getRouterParam(event, "id")
  if (!orgId || !inviteId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID and Invitation ID are required" })
  }

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `org:invite:delete:${sessionUser.id}`, 30)
  await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER", "ADMIN"])

  const invitation = await db.invitation.findUnique({ where: { id: inviteId }, include: { org: { select: { id: true, name: true } } } })
  if (!invitation || invitation.orgId !== orgId) {
    throw createError({ statusCode: 404, statusMessage: "Invitation not found in this organization" })
  }

  // Prevent deleting historical markers for members who accepted their invitations
  if (invitation.acceptedAt) {
    throw createError({ statusCode: 400, statusMessage: "Cannot revoke an invitation that has already been accepted" })
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
    },
  })

  return { success: true, message: "Invitation revoked successfully" }
})

defineRouteMeta({
  openAPI: {
    summary: "Revoke organization invitation",
    description: "Deletes a pending invitation. Cannot revoke already-accepted invitations. Requires organization OWNER or ADMIN role.",
    tags: ["Invitations"],
    parameters: [
      { in: "path", name: "org", required: true, schema: { type: "string" }, description: "Organization ID" },
      { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Invitation ID" },
    ],
    responses: {
      200: { description: "Organization invitation revoked" },
      400: { description: "Cannot revoke an invitation that has already been accepted" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role" },
      404: { description: "Invitation not found in this organization" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
