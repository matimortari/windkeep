import db from "#server/lib/db"
import { getUserFromSession, requireRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  if (!org) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "organization", orgId: org }, ["OWNER", "MEMBER", "ADMIN"])

  const membership = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: user.id, orgId: org } },
    select: {
      role: true,
      isActive: true,
      org: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          memberships: true,
          projects: true,
        },
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 404, statusMessage: "Organization not found" })
  }

  return {
    ...membership.org,
    role: membership.role,
    isActive: membership.isActive,
  }
})
