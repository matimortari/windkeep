export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)

  // Rate limit: 200 requests per hour per user
  await enforceRateLimit(event, `projects:list:${sessionUser.id}`, 200)

  const activeMembership = await db.orgMembership.findFirst({ where: { userId: sessionUser.id, isActive: true }, select: { orgId: true } })
  if (!activeMembership) {
    return { projects: [] }
  }

  const cacheKey = CacheKeys.userProjects(sessionUser.id)
  const cached = await getCached<Project[]>(cacheKey)
  if (cached) {
    return { projects: cached }
  }

  const projects = await db.project.findMany({
    where: {
      org: { memberships: { some: { userId: sessionUser.id } } },
      OR: [{ orgId: activeMembership.orgId }, { memberships: { some: { userId: sessionUser.id } } }],
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

defineRouteMeta({
  openAPI: {
    summary: "Get projects",
    description: "Returns all projects in the active organization plus all projects the user is a member of in other organizations.",
    tags: ["Projects"],
    responses: {
      200: { description: "List of projects with members and secret counts" },
      401: { description: "Unauthenticated" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
