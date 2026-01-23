import db from "#server/lib/db"
import { getUserFromSession, requireRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "organization", orgId }, ["OWNER", "MEMBER", "ADMIN"])

  // Set this org as active and deactivate others
  await db.$transaction([
    db.orgMembership.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    }),
    db.orgMembership.update({
      where: { userId_orgId: { userId: user.id, orgId } },
      data: { isActive: true },
    }),
  ])

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
    throw createError({ status: 404, statusText: "Organization not found" })
  }

  const organization = { ...membership.org, role: membership.role, isActive: membership.isActive }

  return { organization }
})
