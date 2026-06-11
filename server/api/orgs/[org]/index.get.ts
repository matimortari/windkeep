export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  // Rate limit: 200 requests per hour per user
  await enforceRateLimit(event, `org:switch:${sessionUser.id}`, 200)
  await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER", "ADMIN", "MEMBER"])

  // Set this org as active and deactivate others
  await db.$transaction([
    db.orgMembership.updateMany({ where: { userId: sessionUser.id, isActive: true }, data: { isActive: false } }),
    db.orgMembership.update({ where: { userId_orgId: { userId: sessionUser.id, orgId } }, data: { isActive: true } }),
  ])

  const membership = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: sessionUser.id, orgId } },
    select: {
      role: true,
      isActive: true,
      org: {
        select: {
          id: true,
          name: true,
          description: true,
          website: true,
          encryptionKeyVersion: true,
          encryptionKeyUpdatedAt: true,
          createdAt: true,
          updatedAt: true,
          memberships: {
            select: {
              userId: true,
              role: true,
              isActive: true,
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
      },
    },
  })
  if (!membership) {
    throw createError({ status: 404, statusText: "Organization not found" })
  }

  await deleteCached(CacheKeys.userData(sessionUser.id), CacheKeys.userProjects(sessionUser.id, orgId))

  return { organization: { ...membership.org, role: membership.role, isActive: membership.isActive } }
})
