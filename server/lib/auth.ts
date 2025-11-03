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

    // 3. If still no user, create the user
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: name?.trim(),
          image: image || undefined,
        },
      })
    }

    // 4. Link provider account
    account = await db.account.upsert({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      update: {},
      create: { userId: user.id, provider, providerAccountId },
      include: { user: true },
    })

    user = account.user
  }

  // 5. Check if user needs active org set
  if (!user.activeOrgId) {
    const membership = await db.organizationMembership.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    })

    if (membership?.organization) {
      await db.user.update({
        where: { id: user.id },
        data: { activeOrgId: membership.organization.id },
      })
      user.activeOrgId = membership.organization.id
    }
  }

  // 6. Generate API token
  const apiToken = randomBytes(16).toString("hex")
  await db.user.update({
    where: { id: user.id },
    data: { apiToken },
  })

  // 7. Build session object
  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    apiToken,
  }

  await setUserSession(event, { user: sessionUser, loggedInAt: new Date() })

  // 8. Redirect based on onboarding status
  if (!user.activeOrgId) {
    return sendRedirect(event, "/onboarding/create-org")
  }

  return sendRedirect(event, "/admin/projects")
}
