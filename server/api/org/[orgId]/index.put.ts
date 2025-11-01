import db from "#server/lib/db"
import { getUserFromSession, requireOrgRole } from "#server/lib/utils"
import { updateOrganizationSchema } from "#shared/lib/schemas/org"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "orgId")
  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireOrgRole(user.id, orgId, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateOrganizationSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: result.error.flatten().fieldErrors,
    })
  }

  const updatedOrganization = await db.organization.update({
    where: { id: orgId },
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

  return updatedOrganization
})
