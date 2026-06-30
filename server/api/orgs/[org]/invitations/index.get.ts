export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
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

defineRouteMeta({
  openAPI: {
    summary: "List pending organization invitations",
    description: "Returns all pending (unaccepted) invitations for the organization. Requires organization OWNER or ADMIN role.",
    tags: ["Invitations"],
    parameters: [
      { in: "path", name: "org", required: true, schema: { type: "string" }, description: "Organization ID" },
    ],
    responses: {
      200: { description: "List of pending organization invitations" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
