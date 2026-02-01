import db from "#server/utils/db"
import { createAuditLog, generateToken, getInviteBaseUrl, getUserFromSession, requireRole } from "#server/utils/helpers"
import { createInviteSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "organization", orgId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = createInviteSchema.safeParse({ ...body, orgId })
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  // Generate unique invitation token with retry on collision
  let token = ""
  let attempts = 0
  while (attempts < 5) {
    token = generateToken()
    const existing = await db.invitation.findUnique({ where: { token } })
    if (!existing) {
      break
    }
    attempts++
  }
  if (attempts === 5) {
    throw createError({ status: 500, statusText: "Failed to generate unique invitation token" })
  }

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 12) // 12 hours

  const invitation = await db.invitation.create({
    data: {
      orgId,
      token,
      expiresAt,
      invitedById: user.id,
    },
    include: {
      org: {
        select: {
          id: true,
          name: true,
        },
      },
      invitedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })

  const inviteUrl = `${getInviteBaseUrl(event)}/onboarding/join-org?token=${token}`

  await createAuditLog({
    event,
    userId: user.id,
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

  return { invitation, inviteUrl }
})
