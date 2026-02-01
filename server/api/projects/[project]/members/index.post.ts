import db from "#server/utils/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/utils/helpers"
import { CacheKeys, deleteCached } from "#server/utils/redis"
import { addProjectMemberSchema } from "#shared/schemas/project-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ status: 400, statusText: "Project ID is required" })
  }

  await requireRole(user.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = addProjectMemberSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      org: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
  if (!project) {
    throw createError({ status: 404, statusText: "Project not found" })
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
    throw createError({ status: 404, statusText: "User not found" })
  }

  const orgMembership = await db.orgMembership.findUnique({
    where: {
      userId_orgId: {
        userId: result.data.userId,
        orgId: project.org.id,
      },
    },
  })
  if (!orgMembership) {
    throw createError({ status: 403, statusText: "User must be a member of the organization first" })
  }

  const existingRole = await db.projectMembership.findUnique({
    where: {
      userId_projectId: {
        userId: result.data.userId,
        projectId,
      },
    },
  })
  if (existingRole) {
    throw createError({ status: 409, statusText: "User is already a member of this project" })
  }

  const projectRole = await db.projectMembership.create({
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

  await createAuditLog({
    event,
    userId: user.id,
    orgId: project.org.id,
    projectId,
    action: "ADD.PROJECT_MEMBER",
    resource: "project_member",
    description: `Added ${projectRole.user.name} (${projectRole.user.email}) as ${projectRole.role} to project "${projectRole.project.name}"`,
    metadata: {
      userId: projectRole.user.id,
      userEmail: projectRole.user.email,
      userName: projectRole.user.name,
      userRole: projectRole.role,
      projectName: projectRole.project.name,
      projectId: projectRole.project.id,
      orgId: project.org.id,
      orgName: project.org.name,
    },
  })

  // Invalidate cache for added user's data and projects
  await deleteCached(CacheKeys.userData(result.data.userId), CacheKeys.userProjects(result.data.userId))

  return { projectRole }
})
