import db from "#server/lib/db"
import { getUserFromSession } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  const projects = await db.project.findMany({
    where: {
      OR: [
        { organization: { memberships: { some: { userId: user.id } } } },
        { roles: { some: { userId: user.id } } },
      ],
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      roles: {
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
      secrets: {
        include: {
          values: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
  if (!projects) {
    throw createError({ statusCode: 404, statusMessage: "No projects found" })
  }

  return projects
})
