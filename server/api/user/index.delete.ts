import db from "#server/utils/db"
import { getUserFromSession } from "#server/utils/helpers"
import { del } from "@vercel/blob"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  // Find organizations where user is the sole owner
  const ownedOrgs = await db.orgMembership.findMany({
    where: { userId: user.id, role: "OWNER" },
    include: {
      org: {
        include: {
          memberships: true,
        },
      },
    },
  })

  // Check for organizations where user is sole owner but there are other members
  const orphanedOrgs: string[] = []
  for (const membership of ownedOrgs) {
    const ownerCount = membership.org.memberships.filter(m => m.role === "OWNER").length
    if (ownerCount === 1 && membership.org.memberships.length > 1) {
      orphanedOrgs.push(membership.org.name)
    }
  }
  if (orphanedOrgs.length > 0) {
    throw createError({ status: 400, statusText: `Cannot delete account. You are the sole owner of organizations with other members: ${orphanedOrgs.join(", ")}. Please transfer ownership or delete these organizations first.` })
  }

  // Delete organizations where user is sole owner with no other members
  for (const membership of ownedOrgs) {
    const ownerCount = membership.org.memberships.filter(m => m.role === "OWNER").length
    const totalMembers = membership.org.memberships.length
    if (ownerCount === 1 && totalMembers === 1) {
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
