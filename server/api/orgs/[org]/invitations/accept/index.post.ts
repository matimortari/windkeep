import { acceptInviteSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  // Rate limit: 20 requests per hour per user
  await enforceRateLimit(event, `org:invite:accept:${sessionUser.id}`, 20)

  const body = await readBody(event)
  const result = acceptInviteSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const invitation = await db.invitation.findUnique({ where: { token: result.data.token }, include: { org: { select: { id: true, name: true } } } })
  if (!invitation || invitation.acceptedAt) {
    throw createError({ status: 404, statusText: "Invitation not found, expired, or already used" })
  }
  if (invitation.orgId !== orgId) {
    throw createError({ status: 403, statusText: "Invitation does not belong to this organization" })
  }
  if (invitation.expiresAt < new Date()) {
    throw createError({ status: 410, statusText: "Invitation has expired" })
  }
  if (invitation.email.toLowerCase() !== sessionUser.email.toLowerCase()) {
    throw createError({ status: 403, statusText: "This invitation was sent to a different email address" })
  }

  const existingMembership = await db.orgMembership.findUnique({ where: { userId_orgId: { userId: sessionUser.id, orgId: invitation.orgId } } })
  if (existingMembership) {
    throw createError({ status: 409, statusText: "You are already a member of this organization" })
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
    description: `${newMembership.user.name} (${newMembership.user.email}) joined organization "${newMembership.org.name}" via invite link`,
    metadata: {
      userId: newMembership.user.id,
      userName: newMembership.user.name,
      userEmail: newMembership.user.email,
      orgId: invitation.org.id,
      orgName: invitation.org.name,
    },
  })

  await deleteCached(CacheKeys.userData(sessionUser.id))

  return { organization: newMembership.org, membership: newMembership }
})

defineRouteMeta({
  openAPI: {
    summary: "Accept invitation",
    description: "Accepts an invitation by token. The authenticated user's email must match the invitation. Sets the new org as active.",
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
              token: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Joined organization, returns org and membership" },
      400: { description: "Validation error" },
      401: { description: "Unauthenticated" },
      403: { description: "Email mismatch or wrong organization" },
      404: { description: "Invitation not found or already used" },
      409: { description: "Already a member" },
      410: { description: "Invitation expired" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
