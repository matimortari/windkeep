import db from "#server/lib/db"
import { getUserFromSession, requireRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "organization", orgId }, ["OWNER", "MEMBER", "ADMIN"])

  const membership = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: user.id, orgId } },
    select: {
      role: true,
      isActive: true,
      org: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          memberships: {
            select: {
              userId: true,
              role: true,
              isActive: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          projects: true,
        },
      },
    },
  })
  if (!membership) {
    throw createError({ statusCode: 404, statusMessage: "Organization not found" })
  }

  const organization = { ...membership.org, role: membership.role, isActive: membership.isActive }

  return { organization }
})
