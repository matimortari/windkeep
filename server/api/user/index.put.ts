import { updateUserSchema } from "#shared/schemas/user-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `user:update:${sessionUser.id}`, 30)

  const body = await readBody(event)
  const result = updateUserSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message || "Invalid input" })
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
      ...(apiTokenToUpdate && { apiToken: hashToken(apiTokenToUpdate), apiTokenExpiresAt }),
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

defineRouteMeta({
  openAPI: {
    summary: "Update user details",
    description: "Updates the user's details and/or regenerates their API token.",
    tags: ["User"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string", description: "User name" },
              regenerateApiToken: { type: "boolean", description: "Regenerate API token, returns the new plaintext token only once when regenerated" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Updated user details" },
      400: { description: "Validation error" },
      401: { description: "Unauthenticated" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
