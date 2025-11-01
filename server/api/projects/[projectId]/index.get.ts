import db from "#server/lib/db"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "projectId")
  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  await requireProjectRole(user.id, projectId, ["OWNER", "ADMIN", "MEMBER"])

  const project = await db.project.findUnique({
    where: { id: projectId },
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
              email: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      secrets: {
        include: {
          values: {
            select: {
              id: true,
              environment: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          key: "asc",
        },
      },
      _count: {
        select: {
          secrets: true,
          roles: true,
        },
      },
    },
  })
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
  }

  return project
})
