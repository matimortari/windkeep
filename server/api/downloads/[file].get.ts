export default defineEventHandler(async (event) => {
  const file = getRouterParam(event, "file")
  if (!file) {
    throw createError({ statusCode: 400, message: "File name is required" })
  }

  // Rate limit: 50 requests per hour per IP
  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown"
  await enforceRateLimit(event, `download:${ip}`, 50)

  const blobUrl = await getBinaryBlobUrl(file)

  return sendRedirect(event, blobUrl, 302)
})

defineRouteMeta({
  openAPI: {
    summary: "Download CLI binary",
    description: "Redirects to the public binary URL for supported CLI download files.",
    tags: ["Downloads"],
    responses: {
      302: { description: "Redirect to the binary URL" },
      400: { description: "Missing file name parameter" },
      404: { description: "Binary not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
