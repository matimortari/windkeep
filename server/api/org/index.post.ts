import db from "#server/lib/db"
import { getUserFromSession } from "#server/lib/utils"
import { createOrganizationSchema } from "#shared/lib/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = createOrganizationSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: result.error.flatten().fieldErrors,
    })
  }

  const organization = await db.organization.create({
    data: {
      name: result.data.name,
      memberships: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
    include: {
      memberships: {
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
    },
  })

  return organization
})
