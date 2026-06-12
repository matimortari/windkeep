export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)

  // Rate limit: 100 requests per hour per user
  await enforceRateLimit(event, `user:token:get:${sessionUser.id}`, 100)

  const user = await db.user.findUnique({ where: { id: sessionUser.id }, select: { apiToken: true, apiTokenExpiresAt: true } })
  if (!user) {
    throw createError({ status: 404, statusText: "User not found" })
  }

  return { hasToken: !!user.apiToken, expiresAt: user.apiTokenExpiresAt }
})
