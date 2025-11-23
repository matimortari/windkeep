import db from "#server/lib/db"
import { getUserFromSession } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  const memberships = await db.orgMembership.findMany({
    where: { userId: user.id },
    select: {
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  const organizations = memberships.map(m => ({
    ...m.org,
    role: m.role,
  }))

  return organizations
})
