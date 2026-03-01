export default defineEventHandler(async (event) => {
  // Rate limit: 50 requests per hour per IP
  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown"
  await enforceRateLimit(event, `download:${ip}`, 50, 60 * 60 * 1000)

  const binary = getRouterParam(event, "binary")
  if (!binary) {
    throw createError({ status: 400, message: "Binary name is required" })
  }

  const blobUrl = await getBinaryBlobUrl(binary)
  return sendRedirect(event, blobUrl, 302)
})
