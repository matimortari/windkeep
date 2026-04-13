export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  // Rate limit: 200 requests per hour per user
  await enforceRateLimit(event, `org:switch:${user.id}`, 200)

  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "org", orgId }, ["OWNER", "MEMBER", "ADMIN"])

  // Set this org as active and deactivate others
  await db.$transaction([
    db.orgMembership.updateMany({ where: { userId: user.id, isActive: true }, data: { isActive: false } }),
    db.orgMembership.update({ where: { userId_orgId: { userId: user.id, orgId } }, data: { isActive: true } }),
  ])

  // Invalidate user data and projects cache
  await deleteCached(CacheKeys.userData(user.id), CacheKeys.userProjects(user.id))

  const membership = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: user.id, orgId } },
    select: { role: true, isActive: true, org: {
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        encryptionKeyVersion: true,
        encryptionKeyUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
        memberships: { select: { userId: true, role: true, isActive: true, user: { select: { id: true, name: true, email: true, image: true } } } },
      },
    } },
  })
  if (!membership) {
    throw createError({ status: 404, statusText: "Organization not found" })
  }

  const organization = { ...membership.org, role: membership.role, isActive: membership.isActive }

  return { organization }
})
