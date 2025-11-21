import createAuditLog from "#server/lib/audit"
import db from "#server/lib/db"
import { getUserFromSession, requireRole } from "#server/lib/utils"
import { updateOrganizationSchema } from "#shared/schemas/org-schema"
import z from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  if (!org) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "organization", orgId: org }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateOrganizationSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: z.treeifyError(result.error),
    })
  }

  const existingOrg = await db.organization.findUnique({
    where: { id: org },
    select: { name: true },
  })

  const updatedOrg = await db.organization.update({
    where: { id: org },
    data: {
      name: result.data.name,
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
    organizationId: org,
    action: "organization.updated",
    resource: "organization",
    metadata: {
      oldName: existingOrg?.name,
      newName: updatedOrg.name,
    },
    description: `Updated organization name from "${existingOrg?.name}" to "${updatedOrg.name}"`,
    event,
  })

  return updatedOrg
})
