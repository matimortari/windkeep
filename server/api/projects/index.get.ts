export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  const cacheKey = CacheKeys.userProjects(user.id)
  const cached = await getCached<any>(cacheKey)
  if (cached) {
    return { projects: cached }
  }

  const projects = await db.project.findMany({
    where: { AND: [{ org: { memberships: { some: { userId: user.id } } } }, { memberships: { some: { userId: user.id } } }] },
    include: {
      org: true,
      secrets: true,
      memberships: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  await setCached(cacheKey, projects, CACHE_TTL.SHORT)

  return { projects }
})
