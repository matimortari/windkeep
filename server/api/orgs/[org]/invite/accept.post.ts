import db from "#server/utils/db"
import { createAuditLog, getUserFromSession } from "#server/utils/helpers"
import { acceptInviteSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = acceptInviteSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const invitation = await db.invitation.findUnique({
    where: { token: result.data.token },
    include: {
      org: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
  if (!invitation) {
    throw createError({ status: 404, statusText: "Invitation not found or already used" })
  }
  if (invitation.expiresAt < new Date()) {
    throw createError({ status: 410, statusText: "Invitation has expired" })
  }

  const existingMembership = await db.orgMembership.findUnique({
    where: {
      userId_orgId: {
        userId: user.id,
        orgId: invitation.orgId,
      },
    },
  })
  if (existingMembership) {
    await db.invitation.delete({
      where: { id: invitation.id },
    })
    throw createError({ status: 409, statusText: "You are already a member of this organization" })
  }

  const [newMembership] = await db.$transaction([
    db.orgMembership.create({
      data: {
        userId: user.id,
        orgId: invitation.orgId,
        role: "MEMBER",
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    }),
    db.invitation.delete({
      where: { id: invitation.id },
    }),
  ])

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

  return { organization: newMembership.org, membership: newMembership }
})
