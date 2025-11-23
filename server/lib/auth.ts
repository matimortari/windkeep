import type { H3Event } from "h3"
import { randomBytes } from "node:crypto"
import db from "#server/lib/db"

export async function handleOAuthUser(event: H3Event, userData: OAuthUserData) {
  const { id: providerAccountId, name, email, image, provider } = userData

  // 1. Find existing account by provider
  let account = await db.account.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    include: { user: true },
  })

  let user = account?.user

  // 2. If no account, find user by email
  if (!user) {
    user = await db.user.findUnique({ where: { email } }) ?? undefined

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: name?.trim(),
          image: image || undefined,
        },
      })
    }

    account = await db.account.upsert({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      update: {},
      create: { userId: user.id, provider, providerAccountId },
      include: { user: true },
    })

    user = account.user
  }

  // 3. Determine user's active organization
  const activeMembership = await db.orgMembership.findFirst({
    where: { userId: user.id, isActive: true },
    include: { org: true },
  })

  const activeOrgId = activeMembership?.org?.id ?? null

  const hasActiveOrg = Boolean(activeMembership?.org)

  // 4. Generate API token
  const apiToken = randomBytes(16).toString("hex")

  await db.user.update({
    where: { id: user.id },
    data: { apiToken },
  })

  // 5. Build session object
  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image ?? undefined,
    apiToken,
    activeOrgId,
  }

  await setUserSession(event, { user: sessionUser, loggedInAt: new Date() })

  // 6. Redirect based on onboarding status
  if (!hasActiveOrg) {
    return sendRedirect(event, "/onboarding/create-org")
  }

  return sendRedirect(event, "/admin/projects")
}
