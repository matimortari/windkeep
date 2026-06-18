import { randomBytes } from "node:crypto"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)

  // Rate limit: 5 requests per hour per user
  await enforceRateLimit(event, `user:token:create:${sessionUser.id}`, 5)

  const rawToken = `${randomBytes(24).toString("hex")}`
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 90) // 90 days

  await db.user.update({ where: { id: sessionUser.id }, data: { apiToken: hashToken(rawToken), apiTokenExpiresAt: expiresAt } })

  await deleteCached(CacheKeys.userData(sessionUser.id))

  return { rawToken, expiresAt, message: "Make sure to copy your personal API token now. You will not be able to see it again." }
})
