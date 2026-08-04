export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)

  // Rate limit: 200 requests per hour per user
  await enforceRateLimit(event, `projects:list:${sessionUser.id}`, 200)

  const activeMembership = await db.orgMembership.findFirst({ where: { userId: sessionUser.id, isActive: true }, select: { orgId: true, role: true } })
  if (!activeMembership) {
    return { projects: [] }
  }

  const cacheKey = CacheKeys.userProjects(sessionUser.id, activeMembership.orgId)
  const cached = await getCached<Project[]>(cacheKey)
  if (cached) {
    return { projects: cached }
  }

  const projects = await db.project.findMany({
    where: activeMembership.role === "OWNER" ? { orgId: activeMembership.orgId } : { orgId: activeMembership.orgId, memberships: { some: { userId: sessionUser.id } } },
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
      _count: { select: { secrets: true, serviceTokens: true, memberships: true } },
      memberships: {
        select: {
          userId: true,
          role: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  await setCached(cacheKey, projects, 60)

  return { projects }
})

defineRouteMeta({
  openAPI: {
    summary: "Get projects",
    description: "Returns projects within the user's currently active organization.",
    tags: ["Projects"],
    responses: {
      200: { description: "List of projects with members, access token and secret counts" },
      401: { description: "Unauthenticated" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
