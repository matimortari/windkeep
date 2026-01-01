import { randomBytes } from "node:crypto"
import db from "#server/lib/db"
import { getUserFromSession } from "#server/lib/utils"
import { updateUserSchema } from "#shared/schemas/user-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = updateUserSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message || "Invalid input" })
  }

  // Only regenerate when the boolean is explicitly sent and true
  let apiTokenToUpdate: string | undefined
  if (result.data.regenerateApiToken) {
    apiTokenToUpdate = randomBytes(12).toString("hex")
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
