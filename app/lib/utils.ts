export function formatDate(date?: string | Date | null): string {
  if (!date)
    return "-"

  const dt = typeof date === "string" ? new Date(date) : date
  const formatted = dt.toLocaleDateString("en-US", {
    year: "2-digit",
    month: "short",
    day: "numeric",
  })

  return formatted.charAt(0).toLowerCase() + formatted.slice(1)
}

export function copyToClipboard(val: string) {
  if (val)
    navigator.clipboard.writeText(val)
}

export function capitalizeFirst(str: string) {
  return str.charAt(0) + str.slice(1).toLowerCase()
}

export function getBaseUrl(): string {
  const config = useRuntimeConfig()
  const url = config.public.baseUrl
  if (!url || typeof url !== "string") {
    throw new Error("Base URL is not defined in runtime config.")
  }

  return url
}

export function normalizeKey(key: string): string {
  return key
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
}
