import db from "#server/lib/db"
import { decrypt } from "#server/lib/encryption"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const project = getRouterParam(event, "project")
  if (!project) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  await requireProjectRole(user.id, project, ["OWNER", "ADMIN", "MEMBER"])

  const secrets = await db.secret.findMany({
    where: { projectId: project },
    include: {
      values: {
        select: {
          id: true,
          environment: true,
          value: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          environment: "asc",
        },
      },
    },
    orderBy: {
      key: "asc",
    },
  })

  const decryptedSecrets = secrets.map(secret => ({
    ...secret,
    values: secret.values.map(val => ({
      ...val,
      value: decrypt(val.value),
    })),
  }))

  return decryptedSecrets
})
