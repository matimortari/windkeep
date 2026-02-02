import db from "#server/utils/db"
import { getUserFromSession } from "#server/utils/helpers"
import { CACHE_TTL, CacheKeys, getCached, setCached } from "#server/utils/redis"

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
