import { acceptInviteSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  // Rate limit: 20 requests per hour per user
  await enforceRateLimit(event, `org:invite:accept:${user.id}`, 20)

  const body = await readBody(event)
  const result = acceptInviteSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  const invitation = await db.invitation.findUnique({ where: { token: result.data.token }, include: { org: { select: { id: true, name: true } } } })
  if (!invitation) {
    throw createError({ status: 404, statusText: "Invitation not found or already used" })
  }
  if (invitation.orgId !== orgId) {
    throw createError({ status: 403, statusText: "Invitation does not belong to this organization" })
  }
  if (invitation.expiresAt < new Date()) {
    throw createError({ status: 410, statusText: "Invitation has expired" })
  }

  const existingMembership = await db.orgMembership.findUnique({ where: { userId_orgId: { userId: user.id, orgId: invitation.orgId } } })
  if (existingMembership) {
    throw createError({ status: 409, statusText: "You are already a member of this organization" })
  }

  const [newMembership] = await db.$transaction(async (tx) => {
    await tx.orgMembership.updateMany({ where: { userId: user.id, isActive: true }, data: { isActive: false } })

    const membership = await tx.orgMembership.create({
      data: { userId: user.id, orgId: invitation.orgId, role: "MEMBER", isActive: true },
      include: { org: { select: { id: true, name: true, description: true, website: true } }, user: { select: { id: true, email: true, name: true, image: true } } },
    })

    await tx.invitation.delete({ where: { id: invitation.id } })

    return [membership]
  })

  await createAuditLog({
    event,
    userId: user.id,
    orgId: invitation.orgId,
    action: "ACCEPT.ORG_INVITE",
    resource: "organization_invite",
    description: `${newMembership.user.name} (${newMembership.user.email}) joined organization "${newMembership.org.name}" via invite link`,
    metadata: {
      userId: newMembership.user.id,
      userName: newMembership.user.name,
      userEmail: newMembership.user.email,
      orgId: invitation.org.id,
      orgName: invitation.org.name,
    },
  })

  await deleteCached(CacheKeys.userData(user.id))

  return { organization: newMembership.org, membership: newMembership }
})
