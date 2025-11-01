import { randomBytes } from "node:crypto"
import db from "#server/lib/db"
import { getInviteBaseUrl, getUserFromSession, requireOrgRole } from "#server/lib/utils"
import { createInvitationSchema } from "#shared/lib/schemas/org"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  if (!org) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireOrgRole(user.id, org, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = createInvitationSchema.safeParse({
    ...body,
    organizationId: org,
  })

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: result.error.flatten().fieldErrors,
    })
  }

  const existingMember = await db.organizationMembership.findUnique({
    where: {
      userId_organizationId: {
        userId: result.data.email,
        organizationId: org,
      },
    },
  })

  if (existingMember) {
    throw createError({ statusCode: 409, statusMessage: "User is already a member of this organization" })
  }

  // Check if there's already a pending invitation
  const existingInvitation = await db.invitation.findFirst({
    where: {
      email: result.data.email,
      organizationId: org,
      expiresAt: {
        gt: new Date(),
      },
    },
  })
  if (existingInvitation) {
    throw createError({ statusCode: 409, statusMessage: "An invitation for this email already exists" })
  }

  // Generate invitation token
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 12) // 12 hours expiration

  const invitation = await db.invitation.create({
    data: {
      email: result.data.email,
      organizationId: org,
      role: result.data.role || "MEMBER",
      token,
      expiresAt,
      invitedById: user.id,
    },
    include: {
      organization: {
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

  return { invitation, inviteUrl }
})
