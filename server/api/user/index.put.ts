import { updateUserSchema } from "#shared/schemas/user-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `user:update:${sessionUser.id}`, 30, 60 * 60 * 1000)

  const body = await readBody(event)
  const result = updateUserSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  // Only regenerate when the boolean is explicitly sent and true
  let apiTokenToUpdate: string | undefined
  let apiTokenExpiresAt: Date | undefined
  if (result.data.regenerateApiToken) {
    apiTokenToUpdate = generateToken(32)
    apiTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }

  const updatedUser = await db.user.update({
    where: { id: sessionUser.id },
    data: {
      name: result.data.name,
      ...(apiTokenToUpdate && { apiToken: hashApiToken(apiTokenToUpdate), apiTokenExpiresAt }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  await deleteCached(CacheKeys.userData(sessionUser.id))

  return { updatedUser, ...(apiTokenToUpdate && { newApiToken: apiTokenToUpdate }) }
})
