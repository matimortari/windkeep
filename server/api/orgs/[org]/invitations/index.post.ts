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

  // Ensure the target email is not already a member of the organization
  const userExists = await db.user.findUnique({ where: { email: result.data.email } })
  if (userExists) {
    const activeMember = await db.orgMembership.findUnique({ where: { userId_orgId: { userId: userExists.id, orgId } } })
    if (activeMember) {
      throw createError({ status: 409, statusText: "User is already a member of this organization" })
    }
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
  const invitation = await db.invitation.upsert({
    where: { email_orgId: { email: result.data.email, orgId } },
    update: {
      token,
      role: result.data.role,
      expiresAt,
      invitedById: sessionUser.id,
      acceptedAt: null, // Reset acceptance if re-invited
    },
    create: {
      email: result.data.email,
      orgId,
      role: result.data.role,
      token,
      expiresAt,
      invitedById: sessionUser.id,
    },
    include: {
      org: { select: { id: true, name: true } },
      invitedBy: { select: { id: true, email: true, name: true } },
    },
  })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId,
    action: "CREATE.ORG_INVITE",
    resource: "org_invite",
    description: `Created invite link for ${result.data.email} to join organization "${invitation.org.name}" as ${result.data.role}`,
    metadata: {
      inviteId: invitation.id,
      inviteeEmail: result.data.email,
      inviteeRole: result.data.role,
      orgId: invitation.org.id,
      orgName: invitation.org.name,
      expiresAt: invitation.expiresAt.toISOString(),
    },
  })

  return { invitation, inviteUrl: `${getInviteBaseUrl(event)}/onboarding?token=${token}&org=${orgId}` }
})

defineRouteMeta({
  openAPI: {
    summary: "Create organization invitation",
    description: "Sends an invitation to an email address. Re-inviting an existing pending invite resets its token and expiry. Expires in 12 hours. Requires organization OWNER or ADMIN role.",
    tags: ["Invitations"],
    parameters: [
      { in: "path", name: "org", required: true, schema: { type: "string" }, description: "Organization ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "role"],
            properties: {
              email: { type: "string", format: "email", description: "Invitee email address" },
              role: { type: "string", enum: ["ADMIN", "MEMBER"], description: "Invitee role" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Invitation created, returns invitation and invite URL" },
      400: { description: "Validation error" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role" },
      409: { description: "Invitee is already a member of the organization" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
