import type { H3Event } from "h3"
import db from "#server/utils/db"
import { generateToken } from "#server/utils/helpers"

export async function handleOAuthUser(event: H3Event, userData: OAuthUserData) {
  const { id: providerAccountId, name, email, image, provider } = userData

  // Find existing account by provider
  let account = await db.account.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    include: { user: true },
  })

  let user: any = account?.user ?? null
  if (!user) {
    user = await db.user.findUnique({
      where: { email },
      include: {
        orgMemberships: true,
        projectMemberships: true,
        invitations: true,
        auditLogs: true,
      },
    })
  }

  // If still no user, create one
  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name: name?.trim() ?? email.split("@")[0],
        image: image || `${process.env.R2_PUBLIC_URL}/defaults/avatar.png`,
        apiToken: generateToken(),
      },
    })
  }

  // Upsert account
  account = await db.account.upsert({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    update: {},
    create: { userId: user.id, provider, providerAccountId },
    include: { user: true },
  })

  user = account.user

  // Determine user's active organization
  const activeMembership = await db.orgMembership.findFirst({
    where: { userId: user.id, isActive: true },
    include: { org: true },
  })

  // Build session object
  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    apiToken: user.apiToken ?? undefined,
    activeOrgId: activeMembership?.org?.id ?? null,
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
  await setUserSession(event, { user: sessionUser, loggedInAt: now, expiresAt, lastActivityAt: now })

  return sendRedirect(event, activeMembership?.org ? "/admin/projects" : "/onboarding/create-org")
}
