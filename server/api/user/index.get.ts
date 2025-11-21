import db from "#server/lib/db"
import { getUserFromSession } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  const userData = await db.user.findUnique({
    where: { id: user.id },
    include: {
      orgMemberships: {
        select: {
          role: true,
          orgId: true,
          org: {
            include: {
              memberships: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      projectMemberships: {
        select: {
          project: true,
        },
      },
    },
  })
  if (!userData) {
    throw createError({ statusCode: 404, statusMessage: "User not found" })
  }

  return userData
})
