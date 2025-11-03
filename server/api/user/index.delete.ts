import db from "#server/lib/db"
import { getUserFromSession } from "#server/lib/utils"
import { del } from "@vercel/blob"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  // Find organizations where user is the sole owner and delete them
  const ownedOrgs = await db.organizationMembership.findMany({
    where: {
      userId: user.id,
      role: "OWNER",
    },
    include: {
      organization: {
        include: {
          memberships: true,
        },
      },
    },
  })

  for (const membership of ownedOrgs) {
    const ownerCount = membership.organization.memberships.filter(m => m.role === "OWNER").length
    if (ownerCount === 1) {
      await db.organization.delete({
        where: { id: membership.organization.id },
      })
    }
  }

  // Delete user's avatar from blob storage if it exists
  if (user.image && user.image.includes("blob.vercel-storage.com")) {
    try {
      await del(user.image)
    }
    catch (error) {
      console.error("Failed to delete user avatar:", error)
    }
  }

  // Delete the user (cascade will handle related records)
  await db.user.delete({
    where: { id: user.id },
  })

  // Clear the session
  await clearUserSession(event)

  return { success: true, message: "Account deleted successfully" }
})
