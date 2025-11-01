import db from "#server/lib/db"
import { getUserFromSession, requireOrgRole } from "#server/lib/utils"
import { createProjectSchema } from "#shared/lib/schemas/project"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = createProjectSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: result.error.flatten().fieldErrors,
    })
  }

  await requireOrgRole(user.id, result.data.organizationId, ["OWNER", "ADMIN"])

  // Check if project with same name already exists in this organization
  const conflictingProject = await db.project.findFirst({
    where: {
      name: result.data.name,
      organizationId: result.data.organizationId,
    },
  })
  if (conflictingProject) {
    throw createError({ statusCode: 409, statusMessage: "A project with this name already exists in the organization" })
  }

  const project = await db.project.create({
    data: {
      name: result.data.name,
      organizationId: result.data.organizationId,
      roles: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
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
              email: true,
              name: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: {
          secrets: true,
        },
      },
    },
  })

  return project
})
