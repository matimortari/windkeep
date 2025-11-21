import { randomBytes } from "node:crypto"
import createAuditLog from "#server/lib/audit"
import db from "#server/lib/db"
import { getInviteBaseUrl, getUserFromSession, requireRole } from "#server/lib/utils"
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
    organizationId: org,
  })
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
  }

  // Generate invitation token
  const token = randomBytes(32).toString("hex")
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
    userId: user.id,
    organizationId: org,
    action: "organization.invite.created",
    resource: "organization_invite",
    metadata: {
      orgName: invitation.org.name,
      expiresAt: invitation.expiresAt.toISOString(),
      tokenPrefix: token.substring(0, 8),
    },
    description: `Created invite link for organization "${invitation.org.name}"`,
    event,
  })

  return { invitation, inviteUrl }
})
