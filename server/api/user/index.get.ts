export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)

  // Rate limit: 200 requests per hour per user
  await enforceRateLimit(event, `user:get:${sessionUser.id}`, 200)

  const cacheKey = CacheKeys.userData(sessionUser.id)
  const cached = await getCached<User>(cacheKey)
  if (cached) {
    return { user: cached }
  }

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      orgMemberships: {
        select: { role: true, isActive: true, org: { select: { id: true, name: true } } },
      },
      projectMemberships: {
        select: {
          role: true,
          projectId: true,
          project: { select: { id: true, name: true, slug: true, orgId: true } },
        },
      },
    },
  })
  if (!user) {
    throw createError({ status: 404, statusText: "User not found" })
  }

  await setCached(cacheKey, user, CACHE_TTL.SHORT)

  return { user }
})
