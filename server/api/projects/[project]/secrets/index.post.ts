import db from "#server/lib/db"
import { encrypt } from "#server/lib/encryption"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"
import { createSecretSchema } from "#shared/lib/schemas/secret"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const project = getRouterParam(event, "project")
  if (!project) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  await requireProjectRole(user.id, project, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = createSecretSchema.safeParse({
    ...body,
    project,
  })
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: result.error.flatten().fieldErrors,
    })
  }

  // Validate secret key format (alphanumeric, underscores, dashes)
  const keyRegex = /^[A-Z0-9_]+$/
  if (!keyRegex.test(result.data.key)) {
    throw createError({ statusCode: 400, statusMessage: "Secret key must contain only uppercase letters, numbers, and underscores" })
  }

  const existingSecret = await db.secret.findUnique({
    where: {
      key_projectId: {
        key: result.data.key,
        projectId: project,
      },
    },
  })
  if (existingSecret) {
    throw createError({ statusCode: 409, statusMessage: "A secret with this key already exists in the project" })
  }

  const secretData: any = {
    key: result.data.key,
    description: result.data.description,
    project,
  }

  if (body.values && Array.isArray(body.values)) {
    secretData.values = {
      create: body.values.map((val: any) => ({
        environment: val.environment,
        value: encrypt(val.value),
      })),
    }
  }

  const secret = await db.secret.create({
    data: secretData,
    include: {
      values: {
        select: {
          id: true,
          environment: true,
          createdAt: true,
          updatedAt: true,
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

  return secret
})
