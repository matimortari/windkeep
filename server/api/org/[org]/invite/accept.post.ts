import createAuditLog from "#server/lib/audit"
import db from "#server/lib/db"
import { getUserFromSession } from "#server/lib/utils"
import { acceptInviteSchema } from "#shared/lib/schemas/org-schema"
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
      organization: {
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

  const existingMembership = await db.organizationMembership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: invitation.organizationId,
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
    db.organizationMembership.create({
      data: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: "MEMBER",
      },
      include: {
        organization: {
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
    organizationId: invitation.organizationId,
    action: "organization.invite.accepted",
    resource: "organization_invite",
    metadata: {
      organizationName: membership.organization.name,
      userName: membership.user.name,
      userEmail: membership.user.email,
    },
    description: `${membership.user.name} (${membership.user.email}) joined organization "${membership.organization.name}" via invite link`,
    event,
  })

  return membership
})
