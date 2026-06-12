export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `user:token:delete:${sessionUser.id}`, 30)

  await db.user.update({ where: { id: sessionUser.id }, data: { apiToken: null, apiTokenExpiresAt: null } })

  await deleteCached(CacheKeys.userData(sessionUser.id))

  return { success: true, message: "Personal API token revoked successfully" }
})
