import db from "#server/utils/db"
import { getUserFromSession } from "#server/utils/helpers"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  const projects = await db.project.findMany({
    where: {
      AND: [
        { org: { memberships: { some: { userId: user.id } } } },
        { memberships: { some: { userId: user.id } } },
      ],
    },
    include: {
      org: true,
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
      secrets: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return { projects }
})
