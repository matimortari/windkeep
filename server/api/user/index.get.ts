import db from "#server/utils/db"
import { getUserFromSession } from "#server/utils/helpers"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  const userData = await db.user.findUnique({
    where: { id: user.id },
    include: {
      orgMemberships: {
        include: { org: true },
      },
      projectMemberships: {
        select: {
          role: true,
          projectId: true,
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
              orgId: true,
            },
          },
        },
      },

    },
  })
  if (!userData) {
    throw createError({ status: 404, statusText: "User not found" })
  }

  return { userData }
})
