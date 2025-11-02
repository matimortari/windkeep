import db from "#server/lib/db"
import { getUserFromSession } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  const userData = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      apiToken: true,
      activeOrgId: true,
      createdAt: true,
      updatedAt: true,
      memberships: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              createdAt: true,
              updatedAt: true,
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
      projectRoles: {
        include: {
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              organizationId: true,
            },
          },
        },
      },
    },
  })
  if (!userData) {
    throw createError({ statusCode: 404, statusMessage: "User not found" })
  }

  return userData
})
