import db from "#server/utils/db"
import { generateToken, getUserFromSession } from "#server/utils/helpers"
import { updateUserSchema } from "#shared/schemas/user-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = updateUserSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  // Only regenerate when the boolean is explicitly sent and true
  let apiTokenToUpdate: string | undefined
  if (result.data.regenerateApiToken) {
    apiTokenToUpdate = generateToken()
  }

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      name: result.data.name,
      image: result.data.image,
      apiToken: apiTokenToUpdate,
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      apiToken: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return { updatedUser }
})
