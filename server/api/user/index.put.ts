import db from "#server/lib/db"
import { getUserFromSession } from "#server/lib/utils"
import { updateUserSchema } from "#shared/lib/schemas/user-schema"
import z from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = updateUserSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
  }

  // If activeOrgId is being updated, verify user is a member of that organization
  if (result.data.activeOrgId !== undefined && result.data.activeOrgId !== null) {
    const membership = await db.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: result.data.activeOrgId,
        },
      },
    })
    if (!membership) {
      throw createError({ statusCode: 403, statusMessage: "You are not a member of the selected organization" })
    }
  }

  const updatedUserData = await db.user.update({
    where: { id: user.id },
    data: {
      name: result.data.name,
      image: result.data.image,
      activeOrgId: result.data.activeOrgId,
      apiToken: result.data.apiToken,
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      activeOrgId: true,
      apiToken: result.data.apiToken !== undefined, // Do not return apiToken unless it was updated
      createdAt: true,
      updatedAt: true,
    },
  })

  if (result.data.apiToken !== undefined
    && result.data.name === undefined
    && result.data.image === undefined
    && result.data.activeOrgId === undefined) {
    return { message: "API token updated successfully", apiToken: updatedUserData.apiToken }
  }

  return updatedUserData
})
