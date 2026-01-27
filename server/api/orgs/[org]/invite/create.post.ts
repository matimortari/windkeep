import { randomBytes } from "node:crypto"
import db from "#server/utils/db"
import { createAuditLog, getInviteBaseUrl, getUserFromSession, requireRole } from "#server/utils/helpers"
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

  // Generate invitation token
  const token = randomBytes(12).toString("hex")
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 12) // 12 hours expiration

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
      orgId: invitation.org.id,
      orgName: invitation.org.name,
      invitedById: invitation.invitedBy.id,
      expiresAt: invitation.expiresAt.toISOString(),
      tokenPrefix: token.substring(0, 8),
    },
  })

  return { invitation, inviteUrl }
})
