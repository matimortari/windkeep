import db from "#server/utils/db"
import { getUserFromSession } from "#server/utils/helpers"
import { del } from "@vercel/blob"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  // Find organizations where user is the sole owner and delete them
  const ownedOrgs = await db.orgMembership.findMany({
    where: {
      userId: user.id,
      role: "OWNER",
    },
    include: {
      org: {
        include: {
          memberships: true,
        },
      },
    },
  })
  for (const membership of ownedOrgs) {
    const ownerCount = membership.org.memberships.filter(m => m.role === "OWNER").length
    if (ownerCount === 1) {
      await db.organization.delete({
        where: { id: membership.org.id },
      })
    }
  }

  // Delete user's avatar from blob storage if it exists
  if (user.image && user.image.includes("blob.vercel-storage.com")) {
    await del(user.image)
  }

  // Delete the user (cascade will handle related records)
  await db.user.delete({
    where: { id: user.id },
  })

  // Clear the session
  await clearUserSession(event)

  return { success: true, message: "User deleted successfully" }
})
