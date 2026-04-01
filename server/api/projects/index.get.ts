export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  // Rate limit: 200 requests per hour per user
  await enforceRateLimit(event, `projects:list:${user.id}`, 200)

  const cacheKey = CacheKeys.userProjects(user.id)
  const cached = await getCached<any>(cacheKey)
  if (cached) {
    return { projects: cached }
  }

  const activeMembership = await db.orgMembership.findFirst({ where: { userId: user.id, isActive: true } })
  if (!activeMembership) {
    return { projects: [] }
  }

  const projects = await db.project.findMany({
    where: { orgId: activeMembership.orgId, memberships: { some: { userId: user.id } } },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      website: true,
      orgId: true,
      createdAt: true,
      updatedAt: true,
      secrets: { select: { id: true } },
      memberships: { select: { userId: true, projectId: true, role: true, user: { select: { id: true, name: true, image: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  await setCached(cacheKey, projects, CACHE_TTL.SHORT)

  return { projects }
})
