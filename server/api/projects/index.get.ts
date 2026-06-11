export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)

  // Rate limit: 200 requests per hour per user
  await enforceRateLimit(event, `projects:list:${sessionUser.id}`, 200)

  const activeMembership = await db.orgMembership.findFirst({ where: { userId: sessionUser.id, isActive: true }, select: { orgId: true } })
  if (!activeMembership) {
    return { projects: [] }
  }

  const cacheKey = CacheKeys.userProjects(sessionUser.id, activeMembership.orgId)
  const cached = await getCached<Project[]>(cacheKey)
  if (cached) {
    return { projects: cached }
  }

  const projects = await db.project.findMany({
    where: {
      memberships: { some: { userId: sessionUser.id } },
      org: { memberships: { some: { userId: sessionUser.id, isActive: true } } },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      website: true,
      orgId: true,
      createdAt: true,
      updatedAt: true,
      org: { select: { id: true, name: true } },
      _count: { select: { secrets: true } },
      memberships: { select: { userId: true, role: true, user: { select: { id: true, name: true, image: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  await setCached(cacheKey, projects, CACHE_TTL.SHORT)

  return { projects }
})
