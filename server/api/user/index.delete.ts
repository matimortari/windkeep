import db from "#server/utils/db"
import { getUserFromSession } from "#server/utils/helpers"
import { deleteFile } from "#server/utils/storage"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  // Find organizations where user is the owner
  const ownedOrgs = await db.orgMembership.findMany({
    where: { userId: user.id, role: "OWNER" },
    include: { org: { include: { memberships: true } } },
  })

  // Check for organizations where user is owner but there are other members
  const orphanedOrgs: string[] = []
  for (const membership of ownedOrgs) {
    if (membership.org.memberships.length > 1) {
      orphanedOrgs.push(membership.org.name)
    }
  }
  if (orphanedOrgs.length > 0) {
    throw createError({ status: 400, statusText: `Cannot delete account. You are the owner of organizations with other members: ${orphanedOrgs.join(", ")}. Please transfer ownership or delete these organizations first.` })
  }

  // Delete organizations where user is owner with no other members
  for (const membership of ownedOrgs) {
    if (membership.org.memberships.length === 1) {
      await db.organization.delete({
        where: { id: membership.org.id },
      })
    }
  }

  // Delete user's avatar from blob storage if it exists
  if (user.image) {
    await deleteFile(user.image).catch(() => {})
  }

  // Delete the user (cascade will handle related records)
  await db.user.delete({ where: { id: user.id } })
  await clearUserSession(event)

  return { success: true, message: "User deleted successfully" }
})
