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

defineRouteMeta({
  openAPI: {
    summary: "Get API token status",
    description: "Returns whether the user has an active API token and its expiry date.",
    tags: ["User"],
    responses: {
      200: { description: "Token status, returns `hasToken` and `expiresAt`" },
      401: { description: "Unauthenticated" },
      404: { description: "User not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
