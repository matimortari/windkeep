import db from "#server/lib/db"
import { createAuditLog, getUserFromSession } from "#server/lib/utils"
import { createOrgSchema } from "#shared/schemas/org-schema"
import { z } from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = createOrgSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
  }

  const organization = await db.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: result.data.name,
        memberships: {
          create: {
            userId: user.id,
            role: "OWNER",
            isActive: true,
          },
        },
      },
    })

    // Deactivate all other orgs for the user
    await tx.orgMembership.updateMany({
      where: {
        userId: user.id,
        orgId: { not: org.id },
        isActive: true,
      },
      data: { isActive: false },
    })

    return tx.organization.findUniqueOrThrow({
      where: { id: org.id },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    })
  })

  await createAuditLog({
    userId: user.id,
    orgId: organization.id,
    action: "organization.created",
    resource: "organization",
    metadata: { organizationName: organization.name },
    description: `Created organization "${organization.name}"`,
    event,
  })

  return organization
})
