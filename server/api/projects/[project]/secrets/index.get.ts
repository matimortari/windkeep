import db from "#server/utils/db"
import { decrypt } from "#server/utils/encryption"
import { getUserFromSession, requireRole } from "#server/utils/helpers"
import { CacheKeys, CacheTTL, getCached, setCached } from "#server/utils/redis"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ status: 400, statusText: "Project ID is required" })
  }

  await requireRole(user.id, { type: "project", projectId }, ["OWNER", "ADMIN", "MEMBER"])

  // Try to get from cache first
  const cacheKey = CacheKeys.projectSecrets(projectId)
  const cached = await getCached<any>(cacheKey)
  if (cached) {
    return { decryptedSecrets: cached }
  }

  const secrets = await db.secret.findMany({
    where: { projectId },
    include: {
      values: {
        orderBy: {
          environment: "asc",
        },
      },
      project: true,
    },
    orderBy: {
      key: "asc",
    },
  })

  const decryptedSecrets = secrets.map(secret => ({
    ...secret,
    values: secret.values.map(val => ({
      ...val,
      value: decrypt(val.value),
    })),
  }))

  await setCached(cacheKey, decryptedSecrets, CacheTTL.SHORT)

  return { decryptedSecrets }
})
