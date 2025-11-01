import db from "#server/lib/db"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"
import { addProjectMemberSchema } from "#shared/lib/schemas/project"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "projectId")

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  await requireProjectRole(user.id, projectId, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = addProjectMemberSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: result.error.flatten().fieldErrors,
    })
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      organizationId: true,
    },
  })
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
  }

  const targetUser = await db.user.findUnique({
    where: { id: result.data.userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
    },
  })
  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: "User not found" })
  }

  const orgMembership = await db.organizationMembership.findUnique({
    where: {
      userId_organizationId: {
        userId: result.data.userId,
        organizationId: project.organizationId,
      },
    },
  })
  if (!orgMembership) {
    throw createError({ statusCode: 403, statusMessage: "User must be a member of the organization first" })
  }

  const existingRole = await db.projectRole.findUnique({
    where: {
      userId_projectId: {
        userId: result.data.userId,
        projectId,
      },
    },
  })
  if (existingRole) {
    throw createError({ statusCode: 409, statusMessage: "User is already a member of this project" })
  }

  const projectRole = await db.projectRole.create({
    data: {
      userId: result.data.userId,
      projectId,
      role: result.data.role || "MEMBER",
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return projectRole
})
