import { createInviteSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  // Rate limit: 20 requests per hour per user
  await enforceRateLimit(event, `org:invite:create:${sessionUser.id}`, 20, 60 * 60 * 1000)
  await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = createInviteSchema.safeParse({ ...body, orgId })
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  // Generate unique invitation token with retry on collision
  let token = generateToken()
  for (let attempts = 0; attempts < 5; attempts++) {
    const existingInvite = await db.invitation.findUnique({ where: { token } })
    if (!existingInvite) {
      break
    }

    token = generateToken()
  }

  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
  const invitation = await db.invitation.create({
    data: { orgId, token, expiresAt, invitedById: sessionUser.id },
    include: { org: { select: { id: true, name: true } }, invitedBy: { select: { id: true, email: true, name: true } } },
  })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId,
    action: "CREATE.ORG_INVITE",
    resource: "organization_invite",
    description: `Created invite link for organization "${invitation.org.name}"`,
    metadata: {
      inviteId: invitation.id,
      orgId: invitation.org.id,
      orgName: invitation.org.name,
      expiresAt: invitation.expiresAt.toISOString(),
    },
  })

  return { invitation, inviteUrl: `${getInviteBaseUrl(event)}/onboarding?token=${token}&org=${orgId}` }
})
