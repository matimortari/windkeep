import db from "#server/lib/db"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "projectId")
  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  await requireProjectRole(user.id, projectId, ["OWNER"])

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          secrets: true,
        },
      },
    },
  })
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
  }

  // Delete the project (cascade will handle secrets, secret values, roles, and audit logs)
  await db.project.delete({
    where: { id: projectId },
  })

  return {
    success: true,
    message: `Project "${project.name}" deleted successfully`,
    secretsDeleted: project._count.secrets,
  }
})
