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

  // Check if project with same name or slug already exists
  if (result.data.name || result.data.slug) {
    const conflictingProject = await db.project.findFirst({
      where: {
        OR: [
          result.data.name ? { name: result.data.name, organizationId: existingProject.organizationId } : {},
          result.data.slug ? { slug: result.data.slug } : {},
        ].filter(condition => Object.keys(condition).length > 0),
        NOT: { id: projectId },
      },
    })
    if (conflictingProject) {
      if (conflictingProject.slug === result.data.slug) {
        throw createError({ statusCode: 409, statusMessage: "A project with this slug already exists" })
      }
      throw createError({ statusCode: 409, statusMessage: "A project with this name already exists in the organization" })
    }
  }

  const updatedProject = await db.project.update({
    where: { id: projectId },
    data: {
      name: result.data.name,
      slug: result.data.slug,
      description: result.data.description,
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
