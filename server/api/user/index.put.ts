import db from "#server/lib/db"
import { getUserFromSession } from "#server/lib/utils"
import { updateUserSchema } from "#shared/lib/schemas/user"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = updateUserSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: result.error.flatten().fieldErrors,
    })
  }

  const updatedUserData = await db.user.update({
    where: { id: user.id },
    data: {
      name: result.data.name,
      image: result.data.image,
      activeOrgId: result.data.activeOrgId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      activeOrgId: true,
      updatedAt: true,
    },
  })

  return updatedUserData
})
