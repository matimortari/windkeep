declare module "#auth-utils" {
  interface User {
    id: string
    email: string
    name: string
    image?: string
    apiToken?: string
  }

  interface UserSession {
    user: User
    loggedInAt: Date
  }

  interface Account {
    id: string
    userId: string
    provider: string
    providerAccountId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user?: User
  }
}

interface OAuthUserData {
  id: string
  email: string
  name: string
  image: string | null
  provider: "google" | "github" | "gitlab"
}
