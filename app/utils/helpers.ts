/**
 * Returns a formatted date string or a placeholder if the date is null/undefined.
 */
export function formatDate(date?: string | Date | null): string {
  if (!date) {
    return "-"
  }

  const dt = typeof date === "string" ? new Date(date) : date
  const formatted = dt.toLocaleDateString("en-US", {
    year: "2-digit",
    month: "short",
    day: "numeric",
  })

  return formatted.charAt(0).toLowerCase() + formatted.slice(1)
}

/**
 * Capitalizes the first letter of the given string.
 */
export function capitalizeFirst(str: string) {
  return str.charAt(0) + str.slice(1).toLowerCase()
}

/**
 * Normalizes a string to be used as an environment variable key.
 */
export function normalizeKey(key: string): string {
  return key.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "")
}

/**
 * Extracts the error message from various error formats (Nuxt/H3/Zod).
 */
export function getErrorMessage(err: any, fallback: string): string {
  return err?.data?.statusMessage || err?.data?.message || err?.statusMessage || err?.message || fallback
}

/**
 * Signs in the user by redirecting to the provider's authentication endpoint.
 */
export function signIn(provider: string) {
  navigateTo(`/api/auth/${provider}`, { external: true })
}

/**
  Signs out the current user by calling the logout endpoint and clearing the session.
 */
export async function signOut() {
  const { clear } = useUserSession()

  await $fetch("/api/auth/logout", { method: "POST", credentials: "include" })
  await clear()
  await navigateTo("/")
}
