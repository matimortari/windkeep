import { updateUserSchema } from "#shared/schemas/user-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `user:update:${sessionUser.id}`, 30)

  const body = await readBody(event)
  const result = updateUserSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? "Invalid input" })
  }

  const updatedUser = await db.user.update({
    where: { id: sessionUser.id },
    data: { name: result.data.name },
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

  return { updatedUser }
})

defineRouteMeta({
  openAPI: {
    summary: "Update user details",
    description: "Updates the user's details.",
    tags: ["User"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string", description: "User name" },
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
