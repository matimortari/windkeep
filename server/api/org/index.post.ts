import createAuditLog from "#server/lib/audit"
import db from "#server/lib/db"
import { getUserFromSession } from "#server/lib/utils"
import { createOrganizationSchema } from "#shared/schemas/org-schema"
import { z } from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = createOrganizationSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
  }

  const organization = await db.organization.create({
    data: {
      name: result.data.name,
      memberships: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
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

  await createAuditLog({
    userId: user.id,
    orgId: organization.id,
    action: "organization.created",
    resource: "organization",
    metadata: {
      organizationName: organization.name,
    },
    description: `Created organization "${organization.name}"`,
    event,
  })

  return organization
})
