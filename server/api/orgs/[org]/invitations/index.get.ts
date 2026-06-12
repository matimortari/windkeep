export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `org:invite:list:${sessionUser.id}`, 100)
  await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER", "ADMIN"])

  const invitations = await db.invitation.findMany({
    where: { orgId, acceptedAt: null },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
      invitedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return { invitations }
})
