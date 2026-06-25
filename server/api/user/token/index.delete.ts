export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `user:token:delete:${sessionUser.id}`, 30)

  await db.user.update({ where: { id: sessionUser.id }, data: { apiToken: null, apiTokenExpiresAt: null } })

  await deleteCached(CacheKeys.userData(sessionUser.id))

  return { success: true, message: "Personal API token revoked successfully" }
})

defineRouteMeta({
  openAPI: {
    summary: "Revoke user API token",
    description: "Permanently revokes the user's personal API token.",
    tags: ["User"],
    responses: {
      200: { description: "Personal API token revoked" },
      401: { description: "Unauthenticated" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
