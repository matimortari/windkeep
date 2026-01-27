import db from "#server/utils/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/utils/helpers"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const secretId = getRouterParam(event, "secret")
  if (!projectId || !secretId) {
    throw createError({ status: 400, statusText: "Project ID and Secret ID are required" })
  }

  await requireRole(user.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const secretData = await db.secret.findUnique({
    where: { id: secretId },
    select: {
      id: true,
      key: true,
      projectId: true,
      project: {
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
      },
      _count: {
        select: {
          values: true,
        },
      },
    },
  })
  if (!secretData) {
    throw createError({ status: 404, statusText: "Secret not found" })
  }
  if (secretData.projectId !== projectId) {
    throw createError({ status: 403, statusText: "Secret does not belong to this project" })
  }

  // Create audit log before deletion
  await createAuditLog({
    event,
    userId: user.id,
    orgId: secretData.project.org.id,
    projectId,
    action: "DELETE.SECRET",
    resource: "secret",
    description: `Deleted secret "${secretData.key}" from project "${secretData.project.name}" (${secretData._count.values} value(s) deleted)`,
    metadata: {
      secretId: secretData.id,
      secretKey: secretData.key,
      projectId: secretData.project.id,
      projectName: secretData.project.name,
      orgId: secretData.project.org.id,
      orgName: secretData.project.org.name,
      valuesDeleted: secretData._count.values,
    },
  })

  // Delete the secret (cascade will handle secret values)
  await db.secret.delete({
    where: { id: secretId },
  })

  return { success: true, message: `Secret deleted successfully` }
})
