import { randomBytes } from "node:crypto"
import db from "#server/lib/db"
import { getUserFromSession } from "#server/lib/utils"
import { updateUserSchema } from "#shared/schemas/user-schema"
import z from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = updateUserSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
  }

  let apiTokenToUpdate = result.data.apiToken
  if (result.data.regenerateApiToken) {
    apiTokenToUpdate = randomBytes(16).toString("hex")
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
      apiToken: apiTokenToUpdate !== undefined,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (apiTokenToUpdate !== undefined && !result.data.name && !result.data.image) {
    return { message: "API token updated successfully", apiToken: updatedUser.apiToken }
  }

  return updatedUser
})
