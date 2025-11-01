import db from "#server/lib/db"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"
import { updateProjectSchema } from "#shared/lib/schemas/project"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "projectId")
  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  await requireProjectRole(user.id, projectId, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateProjectSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: result.error.flatten().fieldErrors,
    })
  }

  const existingProject = await db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  })
  if (!existingProject) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
  }

  // Check if project with same name already exists in this organization
  if (result.data.name) {
    const conflictingProject = await db.project.findFirst({
      where: {
        name: result.data.name,
        organizationId: existingProject.organizationId,
        NOT: { id: projectId },
      },
    })
    if (conflictingProject) {
      throw createError({ statusCode: 409, statusMessage: "A project with this name already exists in the organization" })
    }
  }

  const updatedProject = await db.project.update({
    where: { id: projectId },
    data: {
      name: result.data.name,
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

  return updatedProject
})
