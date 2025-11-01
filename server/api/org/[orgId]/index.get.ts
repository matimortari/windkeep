import db from "#server/lib/db"
import { getUserFromSession, requireOrgRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "orgId")
  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireOrgRole(user.id, orgId, ["OWNER", "ADMIN", "MEMBER"])

  const organization = await db.organization.findUnique({
    where: { id: orgId },
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
        orderBy: {
          createdAt: "asc",
        },
      },
      projects: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              secrets: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      },
      _count: {
        select: {
          memberships: true,
          projects: true,
          invitations: true,
        },
      },
    },
  })
  if (!organization) {
    throw createError({ statusCode: 404, statusMessage: "Organization not found" })
  }

  return organization
})
