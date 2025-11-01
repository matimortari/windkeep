import db from "#server/lib/db"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "projectId")
  const secretId = getRouterParam(event, "secretId")
  if (!projectId || !secretId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Secret ID are required" })
  }

  await requireProjectRole(user.id, projectId, ["OWNER", "ADMIN"])

  const secret = await db.secret.findUnique({
    where: { id: secretId },
    select: {
      id: true,
      key: true,
      projectId: true,
      _count: {
        select: {
          values: true,
        },
      },
    },
  })
  if (!secret) {
    throw createError({ statusCode: 404, statusMessage: "Secret not found" })
  }
  if (secret.projectId !== projectId) {
    throw createError({ statusCode: 403, statusMessage: "Secret does not belong to this project" })
  }

  // Delete the secret (cascade will handle secret values)
  await db.secret.delete({
    where: { id: secretId },
  })

  return {
    success: true,
    message: `Secret "${secret.key}" deleted successfully`,
    valuesDeleted: secret._count.values,
  }
})
