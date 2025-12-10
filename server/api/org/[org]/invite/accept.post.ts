import db from "#server/lib/db"
import { createAuditLog, getUserFromSession } from "#server/lib/utils"
import { acceptInviteSchema } from "#shared/schemas/org-schema"
import z from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = acceptInviteSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
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
    throw createError({ statusCode: 404, statusMessage: "Invitation not found or already used" })
  }
  if (invitation.expiresAt < new Date()) {
    throw createError({ statusCode: 410, statusMessage: "Invitation has expired" })
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
    throw createError({ statusCode: 409, statusMessage: "You are already a member of this organization" })
  }

  const [membership] = await db.$transaction([
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
    userId: user.id,
    orgId: invitation.orgId,
    action: "organization.invite.accepted",
    resource: "organization_invite",
    metadata: {
      organizationName: membership.org.name,
      userName: membership.user.name,
      userEmail: membership.user.email,
    },
    description: `${membership.user.name} (${membership.user.email}) joined organization "${membership.org.name}" via invite link`,
    event,
  })

  return membership
})
