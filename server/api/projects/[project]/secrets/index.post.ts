import db from "#server/lib/db"
import { decrypt, encrypt } from "#server/lib/encryption"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"
import { createSecretSchema } from "#shared/lib/schemas/secret-schema"

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
    projectId: project,
  })
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: result.error.flatten().fieldErrors,
    })
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
    projectId: project,
  }

  if (result.data.values && Array.isArray(result.data.values)) {
    secretData.values = {
      create: result.data.values.map((val: any) => ({
        environment: val.environment,
        value: encrypt(val.value),
      })),
    }
  }

  const secret = await db.secret.create({
    data: secretData,
    include: {
      values: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return {
    ...secret,
    values: secret.values.map(val => ({
      ...val,
      value: decrypt(val.value),
    })),
  }
})
