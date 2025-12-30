import { randomBytes } from "node:crypto"
import db from "#server/lib/db"
import { createAuditLog, getInviteBaseUrl, getUserFromSession, requireRole } from "#server/lib/utils"
import { createInviteSchema } from "#shared/schemas/org-schema"
import z from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  if (!org) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "organization", orgId: org }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = createInviteSchema.safeParse({
    ...body,
    orgId: org,
  })
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
  }

  // Generate invitation token
  const token = randomBytes(12).toString("hex")
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 12) // 12 hours expiration

  const invitation = await db.invitation.create({
    data: {
      orgId: org,
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
    orgId: org,
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
