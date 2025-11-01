import type { H3Event } from "h3"
import { randomBytes } from "node:crypto"
import db from "#server/lib/db"
import { sendRedirect } from "h3"

export async function handleOAuthUser(event: H3Event, userData: OAuthUserData) {
  const { id: providerAccountId, name, email, image, provider } = userData

  // 1. Find existing account by provider
  let account = await db.account.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    include: { user: true },
  })

  let user = account?.user
  let isNewUser = false

  // 2. If no account, find user by email
  if (!user) {
    user = await db.user.findUnique({ where: { email } }) ?? undefined

    // 3. If still no user, create the user (without org) and flag as new
    if (!user) {
      isNewUser = true
      user = await db.user.create({
        data: {
          email,
          name: name?.trim() || "",
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

  // 5. Generate API token
  const apiToken = randomBytes(16).toString("hex")
  await db.user.update({
    where: { id: user.id },
    data: { apiToken },
  })

  // 6. Build session object
  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    apiToken,
  }

  await setUserSession(event, { user: sessionUser, loggedInAt: new Date() })

  // 7. Redirect based on onboarding status
  if (isNewUser) {
    return sendRedirect(event, "/onboarding/create-org")
  }

  return sendRedirect(event, "/admin/projects")
}
