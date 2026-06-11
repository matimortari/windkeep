export default defineEventHandler(async (event) => {
  const file = getRouterParam(event, "file")
  if (!file) {
    throw createError({ status: 400, message: "File name is required" })
  }

  // Rate limit: 50 requests per hour per IP
  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown"
  await enforceRateLimit(event, `download:${ip}`, 50)

  const blobUrl = await getBinaryBlobUrl(file)

  return sendRedirect(event, blobUrl, 302)
})
