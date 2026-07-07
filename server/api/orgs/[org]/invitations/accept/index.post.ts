import { acceptInviteSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  // Rate limit: 20 requests per hour per user
  await enforceRateLimit(event, `org:invite:accept:${sessionUser.id}`, 20)

  const body = await readBody(event)
  const result = acceptInviteSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message || "Invalid input" })
  }

  const invitation = await db.invitation.findFirst({ where: { token: result.data.token, orgId }, include: { org: { select: { id: true, name: true } } } })
  if (!invitation || invitation.acceptedAt) {
    throw createError({ statusCode: 404, statusMessage: "Invitation not found, expired, or already used" })
  }
  if (invitation.expiresAt < new Date()) {
    throw createError({ statusCode: 410, statusMessage: "Invitation has expired" })
  }
  if (invitation.email.toLowerCase() !== sessionUser.email.toLowerCase()) {
    throw createError({ statusCode: 403, statusMessage: "This invitation was sent to a different email address" })
  }

  const existingMembership = await db.orgMembership.findUnique({ where: { userId_orgId: { userId: sessionUser.id, orgId: invitation.orgId } } })
  if (existingMembership) {
    throw createError({ statusCode: 409, statusMessage: "You are already a member of this organization" })
  }

  // Set the new membership as active and deactivate any existing active memberships
  const [newMembership] = await db.$transaction(async (tx) => {
    await tx.orgMembership.updateMany({ where: { userId: sessionUser.id, isActive: true }, data: { isActive: false } })
    const membership = await tx.orgMembership.create({
      data: { userId: sessionUser.id, orgId: invitation.orgId, role: invitation.role, isActive: true },
      include: {
        org: { select: { id: true, name: true, description: true, website: true, encryptionKeyVersion: true, encryptionKeyUpdatedAt: true, createdAt: true, updatedAt: true } },
        user: { select: { id: true, email: true, name: true, image: true } },
      },
    })

    // Flag the invitation as accepted
    await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } })
    return [membership]
  })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: invitation.orgId,
    action: "ACCEPT.ORG_INVITE",
    resource: "org_invite",
    description: `${newMembership.user.name} (${newMembership.user.email}) joined organization "${newMembership.org.name}" as ${invitation.role} via invite link`,
    metadata: {
      inviteId: invitation.id,
      memberRole: invitation.role,
      memberName: newMembership.user.name,
      memberEmail: newMembership.user.email,
    },
  })

  await deleteCached(CacheKeys.userData(sessionUser.id))

  return { organization: newMembership.org, membership: newMembership }
})

defineRouteMeta({
  openAPI: {
    summary: "Accept organization invitation",
    description: "Accepts an invitation by token. The authenticated user's email must match the invitation. Sets the new organization membership as active.",
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
            required: ["token"],
            properties: {
              token: { type: "string", description: "Invitation token" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Joined organization, returns organization and membership" },
      400: { description: "Validation error" },
      401: { description: "Unauthenticated" },
      403: { description: "Email mismatch or wrong organization" },
      404: { description: "Invitation not found in this organization or already used" },
      409: { description: "Already a member of the organization" },
      410: { description: "Invitation expired" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
