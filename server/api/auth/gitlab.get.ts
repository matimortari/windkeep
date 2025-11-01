import type { H3Event } from "h3"
import { handleOAuthUser } from "#server/lib/auth"

export default defineOAuthGitLabEventHandler({
  config: {
    emailRequired: true,
    clientId: process.env.NUXT_OAUTH_GITLAB_CLIENT_ID,
    clientSecret: process.env.NUXT_OAUTH_GITLAB_CLIENT_SECRET,
    redirectURL: `${process.env.NUXT_PUBLIC_BASE_URL}/api/auth/gitlab`,
  },

  async onSuccess(event: any, { user }: any) {
    if (!user || typeof user !== "object") {
      throw createError({ statusCode: 400, message: "Invalid user data received from GitLab" })
    }

    const gitlabId = user.id?.toString()
    const email = user.email
    const name = user.name || user.username
    const picture = user.avatar_url

    if (!gitlabId || !email) {
      throw createError({ statusCode: 400, message: "Missing required user data from GitLab" })
    }

    return handleOAuthUser(event, {
      id: gitlabId,
      name,
      email,
      image: picture,
      provider: "gitlab",
    })
  },
  async onError(event: H3Event, err: any) {
    console.error("GitLab OAuth error:", err)
    if (!event || !event.node?.res) {
      throw createError({ statusCode: 500, message: "Internal server error" })
    }

    return sendRedirect(event, "/sign-in?error=gitlab_oauth_failed")
  },
})
